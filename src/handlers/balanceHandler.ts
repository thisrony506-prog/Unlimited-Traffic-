import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatBalanceMessage } from '../utils/formatters';
import { balanceInlineKeyboard } from '../keyboards';
import { sessionManager } from '../services/session';

export const handleBalance = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const { user } = dbService.getOrCreateUser(
    ctx.from.id,
    ctx.from.first_name,
    ctx.from.last_name,
    ctx.from.username
  );

  const text = formatBalanceMessage(user);

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: balanceInlineKeyboard,
      });
      await ctx.answerCallbackQuery();
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
