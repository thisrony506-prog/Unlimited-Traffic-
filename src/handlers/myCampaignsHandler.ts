import { Context } from 'grammy';
import { db } from '../database/db';
import { myCampaignsInlineKeyboard, backToMainInlineKeyboard } from '../keyboards';
import { formatMyCampaignsOverview } from '../utils/formatters';

export const handleMyCampaigns = async (ctx: Context) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const campaigns = db.getUserCampaigns(telegramId);
  const text = formatMyCampaignsOverview(campaigns);

  if (ctx.callbackQuery) {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: myCampaignsInlineKeyboard(campaigns),
    });
  } else {
    await ctx.reply(text, {
      parse_mode: 'Markdown',
      reply_markup: myCampaignsInlineKeyboard(campaigns),
    });
  }
};

export const handleToggleCampaignCallback = async (ctx: Context, campaignId: string) => {
  if (!ctx.from) return;

  const telegramId = ctx.from.id;
  const toggleRes = db.toggleCampaignStatus(campaignId, telegramId);

  if (!toggleRes.success) {
    await ctx.answerCallbackQuery({
      text: 'Could not toggle campaign status.',
      show_alert: true,
    });
    return;
  }

  await ctx.answerCallbackQuery({
    text: `Campaign status updated to ${toggleRes.newStatus}!`,
  });

  const campaigns = db.getUserCampaigns(telegramId);
  const text = formatMyCampaignsOverview(campaigns);

  try {
    await ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      reply_markup: myCampaignsInlineKeyboard(campaigns),
    });
  } catch {}
};

export const handleCampaignDetailCallback = async (ctx: Context, campaignId: string) => {
  if (!ctx.from) return;

  const campaign = db.getCampaignById(campaignId);
  if (!campaign) {
    await ctx.reply('❌ Campaign not found.', {
      parse_mode: 'Markdown',
      reply_markup: backToMainInlineKeyboard,
    });
    return;
  }

  const statusEmoji =
    campaign.status === 'ACTIVE'
      ? '🟢 ACTIVE'
      : campaign.status === 'PAUSED'
      ? '⏸ PAUSED'
      : campaign.status === 'COMPLETED'
      ? '🏁 COMPLETED'
      : '⚪ ' + campaign.status;

  const text =
    `📊 *Campaign Details*\n\n` +
    `Campaign ID: \`${campaign.campaignId}\`\n` +
    `🌐 Website: \`${campaign.websiteUrl}\`\n` +
    `Status: ${statusEmoji}\n\n` +
    `👁️ *Progress:* ${campaign.completedVisits.toLocaleString()} / ${campaign.requiredVisits.toLocaleString()} visits\n` +
    `⏳ *Remaining:* ${campaign.remainingVisits.toLocaleString()} visits\n` +
    `⏱ *Stay Duration:* ${campaign.minimumVisitSeconds} seconds\n` +
    `🎁 *Reward Per Visit:* ${campaign.rewardPerVisit} Credit\n` +
    `💳 *Total Cost:* ${campaign.cost.toLocaleString()} Credits\n\n` +
    `Created: ${new Date(campaign.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}`;

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
