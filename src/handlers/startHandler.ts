import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatWelcomeMessage } from '../utils/formatters';
import { mainReplyKeyboard } from '../keyboards';
import { sessionManager } from '../services/session';

export const handleStart = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const firstName = ctx.from.first_name || 'User';
  const lastName = ctx.from.last_name;
  const username = ctx.from.username;

  // Extract referral parameter e.g., /start ABC123
  const text = ctx.message?.text || '';
  const parts = text.split(' ');
  const referralParam = parts.length > 1 ? parts[1].trim() : undefined;

  // Clear any active conversation session
  sessionManager.clearSession(telegramId);

  // Get or register user
  const { user, isNew } = dbService.getOrCreateUser(
    telegramId,
    firstName,
    lastName,
    username,
    referralParam
  );

  const announcement = dbService.getLatestAnnouncement();
  const welcomeText = formatWelcomeMessage(user.firstName, announcement);

  await ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: mainReplyKeyboard,
  });

  if (isNew && user.referredBy) {
    // Notify referrer if possible
    try {
      const settings = dbService.getSettings();
      await ctx.api.sendMessage(
        user.referredBy,
        `🎉 *New Referral Registered!*\n\nUser ${user.firstName} (@${user.username || user.telegramId}) joined using your link.\nReward: ৳${settings.referralReward.toFixed(2)} added to your balance!`,
        { parse_mode: 'Markdown' }
      );
    } catch {
      // Ignore if user blocked bot
    }
  }
};

export const handleMenu = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);
  const user = dbService.getUser(ctx.from.id);
  const announcement = dbService.getLatestAnnouncement();

  const text = formatWelcomeMessage(user ? user.firstName : ctx.from.first_name, announcement);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: mainReplyKeyboard,
  });
};
