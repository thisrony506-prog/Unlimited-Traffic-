import { Context } from 'grammy';
import { db } from '../database/db';
import { earnCreditsInlineKeyboard, dailyBonusInlineKeyboard, backToMainInlineKeyboard } from '../keyboards';
import {
  formatEarnCreditsHub,
  formatDailyBonusScreen,
  formatDailyBonusClaimed,
} from '../utils/formatters';

export const handleEarnHub = async (ctx: Context) => {
  if (!ctx.from) return;

  const text = formatEarnCreditsHub();

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: earnCreditsInlineKeyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: earnCreditsInlineKeyboard,
    });
  }
};

export const handleDailyBonusScreen = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const user = db.getUser(telegramId);

  let canClaim = true;
  let nextHours = 0;
  let nextMins = 0;

  if (user && user.lastDailyBonus) {
    const lastTime = new Date(user.lastDailyBonus).getTime();
    const elapsed = Date.now() - lastTime;
    const cooldown = 24 * 60 * 60 * 1000;
    if (elapsed < cooldown) {
      canClaim = false;
      const remainingMs = cooldown - elapsed;
      nextHours = Math.floor(remainingMs / (1000 * 60 * 60));
      nextMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    }
  }

  const text = formatDailyBonusScreen(canClaim, nextHours, nextMins);
  const kb = canClaim ? dailyBonusInlineKeyboard : backToMainInlineKeyboard;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: kb,
    });
  }
};

export const handleDailyBonusClaimCallback = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const claimRes = db.claimDailyBonus(telegramId);

  if (!claimRes.success) {
    const remainingMs = claimRes.nextAvailableInMs || 0;
    const nextHours = Math.floor(remainingMs / (1000 * 60 * 60));
    const nextMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const text = formatDailyBonusScreen(false, nextHours, nextMins);

    await ctx.answerCallbackQuery({
      text: `Already claimed today! Next in ${nextHours}h ${nextMins}m`,
      show_alert: true,
    });
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      });
    } catch {}
    return;
  }

  await ctx.answerCallbackQuery({
    text: `🎉 +${claimRes.amount} Daily Bonus Added!`,
  });

  const successText = formatDailyBonusClaimed(claimRes.amount, claimRes.newBalance || 0);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(successText, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  } else {
    await ctx.reply(successText, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  }
};
