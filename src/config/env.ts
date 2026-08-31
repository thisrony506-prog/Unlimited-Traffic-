import dotenv from 'dotenv';
dotenv.config();

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8864392110:AAHkepGrKnIyARAI14z9eF0bbY5m7CQP-kA',
  BOT_USERNAME: (process.env.TELEGRAM_BOT_USERNAME || process.env.BOT_USERNAME || 'InfiniteHits_bot').replace(/^@/, '').trim(),
  SUPPORT_USERNAME: (process.env.SUPPORT_USERNAME || 'InfiniteHits_Support').replace(/^@/, '').trim(),
  APP_URL: process.env.APP_URL || 'https://infinitehits.vercel.app',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'infinitehits_webhook_secret_token',
  WEBHOOK_URL: process.env.WEBHOOK_URL || '',
  
  // Economy settings
  NEW_USER_BONUS: Number(process.env.NEW_USER_BONUS) || 50,
  DAILY_BONUS_AMOUNT: Number(process.env.DAILY_BONUS_AMOUNT) || 10,
  REFERRAL_REWARD_AMOUNT: Number(process.env.REFERRAL_REWARD_AMOUNT) || 100,
  MIN_VISIT_SECONDS: Number(process.env.MIN_VISIT_SECONDS) || 20,
  REWARD_PER_VISIT: Number(process.env.REWARD_PER_VISIT) || 1,
  VISIT_COST_PER_UNIT: Number(process.env.VISIT_COST_PER_UNIT) || 1,

  // Manual payment numbers
  PAYMENT_BKASH_NUMBER: process.env.PAYMENT_BKASH_NUMBER || '01700000000',
  PAYMENT_NAGAD_NUMBER: process.env.PAYMENT_NAGAD_NUMBER || '01800000000',

  // Monetag Ads Mini App Settings
  MONETAG_ZONE_ID: process.env.MONETAG_ZONE_ID || '8839201',
  MONETAG_DIRECT_LINK: process.env.MONETAG_DIRECT_LINK || 'https://otieuwou.com/4/8839201',
  MONETAG_TAG_URL: process.env.MONETAG_TAG_URL || '//kulroakonsu.net/88/tag.min.js',
  MONETAG_REWARD_CREDITS: Number(process.env.MONETAG_REWARD_CREDITS) || 5,
  MONETAG_DAILY_LIMIT: Number(process.env.MONETAG_DAILY_LIMIT) || 20,

  // Firebase
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
};
