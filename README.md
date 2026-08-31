# EarnFlow - Complete Telegram Income & Task Bot

EarnFlow is a production-ready, secure, server-side Telegram Income & Task Bot built with Node.js, TypeScript, Express, and GrammY framework.

---

## 🚀 Key Features & Architecture

- **Telegram Bot Only Interface**: 100% of user interactions occur inside Telegram via Telegram Bot API, commands, reply keyboards, inline keyboards, and callback queries.
- **Immutable Balance Ledger**: Server-side balance calculations with strict ledger transactions (`task_reward`, `referral_reward`, `withdrawal`, `withdrawal_refund`, `admin_adjustment`).
- **Task Verification System**: Task listing, proof submission (text/photo/document), review workflow, anti-fraud checks, and atomic reward credit.
- **Referral Engine**: Unique referral codes, anti-self-referral validation, single reward per referral, and Telegram share URL integration.
- **Withdrawal Engine**: Supports bKash & Nagad payments with configurable minimum thresholds (৳100 min), input validation, user confirmation steps, balance reservation, and status updates.
- **Support System**: In-bot ticket submission workflow and automated message forwarding to `SUPPORT_CHAT_ID`.
- **Server Security**: Atomic transactions, rate limiting, update signature validation, anti-double-reward logic, and secret isolation via `.env`.

---

## 🛠️ Bot Commands

| Command | Action |
|---|---|
| `/start` | Register user, process referral link, show welcome message & main menu |
| `/menu` | Display main keyboard navigation |
| `/balance` | View wallet balance (Available, Total Earned, Withdrawn, Pending) |
| `/tasks` | View published available tasks with reward & requirements |
| `/mytasks` | View user's submitted task history and review statuses |
| `/referral` | Get unique referral link & stats (Total, Successful, Earnings) |
| `/withdraw` | Initiate bKash or Nagad withdrawal request |
| `/history` | View paginated transaction ledger history |
| `/profile` | View account details and stats |
| `/support` | Create support tickets or browse FAQs |
| `/rules` | View community & earning policies |
| `/help` | Display command guide |

---

## ⚙️ Environment Variables Setup

Create a `.env` file based on `.env.example`:

```env
TELEGRAM_BOT_TOKEN="8864392110:AAHkepGrKnIyARAI14z9eF0bbY5m7CQP-kA"
BOT_USERNAME="earnflowV3_bot"
SUPPORT_CHAT_ID=""
WEBHOOK_SECRET="earnflow_secret_123"
WEBHOOK_URL="https://your-domain.com/telegram/webhook"
MIN_WITHDRAWAL_AMOUNT="100"
REFERRAL_REWARD_AMOUNT="10"
```

---

## 📦 Step-by-Step Deployment Instructions

### Step 1: Create Telegram Bot via BotFather
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`.
3. Set Bot Name: `EarnFlow`.
4. Set Bot Username: `earnflowV3_bot`.
5. Copy the HTTP API Token provided by BotFather.

### Step 2: Configure Environment Variables
1. Set `TELEGRAM_BOT_TOKEN` in your server environment or `.env`.
2. Set `BOT_USERNAME=earnflowV3_bot`.

### Step 3: Install Dependencies & Build
```bash
npm install
npm run build
```

### Step 4: Run the Server
```bash
# Production mode
npm run start

# Development mode
npm run dev
```

### Step 5: Configure Telegram Webhook
To route Telegram updates to your deployed server, execute the following API call:

```bash
curl -X POST "https://api.telegram.org/bot8864392110:AAHkepGrKnIyARAI14z9eF0bbY5m7CQP-kA/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<YOUR_APP_URL>/telegram/webhook",
    "secret_token": "earnflow_secret_123"
  }'
```

### Step 6: Verify Bot Functionality
1. Send `/start` to `@earnflowV3_bot` in Telegram.
2. Click `📋 Available Tasks` and start a task.
3. Submit proof and review in server audit queue.
4. Test referral link generation `/referral`.
5. Test `/withdraw` for bKash & Nagad.
