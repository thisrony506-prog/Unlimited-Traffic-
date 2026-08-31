import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { webhookCallback } from 'grammy';
import { createTelegramBot, clearCapturedResponses, capturedResponses } from './src/bot/bot';
import { config } from './src/config/env';
import { dbService } from './src/database/db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize GrammY bot
  const bot = createTelegramBot();
  bot.init().catch(() => {});

  // Telegram Webhook Handler Route
  const webhookPath = `/telegram/webhook`;
  app.post(webhookPath, (req, res) => {
    // Check webhook secret token if configured
    const secret = req.headers['x-telegram-bot-api-secret-token'];
    if (config.WEBHOOK_SECRET && secret && secret !== config.WEBHOOK_SECRET) {
      res.status(403).send('Forbidden');
      return;
    }
    webhookCallback(bot, 'express')(req, res);
  });

  // --- API ROUTE: BOT STATUS & DASHBOARD DATA ---
  app.get('/api/status', async (req, res) => {
    const users = dbService.getAllUsers();
    const tasks = dbService.getAvailableTasks();
    const submissions = dbService.getAllSubmissions();
    const withdrawals = dbService.getAllWithdrawals();
    const settings = dbService.getSettings();
    const latestAnn = dbService.getLatestAnnouncement();

    let botInfo = null;
    let botConnected = false;

    try {
      botInfo = await bot.api.getMe();
      botConnected = true;
    } catch {
      botInfo = { id: 8864392110, is_bot: true, first_name: 'EarnFlow', username: config.BOT_USERNAME };
    }

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
      stats: {
        totalUsers: users.length,
        totalTasks: tasks.length,
        pendingSubmissions: submissions.filter((s) => s.status === 'pending').length,
        approvedSubmissions: submissions.filter((s) => s.status === 'approved').length,
        pendingWithdrawals: withdrawals.filter((w) => w.status === 'pending').length,
        totalWithdrawalAmount: withdrawals
          .filter((w) => w.status === 'paid' || w.status === 'approved')
          .reduce((acc, w) => acc + w.amount, 0),
      },
      settings,
      latestAnnouncement: latestAnn,
      submissions,
      withdrawals,
      tasks,
    });
  });

  // --- API ROUTE: INTERACTIVE BOT SIMULATOR FOR BROWSER ---
  app.post('/api/simulator/update', async (req, res) => {
    try {
      const update = req.body;
      if (!update || typeof update !== 'object') {
        res.status(400).json({ error: 'Invalid Telegram update payload' });
        return;
      }
      clearCapturedResponses();
      await bot.handleUpdate(update);
      res.json({ success: true, responses: [...capturedResponses], message: 'Update handled by Telegram bot' });
    } catch (err) {
      console.error('Error in simulator update handler:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // --- API ROUTE: ADMIN APPROVE/REJECT SUBMISSIONS ---
  app.post('/api/admin/approve-submission', async (req, res) => {
    const { submissionId } = req.body;
    if (!submissionId) {
      res.status(400).json({ error: 'submissionId required' });
      return;
    }
    const result = dbService.approveTaskSubmission(submissionId);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    // Try sending notification to user in Telegram
    if (result.submission && result.user) {
      try {
        await bot.api.sendMessage(
          result.user.telegramId,
          `✅ *Task Approved!*\n\n` +
            `Task: ${result.submission.taskTitle || 'Completed Task'}\n` +
            `Reward: ৳${result.submission.rewardAmount.toFixed(2)} credited to your wallet balance.`,
          { parse_mode: 'Markdown' }
        );
      } catch {
        // User may not have started real Telegram bot
      }
    }

    res.json(result);
  });

  app.post('/api/admin/reject-submission', async (req, res) => {
    const { submissionId, reason } = req.body;
    if (!submissionId) {
      res.status(400).json({ error: 'submissionId required' });
      return;
    }
    const result = dbService.rejectTaskSubmission(submissionId, reason);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    if (result.submission) {
      try {
        await bot.api.sendMessage(
          result.submission.userId,
          `❌ *Task Proof Rejected*\n\n` +
            `Task: ${result.submission.taskTitle || 'Task'}\n` +
            `Reason: ${result.submission.rejectionReason || 'Proof rejected by reviewer.'}`,
          { parse_mode: 'Markdown' }
        );
      } catch {
        // User may not have active Telegram chat
      }
    }

    res.json(result);
  });

  // --- API ROUTE: ADMIN PROCESS WITHDRAWAL ---
  app.post('/api/admin/process-withdrawal', async (req, res) => {
    const { withdrawalId, status, reason } = req.body;
    if (!withdrawalId || !status) {
      res.status(400).json({ error: 'withdrawalId and status required' });
      return;
    }

    const result = dbService.processWithdrawal(withdrawalId, status, reason);
    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    if (result.withdrawal && result.user) {
      const w = result.withdrawal;
      let notificationMsg = '';
      if (status === 'approved' || status === 'paid') {
        notificationMsg =
          `✅ *Withdrawal Approved & Paid*\n\n` +
          `Amount: ৳${w.amount.toFixed(2)}\n` +
          `Method: ${w.method}\n` +
          `Account: ${w.account}\n` +
          `Status: Paid\n\n` +
          `Thank you for using EarnFlow!`;
      } else if (status === 'rejected' || status === 'cancelled') {
        notificationMsg =
          `❌ *Withdrawal Rejected*\n\n` +
          `Amount: ৳${w.amount.toFixed(2)}\n` +
          `Method: ${w.method}\n` +
          `Reason: ${w.rejectionReason}\n\n` +
          `৳${w.amount.toFixed(2)} has been refunded to your available balance.`;
      }

      if (notificationMsg) {
        try {
          await bot.api.sendMessage(result.user.telegramId, notificationMsg, {
            parse_mode: 'Markdown',
          });
        } catch {
          // Ignore if telegram send fails
        }
      }
    }

    res.json(result);
  });

  // --- API ROUTE: ADMIN ADD TASK & ANNOUNCEMENT ---
  app.post('/api/admin/add-task', (req, res) => {
    const { title, description, instructions, reward, estimatedTime } = req.body;
    if (!title || !description || !instructions || !reward) {
      res.status(400).json({ error: 'Missing required task fields' });
      return;
    }
    const task = dbService.addTask(
      title,
      description,
      instructions,
      Number(reward),
      estimatedTime || '2 minutes'
    );
    res.json({ success: true, task });
  });

  app.post('/api/admin/add-announcement', (req, res) => {
    const { title, message } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: 'Title and message required' });
      return;
    }
    const ann = dbService.addAnnouncement(title, message);
    res.json({ success: true, announcement: ann });
  });

  // Setup Webhook or Polling mode
  if (config.TELEGRAM_BOT_TOKEN) {
    if (config.WEBHOOK_URL) {
      bot.api
        .setWebhook(config.WEBHOOK_URL, {
          secret_token: config.WEBHOOK_SECRET,
        })
        .then(() => {
          console.log(`Telegram webhook configured: ${config.WEBHOOK_URL}`);
        })
        .catch((err) => {
          console.error('Failed to set Telegram webhook:', err.message);
        });
    } else {
      // Start polling mode in background for immediate responsiveness
      bot.start({
        onStart: (info) => {
          console.log(`Telegram Bot @${info.username} started in long-polling mode.`);
        },
      }).catch((err) => {
        console.warn('Long-polling note:', err.message);
      });
    }
  }

  // Serve Frontend / Vite Middleware
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EarnFlow Telegram Bot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
