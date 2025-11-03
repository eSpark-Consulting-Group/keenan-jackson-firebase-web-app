# 🚀 Square Trivia – Deployment Guide

This project has **two apps**:

1. **Frontend (React)** – User-facing app (Firebase Hosting)
2. **Backend (Firebase Functions)** – API and integrations (Stripe, Twilio, SendGrid, Telegram, etc.)

Both live inside **one Firebase project**.

---

## 📂 Project Structure

```txt
root/
 ├── functions/     # Backend (Firebase Functions)
 ├── frontend/      # Frontend (React app)
 └── firebase.json  # Firebase config
```

---

## 1. Backend (Functions)

### Install BE dependencies

```bash
cd functions
npm install
```

### Deploy functions

```bash
npm run deploy
```

### Functions will be available at

```txt
https://us-central1-YOUR_PROJECT.cloudfunctions.net/<functionName>
```

---

## 2. Frontend (React)

### Install FE dependencies

```bash
cd frontend
npm install
```

### Build & Deploy

```bash
npm run build
firebase deploy --only hosting
```

### App will be live at

```txt
https://YOUR_PROJECT.web.app
```

---

## 3. Connecting Frontend → Backend

### ✅ Recommended: Use Hosting Rewrites

Update `firebase.json` (at project root):

```json
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"   // replace with your Cloud Function name
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Now in React:

```javascript
axios.get("/api/someFunction");
```

👉 Requests will automatically be forwarded from **Hosting → Functions**.  
No CORS headaches, single domain.

---

## 4. Environment Variables

Set secrets (Stripe, Twilio, etc.) safely:

```bash
firebase functions:config:set stripe.secret="sk_test_123"
firebase functions:config:set sendgrid.api_key="SG_XXXX"
```

Access in your function:

```javascript
const stripe = require("stripe")(process.env.STRIPE_SECRET);
```

---

## 5. Best Practices

- Remove `react` and `react-dom` from **functions/package.json** (not needed in backend).
- Keep **all deploys under one Firebase project**.
- Use `firebase emulators:start` during local dev to run FE + BE together.

---

## 🚀 Quick Deploy Commands

- **Deploy backend only**

  ```bash
  cd functions
  npm run deploy
  ```

- **Deploy frontend only**

  ```bash
  cd frontend
  npm run deploy
  ```

- **Deploy everything**

  ```bash
  firebase deploy
  ```

---

✅ With this setup:

- **Frontend (React)** → Firebase Hosting
- **Backend (APIs)** → Firebase Functions  
- **Both under one domain** with Hosting rewrites  
