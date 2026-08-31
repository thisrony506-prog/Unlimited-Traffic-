import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { webhookCallback } from 'grammy';
import { createTelegramBot, clearCapturedResponses, capturedResponses } from './src/bot/bot';
import { config } from './src/config/env';
import { db } from './src/database/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize GrammY bot
  const bot = createTelegramBot();

  let isPolling = false;
  let pollingError: string | null = null;
  let connectionMode: 'polling' | 'webhook' | 'offline' = 'offline';
  let realBotInfo: any = null;

  // Function to initialize Long Polling
  async function startLongPolling() {
    if (!config.TELEGRAM_BOT_TOKEN) {
      pollingError = 'TELEGRAM_BOT_TOKEN is not configured.';
      connectionMode = 'offline';
      return;
    }

    try {
      realBotInfo = await bot.api.getMe();
      console.log(`✅ Telegram Bot verified: @${realBotInfo.username} (ID: ${realBotInfo.id})`);

      // Clear any existing webhook to enable Long Polling
      try {
        await bot.api.deleteWebhook({ drop_pending_updates: false });
        console.log('🔄 Cleared any active Telegram webhook for Long Polling.');
      } catch (err: any) {
        console.warn('Notice on deleteWebhook:', err?.message);
      }

      isPolling = true;
      pollingError = null;
      connectionMode = 'polling';

      bot.start({
        drop_pending_updates: false,
        onStart: (info) => {
          realBotInfo = info;
          isPolling = true;
          connectionMode = 'polling';
          console.log(`🚀 Telegram Bot @${info.username} is now actively running and listening for messages via Long Polling!`);
        },
      }).catch((err) => {
        isPolling = false;
        pollingError = err.message || 'Long Polling error';
        console.warn('Long polling ended or encountered error:', err.message);
      });
    } catch (err: any) {
      isPolling = false;
      pollingError = err.message || 'Failed to authenticate bot token with Telegram API';
      connectionMode = 'offline';
      console.warn('⚠️ Telegram Bot authentication check:', pollingError);
    }
  }

  // Start Long Polling by default if token is present
  startLongPolling().catch(() => {});

  // Real Telegram Webhook Handler Route
  const webhookPath = `/api/telegram/webhook`;
  app.post(webhookPath, (req, res) => {
    // Validate secret token if configured
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (config.WEBHOOK_SECRET && secret && secret !== config.WEBHOOK_SECRET) {
      res.status(403).send('Forbidden: Invalid webhook secret token');
      return;
    }
    webhookCallback(bot, 'express')(req, res);
  });

  // Alternative standard webhook path
  app.post('/telegram/webhook', (req, res) => {
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (config.WEBHOOK_SECRET && secret && secret !== config.WEBHOOK_SECRET) {
      res.status(403).send('Forbidden');
      return;
    }
    webhookCallback(bot, 'express')(req, res);
  });

  // --- API ROUTE: BOT STATUS & STATS ---
  app.get('/api/status', async (req, res) => {
    let botInfo = realBotInfo;
    let botConnected = false;
    let webhookInfo: any = null;

    try {
      if (!botInfo) {
        botInfo = await bot.api.getMe();
        realBotInfo = botInfo;
      }
      botConnected = true;
    } catch {
      botInfo = botInfo || {
        id: 8864392110,
        is_bot: true,
        first_name: 'InfiniteHits Bot',
        username: config.BOT_USERNAME,
      };
    }

    try {
      webhookInfo = await bot.api.getWebhookInfo();
    } catch {}

    const systemStats = db.getSystemStats();

    res.json({
      success: true,
      bot: {
        username: realBotInfo?.username || config.BOT_USERNAME,
        firstName: realBotInfo?.first_name || 'InfiniteHits Bot',
        id: realBotInfo?.id || null,
        tokenConfigured: Boolean(config.TELEGRAM_BOT_TOKEN),
        botConnected,
        botInfo,
        isPolling,
        pollingError,
        connectionMode: isPolling ? 'polling' : webhookInfo?.url ? 'webhook' : connectionMode,
      },
      webhook: {
        endpoint: `${config.APP_URL}${webhookPath}`,
        currentUrl: webhookInfo?.url || '',
        pendingUpdateCount: webhookInfo?.pending_update_count || 0,
        lastErrorMessage: webhookInfo?.last_error_message || '',
        secretConfigured: Boolean(config.WEBHOOK_SECRET),
      },
      stats: systemStats,
      config: {
        newUserBonus: config.NEW_USER_BONUS,
        dailyBonus: config.DAILY_BONUS_AMOUNT,
        referralReward: config.REFERRAL_REWARD_AMOUNT,
        minVisitSeconds: config.MIN_VISIT_SECONDS,
        bkashNumber: config.PAYMENT_BKASH_NUMBER,
        nagadNumber: config.PAYMENT_NAGAD_NUMBER,
        supportUsername: config.SUPPORT_USERNAME,
      },
    });
  });

  // --- API ROUTE: SWITCH / RESTART LONG POLLING ---
  app.post('/api/telegram/start-polling', async (req, res) => {
    try {
      if (isPolling) {
        bot.stop();
        isPolling = false;
      }
      await startLongPolling();
      res.json({
        success: true,
        message: 'Telegram Long Polling initiated',
        isPolling,
        botInfo: realBotInfo,
        error: pollingError,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTE: SET WEBHOOK ---
  app.post('/api/telegram/set-webhook', async (req, res) => {
    try {
      const url = req.body?.url || `${config.APP_URL}${webhookPath}`;
      if (!url.startsWith('https://')) {
        res.status(400).json({ error: 'Telegram requires an HTTPS webhook URL.' });
        return;
      }

      if (isPolling) {
        bot.stop();
        isPolling = false;
      }

      await bot.api.setWebhook(url, {
        secret_token: config.WEBHOOK_SECRET || undefined,
        drop_pending_updates: false,
      });

      connectionMode = 'webhook';

      const info = await bot.api.getWebhookInfo();
      res.json({
        success: true,
        message: `Webhook successfully set to ${url}`,
        webhookInfo: info,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTE: DELETE WEBHOOK ---
  app.post('/api/telegram/delete-webhook', async (req, res) => {
    try {
      await bot.api.deleteWebhook({ drop_pending_updates: false });
      connectionMode = 'offline';
      res.json({ success: true, message: 'Webhook deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- API ROUTE: INTERACTIVE TELEGRAM BOT SIMULATOR FOR AI STUDIO PREVIEW ---
  app.post('/api/simulator/update', async (req, res) => {
    try {
      const update = req.body;
      if (!update || typeof update !== 'object') {
        res.status(400).json({ error: 'Invalid Telegram update payload' });
        return;
      }
      clearCapturedResponses();
      await bot.handleUpdate(update);
      res.json({
        success: true,
        responses: [...capturedResponses],
        message: 'Update processed by InfiniteHits bot engine',
      });
    } catch (err) {
      console.error('Error in simulator update handler:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // --- API ROUTE: CAMPAIGNS LIST (PUBLIC STATS) ---
  app.get('/api/campaigns', (req, res) => {
    const stats = db.getSystemStats();
    res.json({
      success: true,
      stats,
      packages: db.getPackages(),
    });
  });

  // --- API ROUTE: MONETAG & MINI APP CONFIG ---
  app.get('/api/miniapp/config', (req, res) => {
    res.json({
      success: true,
      config: {
        zoneId: config.MONETAG_ZONE_ID,
        directLink: config.MONETAG_DIRECT_LINK,
        tagUrl: config.MONETAG_TAG_URL,
        rewardCredits: config.MONETAG_REWARD_CREDITS,
        dailyLimit: config.MONETAG_DAILY_LIMIT,
        botUsername: config.BOT_USERNAME,
        appUrl: config.APP_URL,
      },
    });
  });

  app.post('/api/miniapp/config', (req, res) => {
    const { zoneId, directLink, tagUrl, rewardCredits, dailyLimit } = req.body;
    if (zoneId) config.MONETAG_ZONE_ID = String(zoneId).trim();
    if (directLink) config.MONETAG_DIRECT_LINK = String(directLink).trim();
    if (tagUrl) config.MONETAG_TAG_URL = String(tagUrl).trim();
    if (rewardCredits !== undefined) config.MONETAG_REWARD_CREDITS = Number(rewardCredits) || 5;
    if (dailyLimit !== undefined) config.MONETAG_DAILY_LIMIT = Number(dailyLimit) || 20;

    res.json({
      success: true,
      message: 'Monetag configuration updated',
      config: {
        zoneId: config.MONETAG_ZONE_ID,
        directLink: config.MONETAG_DIRECT_LINK,
        tagUrl: config.MONETAG_TAG_URL,
        rewardCredits: config.MONETAG_REWARD_CREDITS,
        dailyLimit: config.MONETAG_DAILY_LIMIT,
      },
    });
  });

  // --- API ROUTE: MINI APP USER PROFILE & STATS ---
  app.get('/api/miniapp/user/:telegramId', (req, res) => {
    const telegramId = parseInt(req.params.telegramId, 10);
    if (!telegramId || isNaN(telegramId)) {
      res.status(400).json({ error: 'Invalid telegramId' });
      return;
    }

    let user = db.getUser(telegramId);
    if (!user) {
      const resUser = db.getOrCreateUser(telegramId, 'Alex Rivera', undefined, 'alex_web');
      user = resUser.user;
    }

    const monetagStats = db.getMonetagStats(telegramId);
    const activeCampaigns = db.getActiveCampaigns(telegramId);

    res.json({
      success: true,
      user: {
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        balance: user.balance,
        totalEarned: user.totalEarned,
        totalSpent: user.totalSpent,
        referralCode: user.referralCode,
        referralCount: user.referralCount,
        referralEarnings: user.referralEarnings,
      },
      monetag: monetagStats,
      activeCampaignsCount: activeCampaigns.length,
    });
  });

  // --- API ROUTE: CLAIM MONETAG AD REWARD IN MINI APP ---
  app.post('/api/miniapp/claim-ad-reward', (req, res) => {
    const { telegramId, adType } = req.body;
    const tId直 = parseInt(telegramId, 10);
    const tId = isNaN(tId直) ? 88776655 : tId直;

    // Ensure user exists
    let user = db.getUser(tId);
    if (!user) {
      const resUser = db.getOrCreateUser(tId, 'MiniApp User', undefined, 'miniapp_user');
      user = resUser.user;
    }

    const claimRes = db.claimMonetagAdReward(tId, adType || 'rewarded_interstitial');
    if (!claimRes.success) {
      res.status(400).json({
        success: false,
        error: claimRes.error,
        remainingToday: claimRes.remainingToday || 0,
      });
      return;
    }

    res.json({
      success: true,
      amount: claimRes.amount,
      newBalance: claimRes.newBalance,
      adsWatchedToday: claimRes.adsWatchedToday,
      remainingToday: claimRes.remainingToday,
      message: `🎉 +${claimRes.amount} Credits awarded!`,
    });
  });

  // Vite middleware for development / production static SPA
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`InfiniteHits Telegram Bot engine running on http://0.0.0.0:${PORT}`);
    });
  }

  return app;
}

startServer();
