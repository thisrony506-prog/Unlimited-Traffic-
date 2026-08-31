import { Context } from 'grammy';
import { db } from '../database/db';
import { balanceInlineKeyboard } from '../keyboards';
import { formatBalanceScreen } from '../utils/formatters';
import { sessionManager } from '../services/session';

export const handleBalance = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.clearSession(telegramId);

  const user = db.getUser(telegramId) || db.getOrCreateUser(telegramId, ctx.from.first_name || 'User').user;
  const { earnedToday, spentToday } = db.getUserTodayStats(telegramId);
  const text = formatBalanceScreen(user, earnedToday, spentToday);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: balanceInlineKeyboard,
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: balanceInlineKeyboard,
      });
    }
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: balanceInlineKeyboard,
    });
  }
};
