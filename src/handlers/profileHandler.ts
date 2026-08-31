import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatProfileMessage } from '../utils/formatters';
import { backToMainInlineKeyboard } from '../keyboards';
import { sessionManager } from '../services/session';

export const handleProfile = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const { user } = dbService.getOrCreateUser(
    ctx.from.id,
    ctx.from.first_name,
    ctx.from.last_name,
    ctx.from.username
  );

  const text = formatProfileMessage(user);

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: backToMainInlineKeyboard,
  });
};
