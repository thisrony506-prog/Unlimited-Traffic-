import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatSupportMessage, formatFAQMessage } from '../utils/formatters';
import { supportInlineKeyboard, backToMainInlineKeyboard } from '../keyboards';
import { sessionManager } from '../services/session';
import { config } from '../config/env';

export const handleSupport = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const text = formatSupportMessage();

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: supportInlineKeyboard,
  });
};

export const handleSupportContactCallback = async (ctx: Context) => {
  if (!ctx.from) return;
  await ctx.answerCallbackQuery().catch(() => {});
  sessionManager.startSupportMessage(ctx.from.id);

  await ctx.reply(
    `📩 *Contact EarnFlow Support*\n\n` +
      `Please type your question or support request detailed below.\n` +
      `Our support agent will review and reply directly to your chat.\n\n` +
      `_Type your message now:_`,
    { parse_mode: 'Markdown' }
  );
};

export const handleSupportFAQCallback = async (ctx: Context) => {
  await ctx.answerCallbackQuery().catch(() => {});
  const text = formatFAQMessage();
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: backToMainInlineKeyboard,
  });
};
