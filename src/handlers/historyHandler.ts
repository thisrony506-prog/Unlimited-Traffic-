import { Context } from 'grammy';
import { db } from '../database/db';
import { historyInlineKeyboard } from '../keyboards';
import { formatHistoryScreen } from '../utils/formatters';
import { sessionManager } from '../services/session';

export const handleHistory = async (ctx: Context, page: number = 1) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.clearSession(telegramId);

  const { transactions, total, totalPages, currentPage } = db.getUserTransactions(telegramId, page, 5);
  const text = formatHistoryScreen(transactions, currentPage, totalPages, total);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: historyInlineKeyboard(currentPage, totalPages),
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: historyInlineKeyboard(currentPage, totalPages),
      });
    }
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: historyInlineKeyboard(currentPage, totalPages),
    });
  }
};
