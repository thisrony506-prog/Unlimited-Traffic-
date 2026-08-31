import { Context } from 'grammy';
import { db } from '../database/db';
import { config } from '../config/env';
import {
  earnCreditsInlineKeyboard,
  monetagAdsInlineKeyboard,
  dailyBonusInlineKeyboard,
  backToMainInlineKeyboard,
} from '../keyboards';
import {
  formatEarnCreditsHub,
  formatMonetagAdsScreen,
  formatDailyBonusScreen,
  formatDailyBonusClaimed,
} from '../utils/formatters';

export const handleEarnHub = async (ctx: Context) => {
  if (!ctx.from) return;

  const text = formatEarnCreditsHub();
  const kb = earnCreditsInlineKeyboard();

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

export const handleMonetagAdsScreen = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const user = db.getUser(telegramId);
  const balance = user?.balance || 0;
  const stats = db.getMonetagStats(telegramId);

  const text = formatMonetagAdsScreen(
    stats.adsWatchedToday,
    stats.dailyLimit,
    stats.remainingToday,
    stats.rewardPerAd,
    balance
  );

  const kb = monetagAdsInlineKeyboard(`${config.APP_URL}/miniapp?user_id=${telegramId}`);

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

export const handleMonetagClaimRewardCallback = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const claimRes = db.claimMonetagAdReward(telegramId, 'smartlink');

  if (!claimRes.success) {
    await ctx.answerCallbackQuery({
      text: claimRes.error || 'Daily limit reached!',
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery({
    text: `🎉 +${claimRes.amount} Credits added from Monetag Ad!`,
  });

  const stats = db.getMonetagStats(telegramId);
  const user = db.getUser(telegramId);
  const balance = user?.balance || 0;

  const text =
    `🎉 *Monetag Ad Reward Credited!*\n\n` +
    `🎁 *+${claimRes.amount} Credits* added to your balance.\n` +
    `💰 *New Balance:* ${balance} Credits\n` +
    `📊 *Today's Ads:* ${stats.adsWatchedToday} / ${stats.dailyLimit}\n\n` +
    `Watch more ads or launch the Mini App to continue earning!`;

  const kb = monetagAdsInlineKeyboard(`${config.APP_URL}/miniapp?user_id=${telegramId}`);

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
