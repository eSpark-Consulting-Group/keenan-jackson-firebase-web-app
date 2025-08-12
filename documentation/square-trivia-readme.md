# Square Trivia - Frontend Application

## 🎯 Overview

Square Trivia is a skill-based sports competition platform where players earn squares on game boards by answering trivia questions quickly and correctly. Winners are determined purely by their trivia answer speed - the fastest correct answer wins when squares match game scores.

**Key Innovation:** Unlike traditional squares games based on luck, Square Trivia rewards knowledge and quick thinking, making it a legal skill-based competition with NO FEES on entry or prizes.

## 🚀 Tech Stack

- **Frontend Framework:** React.js 18
- **Styling:** Tailwind CSS 3
- **State Management:** React Context API
- **Authentication:** Firebase Auth
- **Database:** Cloud Firestore
- **Functions:** Firebase Cloud Functions
- **Hosting:** Firebase Hosting
- **Payments:** Stripe
- **Real-time Data:** API-Sports
- **Notifications:** Telegram Bot API

## ✨ Features

### Core Gameplay
- 🎮 **Skill-Based Competition** - Winners determined by trivia answer speed
- 🏈 **Multiple Sports** - NFL, NBA, NCAA support
- 💰 **Guaranteed Prizes** - Fixed prize amounts, no calculations
- 🚫 **NO FEES** - No fees on entry or winning
- ⚡ **Instant Payouts** - Optional same-day payouts (96% instant or 100% in 2-3 days)

### Game Mechanics
- 📊 **50-Square Boards** - 10×5 grid, 2 players max per square
- ❓ **Dynamic Trivia** - Questions scale with tier difficulty
- 🏆 **Consolation System** - Free chances for speed competition losers
- 📱 **Telegram Integration** - Instant notifications and community

### Technical Features
- 🔐 **Secure Authentication** - Firebase Auth with email/password
- 💳 **Stripe Integration** - PCI-compliant payment processing
- 📊 **Real-time Updates** - Live score tracking via API-Sports
- 📱 **Responsive Design** - Works on all devices
- 🎨 **Modern UI** - Clean, intuitive interface with Tailwind CSS

## 🛠️ Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd square-trivia-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your credentials:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_STRIPE_PUBLISHABLE_KEY=your-stripe-key
   REACT_APP_API_SPORTS_KEY=your-api-sports-key
   ```

4. **Run development server**
   ```bash
   npm start
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📁 Project Structure

```
square-trivia-frontend/
├── public/              # Static files
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── firebase/        # Firebase configuration
│   ├── pages/           # Page components
│   ├── styles/          # Global styles
│   ├── App.js          # Main app component
│   └── index.js        # Entry point
├── .env.example        # Environment template
├── package.json        # Dependencies
└── README.md           # This file
```

## 🧪 Available Scripts

- `npm start` - Run development server
- `npm test` - Run test suite
- `npm run build` - Build for production
- `npm run deploy` - Deploy to Firebase Hosting
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🔧 Configuration

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create Firestore database
4. Enable Cloud Functions
5. Configure security rules

### Stripe Setup
1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get publishable key from Dashboard
3. Set up webhook endpoints
4. Configure payout settings

### API-Sports Setup
1. Get API key from [api-sports.io](https://api-sports.io)
2. Enable American Football API
3. Configure rate limits

## 📱 Key Components

- **AuthContext** - Manages user authentication state
- **GameContext** - Handles game state and board data
- **NotificationContext** - Controls in-app notifications
- **SquareGrid** - Renders the 10×5 game board
- **TriviaModal** - Displays timed trivia questions
- **TierSelection** - Handles tier selection and payment

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

- Email: support@squaretrivia.com
- Telegram: @SquareTriviaSupport
- Documentation: [docs.squaretrivia.com](https://docs.squaretrivia.com)

## 🙏 Acknowledgments

- Firebase for backend infrastructure
- Stripe for payment processing
- API-Sports for live score data
- Tailwind CSS for styling framework