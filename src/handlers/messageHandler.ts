import { Context } from 'grammy';
import { dbService } from '../database/db';
import { sessionManager } from '../services/session';
import { formatWithdrawConfirmation } from '../utils/formatters';
import { withdrawalConfirmInlineKeyboard, backToMainInlineKeyboard } from '../keyboards';
import { config } from '../config/env';

export const handleIncomingMessage = async (ctx: Context) => {
  if (!ctx.from) return;
  const userId = ctx.from.id;
  const session = sessionManager.getSession(userId);

  if (session.step === 'idle') {
    // Check if user clicked a menu reply button that wasn't caught by exact match
    const text = ctx.message?.text?.trim() || '';
    if (text.includes('My Balance')) return;
    if (text.includes('Available Tasks')) return;
    if (text.includes('My Tasks')) return;
    if (text.includes('Referral')) return;
    if (text.includes('Withdraw')) return;
    if (text.includes('History')) return;
    if (text.includes('Profile')) return;
    if (text.includes('Support')) return;
    if (text.includes('Rules')) return;

    await ctx.reply(
      `🤖 I didn't recognize that command. Please select an option from the menu below or type /help.`,
      { reply_markup: backToMainInlineKeyboard }
    );
    return;
  }

  // --- STEP 1: SUBMITTING TASK PROOF ---
  if (session.step === 'submitting_task_proof' && session.activeTaskId) {
    const taskId = session.activeTaskId;
    let proofType: 'text' | 'photo' | 'document' | 'none' = 'text';
    let proofText = ctx.message?.text || ctx.message?.caption || '';
    let proofFileId: string | undefined = undefined;

    if (ctx.message?.photo && ctx.message.photo.length > 0) {
      proofType = 'photo';
      proofFileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    } else if (ctx.message?.document) {
      proofType = 'document';
      proofFileId = ctx.message.document.file_id;
    }

    if (!proofText && !proofFileId) {
      await ctx.reply(`❌ Please provide valid text, photo, or document proof for the task.`);
      return;
    }

    const res = dbService.createTaskSubmission(
      userId,
      taskId,
      proofType,
      proofText,
      proofFileId
    );

    sessionManager.clearSession(userId);

    if (!res.success || !res.submission) {
      await ctx.reply(`❌ *Submission Failed*\n\n${res.error || 'Invalid submission.'}`, {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      });
      return;
    }

    await ctx.reply(
      `✅ *Task Submitted Successfully!*\n\n` +
        `Submission ID: \`${res.submission.submissionId}\`\n` +
        `Status: ⏳ PENDING REVIEW\n\n` +
        `Our verification team will review your proof. Once approved, ৳${res.submission.rewardAmount.toFixed(
          2
        )} will be credited to your balance automatically.`,
      {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      }
    );
    return;
  }

  // --- STEP 2: WITHDRAWAL AMOUNT INPUT ---
  if (session.step === 'withdraw_enter_amount' && session.withdrawMethod) {
    const text = ctx.message?.text || '';
    const amount = parseFloat(text.replace(/[^0-9.]/g, ''));
    const user = dbService.getUser(userId);
    const settings = dbService.getSettings();

    if (isNaN(amount) || amount <= 0) {
      await ctx.reply(`❌ Please enter a valid numerical amount (e.g. 100 or 250).`);
      return;
    }

    if (amount < settings.minWithdrawal) {
      await ctx.reply(
        `❌ Minimum withdrawal amount is ৳${settings.minWithdrawal.toFixed(2)}. Please enter a higher amount:`
      );
      return;
    }

    if (!user || user.balance < amount) {
      await ctx.reply(
        `❌ Insufficient available balance. Your balance is ৳${user ? user.balance.toFixed(2) : '0.00'}. Please enter a valid amount:`
      );
      return;
    }

    sessionManager.setWithdrawAmount(userId, amount);

    await ctx.reply(
      `📱 *Payment Account Number*\n\n` +
        `Withdrawal Method: ${session.withdrawMethod}\n` +
        `Amount: ৳${amount.toFixed(2)}\n\n` +
        `Please enter your ${session.withdrawMethod} mobile number / account (e.g., 01712345678):`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // --- STEP 3: WITHDRAWAL ACCOUNT INPUT ---
  if (session.step === 'withdraw_enter_account' && session.withdrawAmount && session.withdrawMethod) {
    const account = ctx.message?.text?.trim() || '';

    if (!account || account.length < 5) {
      await ctx.reply(`❌ Please enter a valid account number (minimum 5 digits).`);
      return;
    }

    sessionManager.setWithdrawAccount(userId, account);

    const card = formatWithdrawConfirmation(
      session.withdrawAmount,
      session.withdrawMethod,
      account
    );

    await ctx.reply(card, {
      parse_mode: 'Markdown',
      reply_markup: withdrawalConfirmInlineKeyboard,
    });
    return;
  }

  // --- STEP 4: SUPPORT MESSAGE ---
  if (session.step === 'entering_support_message') {
    const msg = ctx.message?.text || ctx.message?.caption || 'User submitted support attachment';

    const ticket = dbService.createSupportTicket(userId, msg);
    sessionManager.clearSession(userId);

    await ctx.reply(
      `✅ *Support Ticket Created*\n\n` +
        `Ticket ID: \`${ticket.ticketId}\`\n` +
        `Status: 🟢 OPEN\n\n` +
        `Thank you for contacting InfiniteHits support. An agent will review your request shortly.`,
      {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      }
    );

    // Forward to SUPPORT_CHAT_ID if configured
    if (config.SUPPORT_CHAT_ID) {
      try {
        await ctx.api.sendMessage(
          config.SUPPORT_CHAT_ID,
          `🎧 *New Support Ticket #${ticket.ticketId}*\n\n` +
            `From User: ${ctx.from.first_name} (@${ctx.from.username || ctx.from.id})\n` +
            `Message:\n${msg}`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        console.error('Failed to forward support ticket to support chat ID:', err);
      }
    }
    return;
  }
};
