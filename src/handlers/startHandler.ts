import { Context } from 'grammy';
import { db } from '../database/db';
import { mainReplyKeyboard, mainInlineKeyboard } from '../keyboards';
import { formatWelcomeMessage, formatMenuMessage } from '../utils/formatters';
import { sessionManager } from '../services/session';

export const handleStart = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const firstName = ctx.from.first_name || 'User';
  const lastName = ctx.from.last_name;
  const username = ctx.from.username;

  // Extract referral payload if /start IH12345
  let startPayload = '';
  if (ctx.message && ctx.message.text) {
    const parts = ctx.message.text.trim().split(' ');
    if (parts.length > 1) {
      startPayload = parts[1];
    }
  }

  sessionManager.clearSession(telegramId);
  const { user, isNew } = db.getOrCreateUser(telegramId, firstName, lastName, username, startPayload);

  // Send persistent reply keyboard first
  await ctx.reply(`🚀 Welcome to *InfiniteHits*!`, {
    parse_mode: 'Markdown',
    reply_markup: mainReplyKeyboard,
  });

  if (isNew) {
    const welcomeText = formatWelcomeMessage(firstName);
    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      reply_markup: mainInlineKeyboard,
    });
  } else {
    const { earnedToday } = db.getUserTodayStats(telegramId);
    const menuText = formatMenuMessage(user, earnedToday);
    await ctx.reply(menuText, {
      parse_mode: 'Markdown',
      reply_markup: mainInlineKeyboard,
    });
  }
};

export const handleMenu = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.clearSession(telegramId);

  const user = db.getUser(telegramId) || db.getOrCreateUser(telegramId, ctx.from.first_name || 'User').user;
  const { earnedToday } = db.getUserTodayStats(telegramId);
  const menuText = formatMenuMessage(user, earnedToday);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(menuText, {
        parse_mode: 'Markdown',
        reply_markup: mainInlineKeyboard,
      });
    } catch {
      await ctx.reply(menuText, {
        parse_mode: 'Markdown',
        reply_markup: mainInlineKeyboard,
      });
    }
  } else {
    await ctx.reply(menuText, {
      parse_mode: 'Markdown',
      reply_markup: mainInlineKeyboard,
    });
  }
};
