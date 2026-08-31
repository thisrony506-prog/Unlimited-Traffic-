import { Context } from 'grammy';
import { db } from '../database/db';
import { statsInlineKeyboard } from '../keyboards';
import { formatStatisticsScreen } from '../utils/formatters';
import { sessionManager } from '../services/session';

export const handleStats = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.clearSession(telegramId);

  const user = db.getUser(telegramId) || db.getOrCreateUser(telegramId, ctx.from.first_name || 'User').user;
  const userCampaigns = db.getUserCampaigns(telegramId);
  const activeCount = userCampaigns.filter((c) => c.status === 'ACTIVE').length;
  const completedCount = userCampaigns.filter((c) => c.status === 'COMPLETED').length;

  const text = formatStatisticsScreen(user, activeCount, completedCount);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: statsInlineKeyboard,
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: statsInlineKeyboard,
      });
    }
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: statsInlineKeyboard,
    });
  }
};
