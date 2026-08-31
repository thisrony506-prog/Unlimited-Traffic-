import { Context } from 'grammy';
import { dbService } from '../database/db';
import { formatWithdrawMessage, formatWithdrawConfirmation } from '../utils/formatters';
import {
  withdrawalMethodsInlineKeyboard,
  withdrawalConfirmInlineKeyboard,
  backToMainInlineKeyboard,
} from '../keyboards';
import { sessionManager } from '../services/session';
import { WithdrawalMethod } from '../types';

export const handleWithdrawStart = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const { user } = dbService.getOrCreateUser(
    ctx.from.id,
    ctx.from.first_name,
    ctx.from.last_name,
    ctx.from.username
  );

  const settings = dbService.getSettings();

  if (user.balance < settings.minWithdrawal) {
    await ctx.reply(
      `💸 *Withdraw Funds*\n\n` +
        `Available Balance: ৳${user.balance.toFixed(2)}\n` +
        `Minimum Withdrawal: ৳${settings.minWithdrawal.toFixed(2)}\n\n` +
        `❌ You do not have enough balance to withdraw. Complete more tasks or invite friends to reach the minimum threshold of ৳${settings.minWithdrawal.toFixed(
          2
        )}.`,
      {
        parse_mode: 'Markdown',
        reply_markup: backToMainInlineKeyboard,
      }
    );
    return;
  }

  const text = formatWithdrawMessage(user, settings.minWithdrawal);

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery().catch(() => {});
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: withdrawalMethodsInlineKeyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: withdrawalMethodsInlineKeyboard,
    });
  }
};

export const handleWithdrawMethodCallback = async (ctx: Context, method: WithdrawalMethod) => {
  if (!ctx.from) return;
  await ctx.answerCallbackQuery().catch(() => {});

  const user = dbService.getUser(ctx.from.id);
  const settings = dbService.getSettings();

  if (!user || user.balance < settings.minWithdrawal) {
    await ctx.reply(`❌ Insufficient balance for withdrawal.`, {
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  sessionManager.startWithdrawMethod(ctx.from.id, method);

  await ctx.reply(
    `📱 *${method} Withdrawal Selected*\n\n` +
      `Available Balance: ৳${user.balance.toFixed(2)}\n` +
      `Minimum Withdrawal: ৳${settings.minWithdrawal.toFixed(2)}\n\n` +
      `Please enter the amount in BDT (৳) you wish to withdraw:`,
    { parse_mode: 'Markdown' }
  );
};

export const handleWithdrawConfirmCallback = async (ctx: Context) => {
  if (!ctx.from) return;
  await ctx.answerCallbackQuery().catch(() => {});

  const session = sessionManager.getSession(ctx.from.id);
  if (
    session.step !== 'withdraw_confirm' ||
    !session.withdrawMethod ||
    !session.withdrawAmount ||
    !session.withdrawAccount
  ) {
    await ctx.reply(`❌ Invalid or expired withdrawal session. Please start again.`, {
      reply_markup: backToMainInlineKeyboard,
    });
    sessionManager.clearSession(ctx.from.id);
    return;
  }

  const res = dbService.createWithdrawalRequest(
    ctx.from.id,
    session.withdrawMethod,
    session.withdrawAmount,
    session.withdrawAccount
  );

  sessionManager.clearSession(ctx.from.id);

  if (!res.success || !res.withdrawal) {
    await ctx.reply(`❌ *Withdrawal Failed*\n\n${res.error || 'Server error occurred.'}`, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  await ctx.reply(
    `✅ *Withdrawal Request Submitted*\n\n` +
      `Request ID: \`${res.withdrawal.withdrawalId}\`\n` +
      `Amount: ৳${res.withdrawal.amount.toFixed(2)}\n` +
      `Method: ${res.withdrawal.method}\n` +
      `Account: ${res.withdrawal.account}\n` +
      `Status: ⏳ PENDING\n\n` +
      `Your payout is queued and will be processed within 24-48 hours. You will receive a notification when your payment is released.`,
    {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    }
  );
};

export const handleWithdrawCancelCallback = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);
  await ctx.answerCallbackQuery({ text: 'Withdrawal cancelled.' });
  await ctx.reply(`❌ Withdrawal cancelled. Returning to main menu.`, {
    reply_markup: backToMainInlineKeyboard,
  });
};
