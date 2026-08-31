import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatHistoryMessage } from '../utils/formatters';
import { historyPaginationInlineKeyboard } from '../keyboards';
import { sessionManager } from '../services/session';

export const handleHistory = async (ctx: Context, page: number = 1) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const res = dbService.getUserTransactions(ctx.from.id, page, 5);
  const text = formatHistoryMessage(res.items, res.page, res.totalPages);

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery().catch(() => {});
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: historyPaginationInlineKeyboard(res.page, res.totalPages),
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: historyPaginationInlineKeyboard(res.page, res.totalPages),
      });
    }
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: historyPaginationInlineKeyboard(res.page, res.totalPages),
    });
  }
};
