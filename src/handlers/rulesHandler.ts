import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatRulesMessage } from '../utils/formatters';
import { backToMainInlineKeyboard } from '../keyboards';
import { sessionManager } from '../services/session';

export const handleRules = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const settings = dbService.getSettings();
  const text = formatRulesMessage(settings.rulesText);

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: backToMainInlineKeyboard,
  });
};

export const handleHelp = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const helpText =
    `💡 *InfiniteHits Command Help*\n\n` +
    `/start - Start bot and show main menu\n` +
    `/menu - Show main menu keyboard\n` +
    `/balance - View wallet balance and stats\n` +
    `/tasks - Browse published available tasks\n` +
    `/mytasks - View your submitted tasks status\n` +
    `/referral - View referral link & stats\n` +
    `/withdraw - Withdraw earnings (bKash/Nagad)\n` +
    `/history - View transaction ledger history\n` +
    `/profile - View your account profile\n` +
    `/support - Open support ticket or read FAQ\n` +
    `/rules - Read platform earning rules & policies\n` +
    `/help - Show this command guide`;

  await ctx.reply(helpText, {
    parse_mode: 'Markdown',
    reply_markup: backToMainInlineKeyboard,
  });
};
