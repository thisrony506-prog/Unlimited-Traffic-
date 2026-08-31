import { Context } from 'grammy';
import { db } from '../database/db';
import {
  campaignViewInlineKeyboard,
  visitSessionInlineKeyboard,
  visitCompletedInlineKeyboard,
  backToMainInlineKeyboard,
} from '../keyboards';
import {
  formatAvailableCampaign,
  formatNoCampaignsAvailable,
  formatVisitStarted,
  formatVisitVerified,
  formatVisitFailed,
} from '../utils/formatters';
import { sessionManager } from '../services/session';

export const handleGetTraffic = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.clearSession(telegramId);

  const availableCampaigns = db.getActiveCampaigns(telegramId);

  if (availableCampaigns.length === 0) {
    const text = formatNoCampaignsAvailable();
    if (ctx.callbackQuery) {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      });
    } else {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      });
    }
    return;
  }

  const campaign = availableCampaigns[0];
  const hasNext = availableCampaigns.length > 1;
  const text = formatAvailableCampaign(campaign, campaign.remainingVisits);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: campaignViewInlineKeyboard(campaign.campaignId, hasNext),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: campaignViewInlineKeyboard(campaign.campaignId, hasNext),
    });
  }
};

export const handleStartVisitCallback = async (ctx: Context, campaignId: string) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const startRes = db.startVisitSession(telegramId, campaignId);

  if (!startRes.success || !startRes.visit) {
    await ctx.reply(`❌ ${startRes.error || 'Could not start visit session.'}`, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const campaign = db.getCampaignById(campaignId);
  if (!campaign) return;

  const visit = startRes.visit;
  const text = formatVisitStarted(campaign.websiteUrl, visit.durationSeconds);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: visitSessionInlineKeyboard(visit.visitId, campaign.websiteUrl),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: visitSessionInlineKeyboard(visit.visitId, campaign.websiteUrl),
    });
  }
};

export const handleVerifyVisitCallback = async (ctx: Context, visitId: string) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const verifyRes = db.verifyVisitSession(visitId, telegramId);

  if (!verifyRes.success) {
    let errorMsg = verifyRes.error || 'Verification failed.';
    if (verifyRes.remainingSeconds && verifyRes.remainingSeconds > 0) {
      errorMsg = `⏳ Too early! Please stay on the website for another *${verifyRes.remainingSeconds} seconds* before verifying.`;
    }
    const failText = formatVisitFailed(errorMsg);

    if (ctx.callbackQuery) {
      await ctx.answerCallbackQuery({
        text: `Verification failed: ${errorMsg.replace(/\*/g, '')}`,
        show_alert: true,
      });
      await ctx.reply(failText, {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      });
    } else {
      await ctx.reply(failText, {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      });
    }
    return;
  }

  const successText = formatVisitVerified(verifyRes.rewardAmount, verifyRes.newBalance);

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery({
      text: `🎉 +${verifyRes.rewardAmount} Credit added!`,
    });
    await ctx.editMessageText(successText, {
      parse_mode: 'Markdown',
      reply_markup: visitCompletedInlineKeyboard,
    });
  } else {
    await ctx.reply(successText, {
      parse_mode: 'Markdown',
      reply_markup: visitCompletedInlineKeyboard,
    });
  }
};
