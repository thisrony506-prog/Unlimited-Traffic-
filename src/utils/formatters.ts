import { User, Task, TaskSubmission, Transaction, Withdrawal, SystemSettings, Announcement } from '../types';
import { config } from '../config/env';

export const formatWelcomeMessage = (firstName: string, announcement?: Announcement | null): string => {
  let text = `👋 Welcome to InfiniteHits, ${firstName}!\n\nComplete eligible tasks, earn rewards, invite friends, and manage your account directly from Telegram.\n\nChoose an option below to get started.`;

  if (announcement) {
    text = `📢 *${announcement.title}*\n${announcement.message}\n\n━━━━━━━━━━━━━━\n\n` + text;
  }
  return text;
};

export const formatBalanceMessage = (user: User): string => {
  return (
    `💰 *Wallet*\n\n` +
    `Available Balance: ৳${user.balance.toFixed(2)}\n` +
    `Total Earned: ৳${user.totalEarned.toFixed(2)}\n` +
    `Total Withdrawn: ৳${user.totalWithdrawn.toFixed(2)}\n` +
    `Pending Withdrawal: ৳${user.pendingWithdrawal.toFixed(2)}`
  );
};

export const formatAvailableTasksMessage = (tasks: Task[]): string => {
  if (tasks.length === 0) {
    return `📋 *Available Tasks*\n\nCurrently, there are no published tasks available. Please check back later for new tasks!`;
  }

  return (
    `📋 *Available Tasks*\n` +
    `Select a task to view instructions and start earning rewards.`
  );
};

export const formatSingleTaskMessage = (task: Task): string => {
  return (
    `━━━━━━━━━━━━━━\n` +
    `*${task.title}*\n\n` +
    `${task.description}\n\n` +
    `Reward: ৳${task.reward.toFixed(2)}\n` +
    `Estimated Time: ${task.estimatedTime}\n` +
    `Requirements: ${task.requirements.toUpperCase()} proof`
  );
};

export const formatTaskInstructionsMessage = (task: Task): string => {
  return (
    `📋 *Task Details & Instructions*\n\n` +
    `*${task.title}*\n\n` +
    `Reward: ৳${task.reward.toFixed(2)}\n` +
    `Estimated Time: ${task.estimatedTime}\n\n` +
    `📝 *Instructions:*\n` +
    `${task.instructions}\n\n` +
    `When you are ready, click *Submit Task* below and provide your proof.`
  );
};

export const formatMyTasksMessage = (submissions: TaskSubmission[]): string => {
  if (submissions.length === 0) {
    return (
      `✅ *My Tasks*\n\n` +
      `You haven't started or completed any tasks yet.\n` +
      `Click "📋 Available Tasks" from the main menu to begin earning!`
    );
  }

  let text = `✅ *My Tasks History*\n\n`;
  submissions.forEach((sub, index) => {
    let statusEmoji = '⏳';
    if (sub.status === 'approved') statusEmoji = '✅';
    if (sub.status === 'rejected') statusEmoji = '❌';

    text +=
      `*${index + 1}. ${sub.taskTitle || 'Task'}*\n` +
      `Reward: ৳${sub.rewardAmount.toFixed(2)}\n` +
      `Status: ${statusEmoji} ${sub.status.toUpperCase()}\n`;
    if (sub.rejectionReason) {
      text += `Reason: ${sub.rejectionReason}\n`;
    }
    text += `Submitted: ${new Date(sub.createdAt).toLocaleDateString()}\n━━━━━━━━━━━━━━\n`;
  });

  return text;
};

export const formatReferralMessage = (user: User): string => {
  const botUser = config.BOT_USERNAME;
  const refLink = `https://t.me/${botUser}?start=${user.referralCode}`;

  return (
    `👥 *Referral Program*\n\n` +
    `Invite your friends and earn ৳${config.REFERRAL_REWARD_AMOUNT.toFixed(2)} for every valid friend who joins!\n\n` +
    `Your Referral Code:\n\`${user.referralCode}\`\n\n` +
    `Your Referral Link:\n\`${refLink}\`\n\n` +
    `Total Referrals: ${user.totalReferrals}\n` +
    `Successful Referrals: ${user.successfulReferrals}\n` +
    `Referral Earnings: ৳${user.referralEarnings.toFixed(2)}`
  );
};

export const formatWithdrawMessage = (user: User, minWithdrawal: number): string => {
  return (
    `💸 *Withdraw Funds*\n\n` +
    `Available Balance: ৳${user.balance.toFixed(2)}\n` +
    `Minimum Withdrawal: ৳${minWithdrawal.toFixed(2)}\n\n` +
    `Select payment method:`
  );
};

export const formatWithdrawConfirmation = (amount: number, method: string, account: string): string => {
  const maskedAccount =
    account.length > 4 ? account.slice(0, 3) + '****' + account.slice(-2) : account;

  return (
    `*Withdrawal Confirmation*\n\n` +
    `Amount: ৳${amount.toFixed(2)}\n` +
    `Method: ${method}\n` +
    `Account: ${maskedAccount}\n\n` +
    `Please confirm that your payment account details are correct.`
  );
};

export const formatHistoryMessage = (
  transactions: Transaction[],
  page: number,
  totalPages: number
): string => {
  if (transactions.length === 0) {
    return `📊 *Transaction History*\n\nNo transaction records found.`;
  }

  let text = `📊 *Transaction History* (Page ${page}/${totalPages})\n\n`;
  transactions.forEach((tx) => {
    const isCredit = tx.amount > 0;
    const prefix = isCredit ? '+' : '';
    text +=
      `${isCredit ? '🟢' : '🔴'} *${prefix}৳${Math.abs(tx.amount).toFixed(2)}*\n` +
      `  ${tx.description}\n` +
      `  _${new Date(tx.createdAt).toLocaleString()} | Status: ${tx.status}_\n\n`;
  });

  return text;
};

export const formatProfileMessage = (user: User): string => {
  const dateStr = new Date(user.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    `👤 *My Profile*\n\n` +
    `Name: ${user.firstName}${user.lastName ? ' ' + user.lastName : ''}\n` +
    `Username: ${user.username ? '@' + user.username : 'Not set'}\n` +
    `Telegram ID: \`${user.telegramId}\`\n\n` +
    `Referral Code: \`${user.referralCode}\`\n\n` +
    `Account Created:\n${dateStr}\n\n` +
    `Completed Tasks:\n${user.completedTasks}\n\n` +
    `Referral Count:\n${user.totalReferrals}`
  );
};

export const formatSupportMessage = (): string => {
  return (
    `🎧 *Support Center*\n\n` +
    `Have a question, task issue, or withdrawal inquiry? We are here to help!\n\n` +
    `Choose an option below:`
  );
};

export const formatFAQMessage = (): string => {
  return (
    `❓ *Frequently Asked Questions*\n\n` +
    `1. *How do I earn money?*\n` +
    `• Complete tasks listed under "Available Tasks" or invite friends using your unique referral link.\n\n` +
    `2. *When will my task proof be verified?*\n` +
    `• Task submissions are reviewed by our verification team within 24 hours.\n\n` +
    `3. *How do I withdraw earnings?*\n` +
    `• Click "💸 Withdraw", select bKash or Nagad, enter the amount (min ৳100) and your account number.\n\n` +
    `4. *Can I create multiple accounts?*\n` +
    `• No. Multiple accounts or fake referrals are strictly detected and banned.`
  );
};

export const formatRulesMessage = (rulesText: string): string => {
  return rulesText;
};
