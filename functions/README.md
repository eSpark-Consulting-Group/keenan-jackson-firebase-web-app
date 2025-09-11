# Firebase Cloud Functions

This project contains **Cloud Functions for Firebase** that power backend features such as authentication, payments, messaging, and integrations with external APIs.

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
cd functions
npm install
```

### 2. Set up environment variables
Create a `.env` file inside the `functions/` folder to store sensitive keys (SendGrid, Stripe, Twilio, Telegram, etc.):

```env
SENDGRID_API_KEY=your_sendgrid_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TELEGRAM_BOT_TOKEN=your_telegram_token
```

⚠️ Never commit `.env` files — they’re already in `.gitignore`.

### 3. Emulate functions locally
Run Firebase emulators for development:

```bash
npm run serve
```

This will start:
- Functions emulator
- Firestore emulator
- Auth emulator
- Realtime Database emulator
- Pub/Sub emulator

### 4. Deploy functions
Deploy only functions to Firebase:

```bash
npm run deploy
```

Deploy everything (functions + hosting + rules):

```bash
firebase deploy
```

---

## 📂 Project Structure
```
functions/
 ├── index.js         # Entry point for all functions
 ├── package.json     # Dependencies & scripts
 ├── .env             # Local environment variables (ignored in git)
 └── ...              # Additional modules & utilities
```

---

## 🛠 Available Scripts

| Script              | Description                              |
|---------------------|------------------------------------------|
| `npm run serve`     | Run Firebase emulators                   |
| `npm run shell`     | Open an interactive Cloud Functions shell |
| `npm run start`     | Alias for shell                          |
| `npm run deploy`    | Deploy functions to Firebase             |
| `npm run logs`      | View real-time logs                      |
| `npm run lint`      | Run ESLint checks                        |

---

## 🔑 Integrations

This project integrates with:

- **SendGrid** → Email notifications  
- **Stripe** → Payments  
- **Twilio** → SMS & WhatsApp messaging  
- **Telegram Bot API** → Chatbot support  
- **Firebase Admin SDK** → Database & Auth management  

---

## ✅ Requirements

- Node.js **18** (as specified in `package.json`)
- Firebase CLI  
- An initialized Firebase project (`firebase init`)  

---

## 📜 License
This project is private and not licensed for public use.  
