import { Context } from 'grammy';
import { db } from '../database/db';
import {
  promoteDurationInlineKeyboard,
  promoteVisitsInlineKeyboard,
  promoteConfirmInlineKeyboard,
  insufficientCreditsInlineKeyboard,
  backToMainInlineKeyboard,
} from '../keyboards';
import {
  formatPromoteUrlPrompt,
  formatPromoteDurationPrompt,
  formatPromoteVisitsPrompt,
  formatCampaignSummary,
  formatInsufficientCredits,
  formatCampaignCreatedSuccess,
} from '../utils/formatters';
import { sessionManager } from '../services/session';
import { config } from '../config/env';

export const handlePromoteStart = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.startPromote(telegramId);

  const text = formatPromoteUrlPrompt();

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
};

export const handlePromoteUrlReceived = async (ctx: Context, urlInput: string) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const rawUrl = urlInput.trim();

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Must be http or https');
    }
    const host = parsedUrl.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      throw new Error('Local or private network URLs are not allowed');
    }
  } catch {
    await ctx.reply(
      `❌ *Invalid URL*\n\nPlease provide a valid HTTP or HTTPS website URL (e.g. \`https://mywebsite.com\`). Local or malformed links are rejected.\n\n_Try again:_`,
      {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      }
    );
    return;
  }

  sessionManager.setPromoteUrl(telegramId, rawUrl);
  const user = db.getUser(telegramId);
  const balance = user?.balance || 0;

  const durationPromptText = formatPromoteDurationPrompt(rawUrl, balance);
  await ctx.reply(durationPromptText, {
    parse_mode: 'Markdown',
    reply_markup: promoteDurationInlineKeyboard,
  });
};

export const handlePromoteDurationSelected = async (ctx: Context, seconds: number, costPerVisit?: number) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const session = sessionManager.getSession(telegramId);
  const url = session.promoteUrl;

  if (!url) {
    await ctx.reply('❌ Session expired. Please start over with *➕ Promote Website*.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  // Calculate rate: 1 token per 15s (15s=1, 30s=2, 45s=3, 60s=4, 90s=6, 120s=8)
  const calcRate = costPerVisit ?? Math.max(1, Math.ceil(seconds / 15));
  sessionManager.setPromoteDuration(telegramId, seconds, calcRate);

  const user = db.getUser(telegramId);
  const balance = user?.balance || 0;

  const promptText = formatPromoteVisitsPrompt(url, seconds, calcRate, balance);
  if (ctx.callbackQuery) {
    await ctx.editMessageText(promptText, {
      parse_mode: 'Markdown',
      reply_markup: promoteVisitsInlineKeyboard,
    });
  } else {
    await ctx.reply(promptText, {
      parse_mode: 'Markdown',
      reply_markup: promoteVisitsInlineKeyboard,
    });
  }
};

export const handlePromoteVisitsSelected = async (ctx: Context, visits: number) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const session = sessionManager.getSession(telegramId);
  const url = session.promoteUrl;
  const durationSeconds = session.promoteDurationSeconds || 15;
  const costPerVisit = session.promoteCostPerVisit || 1;

  if (!url) {
    await ctx.reply('❌ Session expired. Please start over with *➕ Promote Website*.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  sessionManager.setPromoteVisits(telegramId, visits);
  const user = db.getUser(telegramId);
  const balance = user?.balance || 0;
  const cost = visits * costPerVisit;

  if (balance < cost) {
    const insufficientText = formatInsufficientCredits(cost, balance);
    if (ctx.callbackQuery) {
      await ctx.editMessageText(insufficientText, {
        parse_mode: 'Markdown',
        reply_markup: insufficientCreditsInlineKeyboard,
      });
    } else {
      await ctx.reply(insufficientText, {
        parse_mode: 'Markdown',
        reply_markup: insufficientCreditsInlineKeyboard,
      });
    }
    return;
  }

  const summaryText = formatCampaignSummary(url, durationSeconds, costPerVisit, visits, cost, balance);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(summaryText, {
      parse_mode: 'Markdown',
      reply_markup: promoteConfirmInlineKeyboard,
    });
  } else {
    await ctx.reply(summaryText, {
      parse_mode: 'Markdown',
      reply_markup: promoteConfirmInlineKeyboard,
    });
  }
};

export const handlePromoteConfirmCallback = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const session = sessionManager.getSession(telegramId);
  const url = session.promoteUrl;
  const visits = session.promoteVisits;
  const durationSeconds = session.promoteDurationSeconds || 15;
  const costPerVisit = session.promoteCostPerVisit || 1;

  if (!url || !visits) {
    await ctx.reply('❌ Session expired. Please start over.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const ownerName = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() || 'Advertiser';
  const createRes = db.createCampaign(telegramId, ownerName, url, visits, durationSeconds, costPerVisit);

  sessionManager.clearSession(telegramId);

  if (!createRes.success || !createRes.campaign) {
    await ctx.reply(`❌ Could not create campaign: ${createRes.error || 'Unknown error'}`, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const user = db.getUser(telegramId);
  const successText = formatCampaignCreatedSuccess(createRes.campaign, user?.balance || 0);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(successText, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  } else {
    await ctx.reply(successText, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  }
};

export const handlePromoteCancelCallback = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);
  await ctx.editMessageText('❌ Campaign creation cancelled.', {
    parse_mode: 'Markdown',
    reply_markup: backToMainInlineKeyboard,
  });
};
