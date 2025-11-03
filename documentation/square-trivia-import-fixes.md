# Square Trivia - Import Path Fixes

## 🔧 Overview

This document lists all import path corrections needed after reorganizing files into the proper folder structure. Apply these fixes to ensure all components can find their dependencies.

## ❌ Common Import Issues to Fix

### 1. Firebase Config Path

**Issue:** Many files use incorrect relative path to firebase config

```javascript
// ❌ WRONG (too many ../)
import { auth, db, callFunction } from '../../firebase/config';

// ✅ CORRECT
import { auth, db, callFunction } from '../firebase/config';
```

### 2. Missing Imports

**Issue:** Some files are missing required imports

```javascript
// Add these missing imports where needed:
import { doc, getDoc, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { callFunction } from '../firebase/config';
```

## 📁 File-by-File Import Fixes

### **src/App.js**

```javascript
// ❌ OLD
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';

// ✅ NEW (no change needed - these are correct)
```

### **src/pages/Dashboard.js**

```javascript
// ❌ OLD
import { auth, db } from '../firebase/config';

// ✅ NEW - Add missing imports
import { auth, db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// ALSO FIX: Line 124
// ❌ OLD
const userDoc = await getDocs(doc(db, 'users', user.uid));

// ✅ NEW
const userDoc = await getDoc(doc(db, 'users', user.uid));
```

### **src/pages/GameBoard.js**

```javascript
// ❌ OLD
import { db } from '../firebase/config';

// ✅ NEW - Add callFunction import
import { db, callFunction } from '../firebase/config';
```

### **src/pages/Games.js**

```javascript
// ✅ Already correct - no changes needed
import { db } from '../firebase/config';
```

### **src/pages/Login.js**

```javascript
// ✅ Already correct - no changes needed
import { auth } from '../firebase/config';
```

### **src/pages/Register.js**

```javascript
// ✅ Already correct - no changes needed
import { auth, db } from '../firebase/config';
```

### **src/pages/Profile.js**

```javascript
// ✅ Already correct - no changes needed
import { auth, db } from '../firebase/config';
```

### **src/contexts/AuthContext.js**

```javascript
// ✅ Already correct - no changes needed
import { auth } from '../firebase/config';
```

### **src/components/Layout/Layout.js**

```javascript
// ❌ OLD
import { useAuth } from '../../contexts/AuthContext';

// ✅ NEW (if Layout is in src/components/Layout/)
import { useAuth } from '../../contexts/AuthContext';
```

### **src/components/Game/SquareGrid.js**

```javascript
// ❌ OLD
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';

// ✅ NEW
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
```

### **src/components/Game/TriviaModal.js**

```javascript
// ❌ OLD
import { callFunction } from '../../firebase/config';

// ✅ NEW
import { callFunction } from '../../firebase/config';
```

### **src/components/Game/GameScore.js**

```javascript
// ✅ No firebase imports - no changes needed
```

### **src/firebase/config.js**

```javascript
// ❌ OLD - Missing imports
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// ✅ NEW - Add httpsCallable import
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ❌ OLD callFunction implementation
export const callFunction = (functionName, data) => {
  const func = functions.httpsCallable(functionName);
  return func(data);
};

// ✅ NEW callFunction implementation
export const callFunction = (functionName, data) => {
  const func = httpsCallable(functions, functionName);
  return func(data);
};
```

## 🔍 Import Path Rules

### From `src/pages/*` files

- To firebase: `../firebase/config`
- To contexts: `../contexts/[ContextName]`
- To components: `../components/[Component]`

### From `src/components/*` files

- To firebase: `../../firebase/config`
- To contexts: `../../contexts/[ContextName]`
- To other components: `../[Component]`

### From `src/components/[Subfolder]/*` files

- To firebase: `../../../firebase/config`
- To contexts: `../../../contexts/[ContextName]`
- To components in parent: `../../[Component]`

## 📋 Quick Fix Checklist

1. **Fix all firebase config imports**
   - [ ] Check each file for correct relative path
   - [ ] Usually `../firebase/config` from pages
   - [ ] Usually `../../firebase/config` from components

2. **Add missing Firestore imports**
   - [ ] Dashboard.js needs `doc, getDoc`
   - [ ] Any file using Firestore needs proper imports

3. **Fix firebase/config.js**
   - [ ] Add `httpsCallable` import
   - [ ] Update `callFunction` to use new syntax

4. **Fix function calls**
   - [ ] Dashboard.js line 124: `getDocs` → `getDoc`

5. **Verify context imports**
   - [ ] AuthContext imports from all components
   - [ ] GameContext imports where needed
   - [ ] NotificationContext imports where needed

## 🚨 Common Errors and Solutions

### Error: "Cannot find module '../firebase/config'"

**Solution:** Count the folder levels and adjust `../` accordingly

### Error: "httpsCallable is not a function"

**Solution:** Import `httpsCallable` from 'firebase/functions'

### Error: "getDocs is not a function"

**Solution:** You probably meant `getDoc` for single documents

### Error: "auth is undefined"

**Solution:** Check firebase/config.js exports and import statements

## 💡 VS Code Search & Replace

Use these regex patterns to fix imports globally:

1. **Fix firebase imports from pages:**
   - Find: `from ['"]\.\.\/\.\.\/firebase\/config['"]`
   - Replace: `from '../firebase/config'`

2. **Fix firebase imports from components:**
   - Find: `from ['"]\.\.\/\.\.\/\.\.\/firebase\/config['"]`
   - Replace: `from '../../firebase/config'`

3. **Add missing Firestore imports:**
   - Search for: `doc\(db,` or `collection\(db,`
   - Add import if missing: `import { doc, collection } from 'firebase/firestore';`

## ✅ Testing Import Fixes

After fixing imports, test by:

1. Run `npm start` - should compile without errors
2. Check browser console for runtime errors
3. Test each major feature:
   - Login/Register
   - View games
   - Play trivia
   - Claim squares

All import errors should be resolved before deployment!
