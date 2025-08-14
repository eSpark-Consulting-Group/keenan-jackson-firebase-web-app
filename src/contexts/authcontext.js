import { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db, callFunction } from "../firebase/config";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log(firebaseUser, "firebase");
          setUser(firebaseUser);

          // Get additional user data from Firestore
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              id: firebaseUser.uid,
              ...data,
            });

            // Update last active
            updateDoc(userDocRef, {
              lastActive: serverTimestamp(),
            }).catch(console.error);
          } else {
            // User exists in Auth but not Firestore - shouldn't happen
            console.error("User document not found");
            setUser(null);
            setUserData(null);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Register new user
  const register = async (email, password, additionalData = {}) => {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Generate referral code
      const referralCode = generateReferralCode();

      // Create user document
      const userData = {
        email: email.toLowerCase(),
        telegramUsername: additionalData.telegramUsername || null,
        phone: additionalData.phone || null,
        referralCode,
        referredBy: additionalData.referredBy || null,
        currentTiers: [],
        totalDonations: 0,
        totalWins: 0,
        totalPrizeAmount: 0,
        averageAnswerTime: 0,
        dailyTriviaAttempts: 0,
        lastTriviaReset: serverTimestamp(),
        hasTelegram: !!additionalData.telegramUsername,
        notifications: {
          email: true,
          telegram: !!additionalData.telegramUsername,
          sms: false,
        },
        isAdmin: false,
        isBanned: false,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      };

      await setDoc(doc(db, "users", firebaseUser.uid), userData);

      // Process referral if applicable
      if (additionalData.referredBy) {
        await processReferral(additionalData.referredBy, firebaseUser.uid);
      }

      toast.success("Account created successfully!");

      return {
        success: true,
        user: firebaseUser,
        userData: { id: firebaseUser.uid, ...userData },
      };
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = error.message;
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters";
      }

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Login existing user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update login stats
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        lastActive: serverTimestamp(),
        loginCount: increment(1),
      });

      // Get user data
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Check if user is banned
      if (userData?.isBanned) {
        await signOut(auth);
        throw new Error(
          `Account banned: ${userData.banReason || "Terms violation"}`
        );
      }

      toast.success("Welcome back!");

      return {
        success: true,
        user: firebaseUser,
        userData: { id: firebaseUser.uid, ...userData },
      };
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = error.message;
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "Invalid email or password";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
      throw new Error("Failed to logout");
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error);

      let errorMessage = "Failed to send reset email";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email";
      }

      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!user) throw new Error("No user logged in");

    try {
      // Update auth profile if display name changed
      if (updates.displayName && updates.displayName !== user.displayName) {
        await updateProfile(user, { displayName: updates.displayName });
      }

      // Update Firestore document
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Refresh user data
      await refreshUserData();

      toast.success("Profile updated successfully");
      return { success: true };
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
      throw error;
    }
  };

  // Add Telegram to account
  const addTelegramToAccount = async (telegramUsername) => {
    if (!user) throw new Error("No user logged in");

    try {
      const result = await callFunction("addTelegramToAccount", {
        telegramUsername,
        userId: user?.uid,
      });

      if (result.success) {
        await refreshUserData();
        toast.success("Telegram added successfully!");
        return result;
      } else {
        throw new Error(result.error || "Failed to add Telegram");
      }
    } catch (error) {
      console.error("Add Telegram error:", error);
      toast.error(error.message);
      throw error;
    }
  };

  // Refresh user data from Firestore
  const refreshUserData = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserData({
          id: user.uid,
          ...userDoc.data(),
        });
      }
    } catch (error) {
      console.error("Refresh user data error:", error);
    }
  };

  // Get user stats
  const getUserStats = async () => {
    if (!user) return null;

    try {
      // Get user's squares
      const squaresQuery = query(
        collection(db, "squareClaims"),
        where("userId", "==", user.uid)
      );
      const squaresSnapshot = await getDocs(squaresQuery);

      // Get user's wins
      const winsQuery = query(
        collection(db, "winners"),
        where("userId", "==", user.uid)
      );
      const winsSnapshot = await getDocs(winsQuery);

      let totalPrizeAmount = 0;
      winsSnapshot.forEach((doc) => {
        totalPrizeAmount += doc.data().prizeAmount || 0;
      });

      return {
        totalSquares: squaresSnapshot.size,
        totalWins: winsSnapshot.size,
        totalPrizeAmount,
        averageAnswerTime: userData?.averageAnswerTime || 0,
      };
    } catch (error) {
      console.error("Get user stats error:", error);
      return null;
    }
  };

  // Helper functions
  function generateReferralCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async function processReferral(referralCode, referredUserId) {
    try {
      const result = await callFunction("processReferral", {
        referralCode,
        referredUserId,
      });

      if (result.success) {
        console.log("Referral processed successfully");
      }
    } catch (error) {
      console.error("Process referral error:", error);
      // Don't throw - referral is not critical
    }
  }

  const value = {
    user,
    userData,
    loading,
    error,
    // Auth functions
    register,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    addTelegramToAccount,
    // Data functions
    refreshUserData,
    getUserStats,
    // Helper
    isAdmin: userData?.isAdmin || false,
    hasTelegram: userData?.hasTelegram || false,
    currentTiers: userData?.currentTiers || [],
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
