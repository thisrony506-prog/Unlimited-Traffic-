import { Keyboard, InlineKeyboard } from 'grammy';
import { config } from '../config/env';

/**
 * Main Reply Keyboard available persistent across chat
 */
export const mainReplyKeyboard = new Keyboard()
  .text('💰 My Balance').text('📋 Available Tasks').row()
  .text('✅ My Tasks').text('👥 Referral').row()
  .text('💸 Withdraw').text('📊 History').row()
  .text('👤 Profile').text('🎧 Support').row()
  .text('📜 Rules')
  .resized();

/**
 * Balance View Inline Keyboard
 */
export const balanceInlineKeyboard = new InlineKeyboard()
  .text('💸 Withdraw', 'nav_withdraw')
  .text('📊 Transaction History', 'nav_history')
  .row()
  .text('⬅️ Main Menu', 'nav_main');

/**
 * Tasks View Inline Keyboards
 */
export const taskListInlineKeyboard = (taskId: string) => {
  return new InlineKeyboard()
    .text('▶️ Start Task', `task_start_${taskId}`)
    .row();
};

export const taskDetailInlineKeyboard = (taskId: string) => {
  return new InlineKeyboard()
    .text('✅ Submit Task', `task_submit_${taskId}`)
    .row()
    .text('⬅️ Back to Tasks', 'nav_tasks');
};

/**
 * My Tasks List Navigation
 */
export const myTasksInlineKeyboard = new InlineKeyboard()
  .text('📋 Available Tasks', 'nav_tasks')
  .text('⬅️ Main Menu', 'nav_main');

/**
 * Referral View Inline Keyboard
 */
export const referralInlineKeyboard = (referralCode: string) => {
  const botUser = config.BOT_USERNAME;
  const refLink = `https://t.me/${botUser}?start=${referralCode}`;
  const shareText = encodeURIComponent(
    `💰 Join EarnFlow and start earning rewards by completing simple tasks! Direct payout to bKash & Nagad.\nJoin here: ${refLink}`
  );
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`;

  return new InlineKeyboard()
    .text('📋 Copy Referral Link', `copy_ref_${referralCode}`)
    .url('📤 Share Referral Link', shareUrl)
    .row()
    .text('⬅️ Main Menu', 'nav_main');
};

/**
 * Withdrawal Method Selection Inline Keyboard
 */
export const withdrawalMethodsInlineKeyboard = new InlineKeyboard()
  .text('bKash', 'wdr_method_bKash')
  .text('Nagad', 'wdr_method_Nagad')
  .row()
  .text('⬅️ Cancel', 'nav_main');

/**
 * Withdrawal Confirmation Inline Keyboard
 */
export const withdrawalConfirmInlineKeyboard = new InlineKeyboard()
  .text('✅ Confirm', 'wdr_confirm_yes')
  .text('❌ Cancel', 'wdr_cancel')
  .row();

/**
 * History Pagination Inline Keyboard
 */
export const historyPaginationInlineKeyboard = (currentPage: number, totalPages: number) => {
  const kb = new InlineKeyboard();
  if (currentPage > 1) {
    kb.text('⬅️ Previous', `hist_page_${currentPage - 1}`);
  }
  if (currentPage < totalPages) {
    kb.text('Next ➡️', `hist_page_${currentPage + 1}`);
  }
  kb.row().text('⬅️ Main Menu', 'nav_main');
  return kb;
};

/**
 * Support View Inline Keyboard
 */
export const supportInlineKeyboard = new InlineKeyboard()
  .text('📩 Contact Support', 'support_contact')
  .text('❓ FAQ', 'support_faq')
  .row()
  .text('⬅️ Main Menu', 'nav_main');

/**
 * Standard Back to Main Menu Button
 */
export const backToMainInlineKeyboard = new InlineKeyboard().text('⬅️ Main Menu', 'nav_main');
