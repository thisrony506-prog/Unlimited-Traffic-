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
  bot.init().catch(() => {});

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
    let botInfo = null;
    let botConnected = false;

    try {
      botInfo = await bot.api.getMe();
      botConnected = true;
    } catch {
      botInfo = {
        id: 8864392110,
        is_bot: true,
        first_name: 'InfiniteHits Bot',
        username: config.BOT_USERNAME,
      };
    }

    const systemStats = db.getSystemStats();

    res.json({
      success: true,
      bot: {
        username: config.BOT_USERNAME,
        tokenConfigured: Boolean(config.TELEGRAM_BOT_TOKEN),
        botConnected,
        botInfo,
      },
      webhook: {
        endpoint: `${config.APP_URL}${webhookPath}`,
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
