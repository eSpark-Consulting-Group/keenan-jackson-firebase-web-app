# Square Trivia - File Renaming Guide

## 📋 Complete File Renaming Instructions

Follow this guide to rename all files and place them in the correct folders. Remove the `square-trivia-` prefix and fix extensions.

## 📁 Folder Structure to Create First

```
square-trivia-frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   ├── Game/
│   │   └── Layout/
│   ├── contexts/
│   ├── firebase/
│   ├── pages/
│   │   └── Admin/
│   └── styles/
├── .env.example
├── .gitignore
├── package.json
├── postcss.config.js
├── README.md
└── tailwind.config.js
```

## 📝 File Renaming Chart

| Original Name | New Name | Location | Action |
|--------------|----------|----------|---------|
| **square-trivia-app-js.js** | **App.js** | src/ | Rename & Move |
| **square-trivia-auth-context.js** | **AuthContext.js** | src/contexts/ | Rename & Move |
| **square-trivia-dashboard.js** | **Dashboard.js** | src/pages/ | Rename & Move |
| **square-trivia-firebase-config.js** | **config.js** | src/firebase/ | Rename & Move |
| **square-trivia-game-board.js** | **GameBoard.js** | src/pages/ | Rename & Move |
| **square-trivia-game-score.js** | **GameScore.js** | src/components/Game/ | Rename & Move |
| **square-trivia-games-page.js** | **Games.js** | src/pages/ | Rename & Move |
| **square-trivia-global-css.css** | **globals.css** | src/styles/ | Rename & Move |
| **square-trivia-index-html.html** | **index.html** | public/ | Rename & Move |
| **square-trivia-landing-page.js** | **Landing.js** | src/pages/ | Rename & Move |
| **square-trivia-layout.js** | **Layout.js** | src/components/Layout/ | Use new version |
| **square-trivia-login-page.js** | **Login.js** | src/pages/ | Rename & Move |
| **square-trivia-modal.js** | **TriviaModal.js** | src/components/Game/ | Rename & Move |
| **square-trivia-package-json.json** | **package.json** | root | Rename & Move |
| **square-trivia-profile-page.js** | **Profile.js** | src/pages/ | Rename & Move |
| **square-trivia-register-page.js** | **Register.js** | src/pages/ | Rename & Move |
| **square-trivia-square-grid.js** | **SquareGrid.js** | src/components/Game/ | Rename & Move |
| **square-trivia-tailwind-config.js** | **tailwind.config.js** | root | Rename & Move |

## 🆕 New Files Created (from this session)

| File Name | Location | Description |
|-----------|----------|-------------|
| **ProtectedRoute.js** | src/components/Auth/ | Route guard for authenticated users |
| **AdminRoute.js** | src/components/Auth/ | Route guard for admin users |
| **GameContext.js** | src/contexts/ | Game state management |
| **NotificationContext.js** | src/contexts/ | Notification system |
| **Layout.js** | src/components/Layout/ | Fixed version with corrected imports |

## 🔧 Import Path Fixes Needed

After renaming and moving files, fix these import paths in each file:

### 1. **App.js** (src/App.js)
```javascript
// Change from:
import { auth, db } from './firebase/config';
import { AuthProvider } from './contexts/AuthContext';

// Keep as is - paths are correct
```

### 2. **All Component Files**
```javascript
// Change from:
import { auth, db, callFunction } from '../../firebase/config';

// To:
import { auth, db, callFunction } from '../firebase/config';
// (Remove one ../ level)
```

### 3. **Firebase Config** (src/firebase/config.js)
```javascript
// Add missing import:
import { httpsCallable } from 'firebase/functions';

// Fix callFunction export
```

### 4. **Context Files**
```javascript
// Change from:
import { db, callFunction } from '../../firebase/config';

// To:
import { db, callFunction } from '../firebase/config';
```

## 📂 Step-by-Step Process

### Step 1: Create Folder Structure
```bash
mkdir -p square-trivia-frontend/src/components/Auth
mkdir -p square-trivia-frontend/src/components/Game
mkdir -p square-trivia-frontend/src/components/Layout
mkdir -p square-trivia-frontend/src/contexts
mkdir -p square-trivia-frontend/src/firebase
mkdir -p square-trivia-frontend/src/pages/Admin
mkdir -p square-trivia-frontend/src/styles
mkdir -p square-trivia-frontend/public
```

### Step 2: Rename and Move Files
For each file in the renaming chart:
1. Remove `square-trivia-` prefix
2. Fix extension (remove duplicate .js, .json, etc.)
3. Move to correct folder

### Step 3: Add New Files
Place all newly created files from this session:
- ProtectedRoute.js → src/components/Auth/
- AdminRoute.js → src/components/Auth/
- GameContext.js → src/contexts/
- NotificationContext.js → src/contexts/
- Layout.js → src/components/Layout/ (replace old one)

### Step 4: Fix Import Paths
Go through each JavaScript file and update import paths according to the fixes listed above.

## 🚨 Critical Notes

1. **Layout.js**: Use the new version created in this session, NOT the original square-trivia-layout.js
2. **package.json**: Make sure it includes `"react-scripts": "^5.0.1"` in dependencies
3. **Firebase config**: Must add the missing httpsCallable import
4. **All imports**: Remove extra `../` levels after moving to new folder structure

## ✅ Verification Checklist

After completing the renaming:
- [ ] All files renamed without `square-trivia-` prefix
- [ ] All files in correct folders per structure
- [ ] Import paths updated in all files
- [ ] New files from this session added
- [ ] Layout.js replaced with fixed version
- [ ] No duplicate extensions (.js.js)
- [ ] package.json has react-scripts dependency

## 📦 Files Still Needed (for next sessions)

These files are referenced but not yet created:
- src/index.js
- src/pages/HowToPlay.js
- src/pages/Legal.js
- src/pages/FreeEntry.js
- src/pages/PaymentSuccess.js
- src/pages/PaymentCancel.js
- src/pages/Admin/* (6 admin pages)
- src/components/Game/TierSelection.js
- postcss.config.js
- .env.example
- And more...

These will be created in the subsequent chat sessions as outlined in the deployment plan.