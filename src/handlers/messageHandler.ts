import { Context } from 'grammy';
import { db } from '../database/db';
import { sessionManager } from '../services/session';
import { handlePromoteUrlReceived } from './promoteHandler';
import { handlePaymentTrxIdReceived } from './buyCreditsHandler';
import { backToMainInlineKeyboard } from '../keyboards';

export const handleIncomingMessage = async (ctx: Context) => {
  if (!ctx.from || !ctx.message) return;

  const telegramId = ctx.from.id;
  const text = ctx.message.text?.trim() || '';

  // Ignore command strings (starts with /)
  if (text.startsWith('/')) return;

  // Check active session step
  const session = sessionManager.getSession(telegramId);

  // 1. Promote URL
  if (session.step === 'promote_enter_url') {
    await handlePromoteUrlReceived(ctx, text);
    return;
  }

  // 1.1 Custom Duration (Seconds) typed
  if (session.step === 'promote_select_duration') {
    const rawSeconds = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(rawSeconds) && rawSeconds >= 5) {
      const { handlePromoteDurationSelected } = await import('./promoteHandler');
      await handlePromoteDurationSelected(ctx, rawSeconds);
      return;
    }
  }

  // 1.2 Custom Promote Visits Number typed
  if (session.step === 'promote_select_visits') {
    const visitsNum = parseInt(text.replace(/,/g, ''), 10);
    if (!isNaN(visitsNum) && visitsNum > 0) {
      const { handlePromoteVisitsSelected } = await import('./promoteHandler');
      await handlePromoteVisitsSelected(ctx, visitsNum);
      return;
    }
  }

  // 2. Payment TrxID
  if (session.step === 'payment_enter_trxid') {
    await handlePaymentTrxIdReceived(ctx, text);
    return;
  }

  // 3. Support Message
  if (session.step === 'support_enter_message') {
    const userName = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() || 'User';
    const ticket = db.createSupportRequest(telegramId, userName, text);
    sessionManager.clearSession(telegramId);

    await ctx.reply(
      `✅ *Support Ticket Created*\n\n` +
        `Ticket ID: \`${ticket.ticketId}\`\n` +
        `Status: 🟢 OPEN\n\n` +
        `Thank you for contacting InfiniteHits support. An agent will review your inquiry shortly.`,
      {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      }
    );
    return;
  }

  // If no active session, provide friendly quick menu navigation
  await ctx.reply(
    `💡 *InfiniteHits Bot*\n\n` +
      `Please use the menu buttons below or type /menu to explore traffic campaigns and promotion tools:`,
    {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    }
  );
};
