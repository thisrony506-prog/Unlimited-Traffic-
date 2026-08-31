import dotenv from 'dotenv';
dotenv.config();

export const config = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '8864392110:AAHkepGrKnIyARAI14z9eF0bbY5m7CQP-kA',
  BOT_USERNAME: (process.env.BOT_USERNAME || 'earnflowV3_bot').replace(/^@/, '').trim(),
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  SUPPORT_CHAT_ID: process.env.SUPPORT_CHAT_ID || '',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'earnflow_secret_token_123',
  WEBHOOK_URL: process.env.WEBHOOK_URL || '',
  MIN_WITHDRAWAL_AMOUNT: Number(process.env.MIN_WITHDRAWAL_AMOUNT) || 100,
  REFERRAL_REWARD_AMOUNT: Number(process.env.REFERRAL_REWARD_AMOUNT) || 10,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
};
