import express from 'express';
import { webhookCallback } from 'grammy';
import { createTelegramBot, clearCapturedResponses, capturedResponses } from '../src/bot/bot';
import { config } from '../src/config/env';
import { db } from '../src/database/db';

const app = express();
app.use(express.json());

// Initialize bot
const bot = createTelegramBot();
const webhookPath = `/telegram-webhook/${config.WEBHOOK_SECRET || 'secret'}`;

// 1. Telegram Webhook Endpoint
app.post(webhookPath, webhookCallback(bot, 'express'));
app.post('/api/webhook', webhookCallback(bot, 'express'));

// 2. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    platform: 'vercel-serverless',
  });
});

app.get('/api/telegram/status', async (req, res) => {
  try {
    let webhookInfo: any = null;
    let botUser: any = null;
    if (config.TELEGRAM_BOT_TOKEN) {
      try {
        botUser = await bot.api.getMe();
        webhookInfo = await bot.api.getWebhookInfo();
      } catch (e: any) {
        console.warn('Telegram info fetch warning:', e.message);
      }
    }

    res.json({
      status: config.TELEGRAM_BOT_TOKEN ? 'configured' : 'offline',
      mode: 'webhook',
      botInfo: botUser ? { username: botUser.username, firstName: botUser.first_name, id: botUser.id } : null,
      webhookInfo,
      webhookPath,
      appUrl: config.APP_URL,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Webhook Setup
app.post('/api/telegram/set-webhook', async (req, res) => {
  try {
    const url = req.body?.url || `${config.APP_URL}${webhookPath}`;
    if (!url.startsWith('https://')) {
      res.status(400).json({ error: 'Telegram requires an HTTPS webhook URL.' });
      return;
    }

    await bot.api.setWebhook(url, {
      secret_token: config.WEBHOOK_SECRET || undefined,
      drop_pending_updates: false,
    });

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

// 4. Simulator Update for UI Testing
app.post('/api/simulator/update', async (req, res) => {
  try {
    const update = req.body;
    if (!update || typeof update !== 'object') {
      res.status(400).json({ error: 'Invalid update payload' });
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
    res.status(500).json({ error: (err as Error).message });
  }
});

// 5. Campaigns & Public Stats
app.get('/api/campaigns', (req, res) => {
  const stats = db.getSystemStats();
  res.json({
    success: true,
    stats,
    packages: db.getPackages(),
  });
});

// 6. Monetag & Mini App Configuration
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

// 7. Mini App User Profile
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

// 8. Claim Monetag Ad Reward
app.post('/api/miniapp/claim-ad-reward', (req, res) => {
  const { telegramId, adType } = req.body;
  const tIdParsed = parseInt(telegramId, 10);
  const tId = isNaN(tIdParsed) ? 88776655 : tIdParsed;

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

export default app;
