import { Context } from 'grammy';
import { db } from '../database/db';
import {
  buyPackagesInlineKeyboard,
  paymentMethodsInlineKeyboard,
  paymentInstructionsInlineKeyboard,
  backToMainInlineKeyboard,
} from '../keyboards';
import {
  formatBuyPackagesList,
  formatPackageSelected,
  formatPaymentInstructions,
  formatPaymentPromptTrxId,
  formatPaymentSubmittedPending,
} from '../utils/formatters';
import { sessionManager } from '../services/session';
import { PaymentMethod } from '../types';

export const handleBuyPackages = async (ctx: Context) => {
  if (!ctx.from) return;

  const packages = db.getPackages();
  const text = formatBuyPackagesList();

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: buyPackagesInlineKeyboard(packages),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: buyPackagesInlineKeyboard(packages),
    });
  }
};

export const handleSelectPackageCallback = async (ctx: Context, packageId: string) => {
  if (!ctx.from) return;

  const pkg = db.getPackageById(packageId);
  if (!pkg) {
    await ctx.reply('❌ Package not found.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const text = formatPackageSelected(pkg);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentMethodsInlineKeyboard(packageId),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentMethodsInlineKeyboard(packageId),
    });
  }
};

export const handleSelectPaymentMethodCallback = async (
  ctx: Context,
  packageId: string,
  method: PaymentMethod
) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const pkg = db.getPackageById(packageId);
  if (!pkg) {
    await ctx.reply('❌ Invalid package.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  sessionManager.startPackagePayment(telegramId, pkg);
  sessionManager.setPaymentMethod(telegramId, method);

  const reference = `IH-${Math.floor(100000 + Math.random() * 900000)}`;
  const text = formatPaymentInstructions(pkg, method, reference);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentInstructionsInlineKeyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: paymentInstructionsInlineKeyboard,
    });
  }
};

export const handlePaymentConfirmPrompt = async (ctx: Context) => {
  if (!ctx.from) return;

  const text = formatPaymentPromptTrxId();

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
  }
};

export const handlePaymentTrxIdReceived = async (ctx: Context, trxId: string) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const session = sessionManager.getSession(telegramId);
  const pkg = session.selectedPackage;
  const method = session.paymentMethod || 'bKash';

  if (!pkg) {
    await ctx.reply('❌ Payment session expired. Please tap *💳 Buy Credits* to start again.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const cleanTrx = trxId.trim();
  if (cleanTrx.length < 4) {
    await ctx.reply('❌ Invalid Transaction ID. Please enter a valid reference or TrxID.\n\n_Try again:_', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const userName = `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim() || 'Customer';
  const payRes = db.createPayment(telegramId, userName, pkg.packageId, method, cleanTrx);

  sessionManager.clearSession(telegramId);

  if (!payRes.success || !payRes.payment) {
    await ctx.reply('❌ Could not record payment. Please try again.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const payment = payRes.payment;
  const successText = formatPaymentSubmittedPending(
    payment.paymentId,
    payment.packageName,
    payment.amount,
    payment.trxId
  );

  await ctx.reply(successText, {
    parse_mode: 'Markdown',
    reply_markup: backToMainInlineKeyboard,
  });
};
