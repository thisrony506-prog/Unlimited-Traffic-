import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatReferralMessage } from '../utils/formatters';
import { referralInlineKeyboard } from '../keyboards';
import { sessionManager } from '../services/session';
import { config } from '../config/env';

export const handleReferral = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const { user } = dbService.getOrCreateUser(
    ctx.from.id,
    ctx.from.first_name,
    ctx.from.last_name,
    ctx.from.username
  );

  const text = formatReferralMessage(user);

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: referralInlineKeyboard(user.referralCode),
  });
};

export const handleCopyRefCallback = async (ctx: Context, referralCode: string) => {
  const botUser = config.BOT_USERNAME;
  const refLink = `https://t.me/${botUser}?start=${referralCode}`;
  await ctx.answerCallbackQuery({
    text: `📋 Referral link copied:\n${refLink}`,
    show_alert: true,
  });
};
