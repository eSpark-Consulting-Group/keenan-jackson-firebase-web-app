import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Firebase imports
import { auth, db } from "./firebase/config";

// Context Providers
import { AuthProvider } from "./contexts/authcontext";
import { GameProvider } from "./contexts/gamecontext";
import { NotificationProvider } from "./contexts/notificationcontext";

// Layout Components
import Layout from "./components/layout/layout";
import ProtectedRoute from "./components/Auth/protected-route";
import AdminRoute from "./components/Auth/admin-route";

// Page Components
import Login from "./pages/square-trivia-login-page";
import Register from "./pages/square-trivia-register-page";
import Dashboard from "./pages/square-trivia-dashboard (1)";
import Games from "./pages/square-trivia-games-page";
import GameBoard from "./pages/square-trivia-game-board";
import Profile from "./pages/square-trivia-profile-page";
import HowToPlay from "./pages/howtoplay-page";
import Legal from "./pages/legal-page";
import FreeEntry from "./pages/freeentry-page";
import PaymentSuccess from "./pages/payment-success-page";
import PaymentCancel from "./pages/payment-cancel-page";

// Admin Pages
import AdminDashboard from "./pages/admin/admin-dashboard";
import AdminGames from "./pages/admin/admin-games";
import AdminUsers from "./pages/admin/admin-users";
import AdminPayouts from "./pages/admin/admin-payouts";
import AdminTrivia from "./pages/admin/admin-trivia";
import AdminReports from "./pages/admin/admin-reports";

// Styles
import "./styles/index.css";
import LandingPage from "./pages/LandingPage";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Fetch additional user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            setUserData({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthProvider value={{ user, userData }}>
      <GameProvider>
        <NotificationProvider>
          <Router>
            <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#363636",
                    color: "#fff",
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: "#10B981",
                      secondary: "#fff",
                    },
                  },
                  error: {
                    duration: 4000,
                    iconTheme: {
                      primary: "#EF4444",
                      secondary: "#fff",
                    },
                  },
                }}
              />

              <Routes>
                {/* Public Routes */}
                {/* <Route path="/" element={<Layout><Landing /></Layout>} /> */}
                <Route
                  path="/"
                  element={
                    <Layout>
                      <LandingPage />
                    </Layout>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <Layout>
                      <Login />
                    </Layout>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <Layout>
                      <Register />
                    </Layout>
                  }
                />
                <Route
                  path="/how-to-play"
                  element={
                    <Layout>
                      <HowToPlay />
                    </Layout>
                  }
                />
                <Route
                  path="/legal/:page"
                  element={
                    <Layout>
                      <Legal />
                    </Layout>
                  }
                />
                <Route
                  path="/free-entry"
                  element={
                    <Layout>
                      <FreeEntry />
                    </Layout>
                  }
                />

                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/games"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Games />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/game/:boardId"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <GameBoard />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-success"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <PaymentSuccess />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment-cancel"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <PaymentCancel />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/games"
                  element={
                    <AdminRoute>
                      <Layout>
                        <AdminGames />
                      </Layout>
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <Layout>
                        <AdminUsers />
                      </Layout>
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/payouts"
                  element={
                    <AdminRoute>
                      <Layout>
                        <AdminPayouts />
                      </Layout>
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/trivia"
                  element={
                    <AdminRoute>
                      <Layout>
                        <AdminTrivia />
                      </Layout>
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AdminRoute>
                      <Layout>
                        <AdminReports />
                      </Layout>
                    </AdminRoute>
                  }
                />

                {/* Catch all - redirect to dashboard or landing */}
                <Route
                  path="*"
                  element={<Navigate to={user ? "/dashboard" : "/"} replace />}
                />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
