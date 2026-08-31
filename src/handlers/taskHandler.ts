import { Context } from 'grammy';
import { dbService } from '../database/db';
import {
  formatAvailableTasksMessage,
  formatSingleTaskMessage,
  formatTaskInstructionsMessage,
  formatMyTasksMessage,
} from '../utils/formatters';
import {
  taskListInlineKeyboard,
  taskDetailInlineKeyboard,
  myTasksInlineKeyboard,
} from '../keyboards';
import { sessionManager } from '../services/session';

export const handleAvailableTasks = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const tasks = dbService.getAvailableTasks();

  if (ctx.callbackQuery) {
    await ctx.answerCallbackQuery().catch(() => {});
  }

  const introText = formatAvailableTasksMessage(tasks);
  await ctx.reply(introText, { parse_mode: 'Markdown' });

  if (tasks.length === 0) return;

  for (const task of tasks) {
    const isSubmitted = dbService.hasUserSubmittedTask(ctx.from.id, task.taskId);
    let cardText = formatSingleTaskMessage(task);
    if (isSubmitted) {
      cardText += `\n\n📌 *Status:* Proof already submitted (Pending review)`;
      await ctx.reply(cardText, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(cardText, {
        parse_mode: 'Markdown',
        reply_markup: taskListInlineKeyboard(task.taskId),
      });
    }
  }
};

export const handleStartTaskCallback = async (ctx: Context, taskId: string) => {
  if (!ctx.from) return;
  const task = dbService.getTask(taskId);
  if (!task) {
    await ctx.answerCallbackQuery({ text: 'Task not found or expired.', show_alert: true });
    return;
  }

  const isSubmitted = dbService.hasUserSubmittedTask(ctx.from.id, taskId);
  if (isSubmitted) {
    await ctx.answerCallbackQuery({
      text: 'You have already submitted proof for this task!',
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery();
  const text = formatTaskInstructionsMessage(task);
  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: taskDetailInlineKeyboard(task.taskId),
  });
};

export const handleSubmitTaskCallback = async (ctx: Context, taskId: string) => {
  if (!ctx.from) return;
  const task = dbService.getTask(taskId);
  if (!task) {
    await ctx.answerCallbackQuery({ text: 'Task not found or expired.', show_alert: true });
    return;
  }

  const isSubmitted = dbService.hasUserSubmittedTask(ctx.from.id, taskId);
  if (isSubmitted) {
    await ctx.answerCallbackQuery({
      text: 'You have already submitted proof for this task!',
      show_alert: true,
    });
    return;
  }

  sessionManager.startTaskProof(ctx.from.id, taskId);
  await ctx.answerCallbackQuery();

  await ctx.reply(
    `📤 *Submit Proof for ${task.title}*\n\n` +
      `Please send your proof now as a text message, screenshot, or document.\n\n` +
      `_Type your response or attach file below:_`,
    { parse_mode: 'Markdown' }
  );
};

export const handleMyTasks = async (ctx: Context) => {
  if (!ctx.from) return;
  sessionManager.clearSession(ctx.from.id);

  const submissions = dbService.getUserSubmissions(ctx.from.id);
  const text = formatMyTasksMessage(submissions);

  await ctx.reply(text, {
    parse_mode: 'Markdown',
    reply_markup: myTasksInlineKeyboard,
  });
};
