import { Context } from 'grammy';
import { supportInlineKeyboard, faqListInlineKeyboard, faqItemInlineKeyboard, backToMainInlineKeyboard } from '../keyboards';
import { formatSupportScreen, FAQ_ITEMS } from '../utils/formatters';
import { sessionManager } from '../services/session';

export const handleSupport = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  sessionManager.clearSession(telegramId);

  const text = formatSupportScreen();

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        reply_markup: supportInlineKeyboard(),
      });
    } catch {
      await ctx.reply(text, {
        parse_mode: 'Markdown',
        reply_markup: supportInlineKeyboard(),
      });
    }
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: supportInlineKeyboard(),
    });
  }
};

export const handleFAQList = async (ctx: Context) => {
  if (!ctx.from) return;

  const questions = FAQ_ITEMS.map((q) => ({ id: q.id, title: q.title }));
  const text = `❓ *Frequently Asked Questions (FAQ)*\n\nSelect a question below to read the answer:`;

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: faqListInlineKeyboard(questions),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: faqListInlineKeyboard(questions),
    });
  }
};

export const handleFAQItem = async (ctx: Context, faqId: string) => {
  if (!ctx.from) return;

  const item = FAQ_ITEMS.find((q) => q.id === faqId);
  if (!item) {
    await ctx.reply('❌ FAQ item not found.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  if (ctx.callbackQuery) {
    await ctx.editMessageText(item.answer, {
      parse_mode: 'Markdown',
      reply_markup: faqItemInlineKeyboard,
    });
  } else {
    await ctx.reply(item.answer, {
      parse_mode: 'Markdown',
      reply_markup: faqItemInlineKeyboard,
    });
  }
};

export const handleSupportContactMessage = async (ctx: Context) => {
  if (!ctx.from) return;

  sessionManager.startSupportMessage(ctx.from.id);
  const text =
    `💬 *Contact Support Desk*\n\n` +
    `Please type your question or issue in detail below.\n` +
    `Our team will review your message promptly.\n\n` +
    `_Type your message now:_`;

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
