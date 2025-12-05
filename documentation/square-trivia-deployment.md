# Square Trivia - Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Firebase project created
- [ ] Stripe account with API keys
- [ ] API-Sports account with API key
- [ ] Domain name (optional, for custom domain)

## 🔧 Firebase Project Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project"
3. Name it: `square-trivia-prod`
4. Enable Google Analytics (optional)

### 2. Enable Services

In Firebase Console, enable:

- **Authentication**
  - Go to Authentication → Sign-in method
  - Enable Email/Password provider
  
- **Firestore Database**
  - Go to Firestore Database
  - Click "Create Database"
  - Choose production mode
  - Select location (us-central1 recommended)
  
- **Cloud Functions**
  - Requires Blaze (pay-as-you-go) plan
  - Go to Functions → Get Started
  
- **Hosting**
  - Already enabled by default

### 3. Configure Security Rules

**Firestore Rules** (firestore.rules):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/update their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read games
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
    }
    
    // Authenticated users can read boards
    match /boards/{boardId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write
    }
    
    // Users can read their own squares
    match /squares/{squareId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions can write
    }
  }
}
```

## 📝 Environment Variables Setup

### 1. Local Development (.env)

Create `.env` file in project root:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=square-trivia-prod.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=square-trivia-prod
REACT_APP_FIREBASE_STORAGE_BUCKET=square-trivia-prod.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef

# Stripe
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...

# API-Sports
REACT_APP_API_SPORTS_KEY=your-api-key

# Environment
REACT_APP_ENV=development
```

### 2. Production Environment Variables

Set in Firebase:

```bash
firebase functions:config:set \
  stripe.secret="sk_live_..." \
  stripe.webhook_secret="whsec_..." \
  telegram.bot_token="123456:ABC..." \
  telegram.channel_ids.tier_25="-1001234567890" \
  telegram.channel_ids.tier_50="-1001234567891" \
  telegram.channel_ids.tier_100="-1001234567892" \
  api_sports.key="your-api-key" \
  email.user="noreply@squaretrivia.com" \
  email.pass="your-app-password"
```

## 🚀 Deployment Steps

### 1. Initialize Firebase

```bash
# Login to Firebase
firebase login

# Initialize project
firebase init

# Select:
# - Hosting
# - Functions
# - Firestore
# When asked about project, select your existing project
# For hosting directory, use "build"
# Configure as single-page app: Yes
# Set up automatic builds: No
```

### 2. Build the Application

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build
```

### 3. Deploy to Firebase

```bash
# Deploy everything (hosting, functions, rules)
firebase deploy

# Or deploy individually:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
```

### 4. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://us-central1-square-trivia-prod.cloudfunctions.net/stripeWebhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.failed`
4. Copy webhook signing secret
5. Update Firebase config:

   ```bash
   firebase functions:config:set stripe.webhook_secret="whsec_..."
   ```

## 🌐 Custom Domain Setup

### 1. Add Custom Domain in Firebase

1. Go to Firebase Console → Hosting
2. Click "Add custom domain"
3. Enter: `squaretrivia.com` and `www.squaretrivia.com`
4. Verify ownership (add TXT record)
5. Add A records to your DNS:

   ```cmd
   A record: @ → Firebase IPs
   A record: www → Firebase IPs
   ```

### 2. SSL Certificate

Firebase automatically provisions SSL certificates. Wait 24-48 hours for propagation.

## 📊 Post-Deployment Checklist

- [ ] Test user registration flow
- [ ] Test Stripe payment flow
- [ ] Verify Telegram notifications
- [ ] Check trivia question loading
- [ ] Test game board interaction
- [ ] Verify payout flow
- [ ] Monitor error logs
- [ ] Set up Google Analytics
- [ ] Configure uptime monitoring

## 🔍 Monitoring & Logs

### View Logs

```bash
# Hosting logs
firebase hosting:channel:list

# Function logs
firebase functions:log

# Or in Firebase Console:
# Functions → Logs
```

### Performance Monitoring

1. Enable Performance Monitoring in Firebase
2. Add Performance SDK to React app
3. Monitor key metrics:
   - Page load time
   - API response times
   - Function execution times

## 🚨 Rollback Procedures

### Hosting Rollback

```bash
# List releases
firebase hosting:releases:list

# Rollback to previous
firebase hosting:rollback
```

### Function Rollback

- Deploy previous function version from Git
- Or use Firebase Console → Functions → Version history

## 🔐 Security Checklist

- [ ] Environment variables secured
- [ ] Firestore rules restrict access
- [ ] API keys not exposed in client
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Input validation on all forms
- [ ] XSS protection headers set

## 📈 Scaling Considerations

### When to Scale

- 1000+ concurrent users
- Function execution > 30 seconds
- Firestore reads > 50k/day

### Scaling Options

1. **Firestore**: Enable offline persistence
2. **Functions**: Increase memory/timeout
3. **Hosting**: Use Firebase CDN
4. **Images**: Implement lazy loading

## 🆘 Troubleshooting

### Common Issues

#### Build Fails

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Functions Not Deploying

```bash
# Check Node version (needs 16+)
node --version

# Update dependencies
cd functions && npm update
```

#### Stripe Webhooks Failing

- Verify endpoint URL
- Check webhook secret
- Review Stripe logs

#### Telegram Not Working

- Verify bot token
- Check channel IDs
- Ensure bot is admin in channels

## 📞 Support Contacts

- **Firebase Support**: [support.google.com/firebase](https://support.google.com/firebase)
- **Stripe Support**: [support.stripe.com](https://support.stripe.com)
- **Developer Email**: [dev@squaretrivia.com](mailto:dev@squaretrivia.com)
- **Emergency**: +1-XXX-XXX-XXXX

## 🎉 Launch Checklist

### Soft Launch (Beta)

- [ ] Deploy to staging environment
- [ ] Test with 10-20 beta users
- [ ] Monitor for 48 hours
- [ ] Fix critical bugs
- [ ] Gather feedback

### Production Launch

- [ ] Final security audit
- [ ] Load testing complete
- [ ] Backup procedures tested
- [ ] Support team briefed
- [ ] Marketing materials ready
- [ ] Press release scheduled
- [ ] Social media scheduled

Good luck with your deployment! 🚀
