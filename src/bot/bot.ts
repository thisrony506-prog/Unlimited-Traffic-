import { Bot } from 'grammy';
import { config } from '../config/env';
import { handleStart, handleMenu } from '../handlers/startHandler';
import {
  handleGetTraffic,
  handleStartVisitCallback,
  handleVerifyVisitCallback,
} from '../handlers/trafficHandler';
import {
  handlePromoteStart,
  handlePromoteDurationSelected,
  handlePromoteVisitsSelected,
  handlePromoteConfirmCallback,
  handlePromoteCancelCallback,
} from '../handlers/promoteHandler';
import {
  handleMyCampaigns,
  handleToggleCampaignCallback,
  handleCampaignDetailCallback,
} from '../handlers/myCampaignsHandler';
import {
  handleEarnHub,
  handleMonetagAdsScreen,
  handleMonetagClaimRewardCallback,
  handleDailyBonusScreen,
  handleDailyBonusClaimCallback,
} from '../handlers/earnHandler';
import {
  handleBuyPackages,
  handleSelectPackageCallback,
  handleSelectPaymentMethodCallback,
  handlePaymentConfirmPrompt,
} from '../handlers/buyCreditsHandler';
import { handleBalance } from '../handlers/balanceHandler';
import { handleReferral, handleReferralStats } from '../handlers/referralHandler';
import { handleStats } from '../handlers/statsHandler';
import { handleHistory } from '../handlers/historyHandler';
import { handleProfile } from '../handlers/profileHandler';
import {
  handleSupport,
  handleFAQList,
  handleFAQItem,
  handleSupportContactMessage,
} from '../handlers/supportHandler';
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
  const bot = new Bot(token);

  // Install API transformer to intercept outgoing Telegram API calls for preview simulator & graceful fallbacks
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

      // If Telegram rejects markdown due to special characters, retry with plain text (removing parse_mode)
      if (
        (method === 'sendMessage' || method === 'editMessageText') &&
        (errorMsg.includes("can't parse entities") || errorMsg.includes('parse error') || errorMsg.includes('entity'))
      ) {
        try {
          const plainPayload = { ...(payload as any) };
          delete plainPayload.parse_mode;
          res = await prev(method, plainPayload, signal);
          return res;
        } catch {}
      }

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
    console.error(`[GrammY Error] Handling update ${ctx.update?.update_id}:`, err.error);
  });

  // --- COMMANDS ---
  bot.command('start', handleStart);
  bot.command('menu', handleMenu);
  bot.command('balance', handleBalance);
  bot.command('traffic', handleGetTraffic);
  bot.command('promote', handlePromoteStart);
  bot.command('packages', handleBuyPackages);
  bot.command('earn', handleEarnHub);
  bot.command('daily', handleDailyBonusScreen);
  bot.command('referral', handleReferral);
  bot.command('stats', handleStats);
  bot.command('history', (ctx) => handleHistory(ctx, 1));
  bot.command('profile', handleProfile);
  bot.command('help', handleSupport);
  bot.command('support', handleSupport);
  bot.command('mycampaigns', handleMyCampaigns);

  // --- REPLY KEYBOARD BUTTON TEXT LISTENERS ---
  bot.hears('🌐 Get Traffic', handleGetTraffic);
  bot.hears('➕ Promote Website', handlePromoteStart);
  bot.hears('💳 Buy Credits', handleBuyPackages);
  bot.hears('🎁 Earn Credits', handleEarnHub);
  bot.hears('👥 Referral', handleReferral);
  bot.hears('💰 My Balance', handleBalance);
  bot.hears('📊 Statistics', handleStats);
  bot.hears('📜 History', (ctx) => handleHistory(ctx, 1));
  bot.hears('👤 Profile', handleProfile);
  bot.hears('🎧 Support', handleSupport);

  // --- STATIC INLINE CALLBACK QUERIES ---
  bot.callbackQuery('nav_main', handleMenu);
  bot.callbackQuery('nav_traffic', handleGetTraffic);
  bot.callbackQuery('nav_promote', handlePromoteStart);
  bot.callbackQuery('nav_packages', handleBuyPackages);
  bot.callbackQuery('nav_earn', handleEarnHub);
  bot.callbackQuery('nav_referral', handleReferral);
  bot.callbackQuery('nav_referral_stats', handleReferralStats);
  bot.callbackQuery('nav_balance', handleBalance);
  bot.callbackQuery('nav_stats', handleStats);
  bot.callbackQuery('nav_history', (ctx) => handleHistory(ctx, 1));
  bot.callbackQuery('nav_profile', handleProfile);
  bot.callbackQuery('nav_support', handleSupport);
  bot.callbackQuery('nav_my_campaigns', handleMyCampaigns);
  bot.callbackQuery('nav_daily_bonus', handleDailyBonusScreen);
  bot.callbackQuery('nav_monetag_ads', handleMonetagAdsScreen);
  bot.callbackQuery('monetag_claim_reward', handleMonetagClaimRewardCallback);

  bot.callbackQuery('traffic_next', handleGetTraffic);
  bot.callbackQuery('promote_confirm_yes', handlePromoteConfirmCallback);
  bot.callbackQuery('promote_cancel', handlePromoteCancelCallback);
  bot.callbackQuery('daily_bonus_claim', handleDailyBonusClaimCallback);
  bot.callbackQuery('pay_confirm_prompt', handlePaymentConfirmPrompt);
  bot.callbackQuery('support_contact_msg', handleSupportContactMessage);
  bot.callbackQuery('support_faq_list', handleFAQList);

  // --- DYNAMIC CALLBACK QUERIES ---
  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;

    // Visit campaign start
    if (data.startsWith('visit_start_')) {
      const campId = data.replace('visit_start_', '');
      await handleStartVisitCallback(ctx, campId);
      return;
    }

    // Verify visit
    if (data.startsWith('visit_verify_')) {
      const visitId = data.replace('visit_verify_', '');
      await handleVerifyVisitCallback(ctx, visitId);
      return;
    }

    // Promote duration (seconds) selection
    if (data.startsWith('promote_duration_')) {
      const secStr = data.replace('promote_duration_', '');
      const seconds = parseInt(secStr, 10) || 15;
      await handlePromoteDurationSelected(ctx, seconds);
      return;
    }

    // Promote visits count selection
    if (data.startsWith('promote_visits_')) {
      const countStr = data.replace('promote_visits_', '');
      const count = parseInt(countStr, 10) || 50;
      await handlePromoteVisitsSelected(ctx, count);
      return;
    }

    // Buy package selection
    if (data.startsWith('buy_pkg_')) {
      const pkgId = data.replace('buy_pkg_', '');
      await handleSelectPackageCallback(ctx, pkgId);
      return;
    }

    // Payment method selection: pay_method_{packageId}_{method}
    if (data.startsWith('pay_method_')) {
      const rest = data.replace('pay_method_', '');
      const lastUnderscore = rest.lastIndexOf('_');
      if (lastUnderscore !== -1) {
        const pkgId = rest.substring(0, lastUnderscore);
        const method = rest.substring(lastUnderscore + 1) as any;
        await handleSelectPaymentMethodCallback(ctx, pkgId, method);
        return;
      }
    }

    // Toggle campaign pause / resume
    if (data.startsWith('camp_toggle_')) {
      const campId = data.replace('camp_toggle_', '');
      await handleToggleCampaignCallback(ctx, campId);
      return;
    }

    // Campaign details
    if (data.startsWith('camp_detail_')) {
      const campId = data.replace('camp_detail_', '');
      await handleCampaignDetailCallback(ctx, campId);
      return;
    }

    // History page navigation
    if (data.startsWith('hist_page_')) {
      const pageStr = data.replace('hist_page_', '');
      const page = parseInt(pageStr, 10) || 1;
      await handleHistory(ctx, page);
      return;
    }

    // FAQ item view
    if (data.startsWith('faq_item_')) {
      const faqId = data.replace('faq_item_', '');
      await handleFAQItem(ctx, faqId);
      return;
    }

    await next();
  });

  // --- GENERAL MESSAGE HANDLER ---
  bot.on('message', handleIncomingMessage);

  return bot;
}
