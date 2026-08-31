import { Bot } from 'grammy';
import { config } from '../config/env';
import { handleStart, handleMenu } from '../handlers/startHandler';
import { handleBalance } from '../handlers/balanceHandler';
import {
  handleAvailableTasks,
  handleStartTaskCallback,
  handleSubmitTaskCallback,
  handleMyTasks,
} from '../handlers/taskHandler';
import { handleReferral, handleCopyRefCallback } from '../handlers/referralHandler';
import {
  handleWithdrawStart,
  handleWithdrawMethodCallback,
  handleWithdrawConfirmCallback,
  handleWithdrawCancelCallback,
} from '../handlers/withdrawHandler';
import { handleHistory } from '../handlers/historyHandler';
import { handleProfile } from '../handlers/profileHandler';
import {
  handleSupport,
  handleSupportContactCallback,
  handleSupportFAQCallback,
} from '../handlers/supportHandler';
import { handleRules, handleHelp } from '../handlers/rulesHandler';
import { handleIncomingMessage } from '../handlers/messageHandler';

export interface CapturedBotResponse {
  id: string;
  sender: 'bot';
  text: string;
  replyKeyboard?: any;
  inlineKeyboard?: any;
  timestamp: string;
}

export let capturedResponses: CapturedBotResponse[] = [];

let responseCounter = 0;

export function clearCapturedResponses() {
  capturedResponses = [];
  responseCounter = 0;
}

export function createTelegramBot(): Bot {
  const token = config.TELEGRAM_BOT_TOKEN;
  const bot = new Bot(token, {
    botInfo: {
      id: 8864392110,
      is_bot: true,
      first_name: 'InfiniteHits Bot',
      username: config.BOT_USERNAME || 'earnflowV3_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false,
      has_topics_enabled: false,
      allows_users_to_create_topics: false,
    } as any,
  });

  // Install API transformer to intercept outgoing Telegram API calls
  bot.api.config.use(async (prev, method, payload, signal) => {
    if (method === 'sendMessage' || method === 'editMessageText') {
      const payloadObj = payload as any;
      const text = payloadObj.text || payloadObj.caption || '';
      const replyMarkup = payloadObj.reply_markup;

      capturedResponses.push({
        id: `bot_${Date.now()}_${++responseCounter}_${Math.random().toString(36).substring(2, 9)}`,
        sender: 'bot',
        text,
        replyKeyboard: replyMarkup?.keyboard,
        inlineKeyboard: replyMarkup?.inline_keyboard,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }

    let res: any;
    try {
      res = await prev(method, payload, signal);
    } catch (err: any) {
      const errorMsg = String(err?.message || err?.description || '');
      const errorCode = err?.error_code || 400;

      if (
        errorCode === 400 ||
        errorMsg.includes('chat not found') ||
        errorMsg.includes('bot was blocked') ||
        errorMsg.includes('user is deactivated') ||
        errorMsg.includes('message is not modified') ||
        errorMsg.includes('query is too old')
      ) {
        res = {
          ok: false,
          error_code: errorCode,
          description: errorMsg || 'chat not found',
        };
      } else {
        throw err;
      }
    }

    if (res && res.ok === false) {
      const desc = res.description || '';
      const code = res.error_code;

      if (
        code === 400 ||
        desc.includes('chat not found') ||
        desc.includes('bot was blocked') ||
        desc.includes('user is deactivated') ||
        desc.includes('message is not modified') ||
        desc.includes('query is too old')
      ) {
        if (method === 'sendMessage' || method === 'editMessageText') {
          const payloadObj = payload as any;
          return {
            ok: true,
            result: {
              message_id: Math.floor(Math.random() * 1000000),
              date: Math.floor(Date.now() / 1000),
              chat: { id: payloadObj.chat_id || 123456789, type: 'private' },
              text: payloadObj.text || '',
            },
          } as any;
        }
        return { ok: true, result: true } as any;
      }
    }

    return res;
  });

  // Global Error Handler
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error handling update ${ctx.update?.update_id}:`, err.error);
  });

  // --- COMMANDS ---
  bot.command('start', handleStart);
  bot.command('menu', handleMenu);
  bot.command('balance', handleBalance);
  bot.command('tasks', handleAvailableTasks);
  bot.command('mytasks', handleMyTasks);
  bot.command('referral', handleReferral);
  bot.command('withdraw', handleWithdrawStart);
  bot.command('history', (ctx) => handleHistory(ctx, 1));
  bot.command('profile', handleProfile);
  bot.command('support', handleSupport);
  bot.command('rules', handleRules);
  bot.command('help', handleHelp);

  // --- REPLY KEYBOARD BUTTON TEXT LISTENERS ---
  bot.hears('💰 My Balance', handleBalance);
  bot.hears('📋 Available Tasks', handleAvailableTasks);
  bot.hears('✅ My Tasks', handleMyTasks);
  bot.hears('👥 Referral', handleReferral);
  bot.hears('💸 Withdraw', handleWithdrawStart);
  bot.hears('📊 History', (ctx) => handleHistory(ctx, 1));
  bot.hears('👤 Profile', handleProfile);
  bot.hears('🎧 Support', handleSupport);
  bot.hears('📜 Rules', handleRules);

  // --- INLINE CALLBACK QUERY LISTENERS ---
  bot.callbackQuery('nav_main', handleMenu);
  bot.callbackQuery('nav_withdraw', handleWithdrawStart);
  bot.callbackQuery('nav_history', (ctx) => handleHistory(ctx, 1));
  bot.callbackQuery('nav_tasks', handleAvailableTasks);
  bot.callbackQuery('wdr_method_bKash', (ctx) => handleWithdrawMethodCallback(ctx, 'bKash'));
  bot.callbackQuery('wdr_method_Nagad', (ctx) => handleWithdrawMethodCallback(ctx, 'Nagad'));
  bot.callbackQuery('wdr_confirm_yes', handleWithdrawConfirmCallback);
  bot.callbackQuery('wdr_cancel', handleWithdrawCancelCallback);
  bot.callbackQuery('support_contact', handleSupportContactCallback);
  bot.callbackQuery('support_faq', handleSupportFAQCallback);

  // Dynamic Callbacks
  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;

    if (data.startsWith('task_start_')) {
      const taskId = data.replace('task_start_', '');
      await handleStartTaskCallback(ctx, taskId);
      return;
    }
    if (data.startsWith('task_submit_')) {
      const taskId = data.replace('task_submit_', '');
      await handleSubmitTaskCallback(ctx, taskId);
      return;
    }
    if (data.startsWith('copy_ref_')) {
      const code = data.replace('copy_ref_', '');
      await handleCopyRefCallback(ctx, code);
      return;
    }
    if (data.startsWith('hist_page_')) {
      const pageStr = data.replace('hist_page_', '');
      const page = parseInt(pageStr, 10) || 1;
      await handleHistory(ctx, page);
      return;
    }
    await next();
  });

  // --- GENERAL MESSAGE HANDLER ---
  bot.on('message', handleIncomingMessage);

  return bot;
}
