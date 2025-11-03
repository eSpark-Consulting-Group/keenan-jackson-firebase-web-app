import React, { useEffect, useState, Suspense, lazy } from "react";
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
// import { NotificationProvider } from "./contexts/notificationcontext";

// Layout Components
import Layout from "./components/layout/layout";
import ProtectedRoute from "./components/Auth/protected-route";
import AdminRoute from "./components/Auth/admin-route";

// Styles
import "./styles/index.css";

// Page Components
import BlockedPage from "./pages/blocked-page";
import Dashboard from "./pages/dashboard-page";
import FreeEntry from "./pages/freeentry-page";
import GameBoard from "./pages/game-board-page";
import GameResults from "./pages/game-results-page";
import Games from "./pages/games-page";
import HowToPlay from "./pages/howtoplay-page";
import LandingPage from "./pages/landing-page";
import Leaderboard from "./pages/leaderboard-page";
import Legal from "./pages/legal-page";
import Login from "./pages/login-page";
import PaymentCancel from "./pages/payment-cancel-page";
import PaymentSuccess from "./pages/payment-success-page";
import Payouts from "./pages/payouts-page";
import Profile from "./pages/profile-page";
import Register from "./pages/register-page";
import Tier from "./pages/tiers-page";

// Admin Pages
import AdminDashboard from "./pages/admin/admin-dashboard";
import AdminGames from "./pages/admin/admin-games";
import AdminPayouts from "./pages/admin/admin-payouts";
import AdminPayoutsSingle from "./pages/admin/admin-payouts-single";
import AdminReports from "./pages/admin/admin-reports";
import AdminTrivia from "./pages/admin/admin-trivia";
import AdminUsers from "./pages/admin/admin-users";
import AdminUsersSingle from "./pages/admin/admin-users-single";
import ReferralReports from "./pages/admin/admin-referral-reports";
import TeamsFanbase from "./pages/admin/admin-teams-fanbase";

// Utility Functions
import checkEligibility from "./utils/check-eligibility";

function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    const runEligibilityCheck = async () => {
      const data = await checkEligibility();
      console.log("[Session Eligibility]", data);
    };

    runEligibilityCheck();
  }, []); // ← runs once per page load (new session)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
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

  const routesConfig = [
    { path: "/", element: <LandingPage />, layout: true },
    { path: "/home", element: <LandingPage />, layout: true },
    { path: "/login", element: <Login />, layout: true },
    { path: "/register", element: <Register />, layout: true },
    { path: "/how-to-play", element: <HowToPlay />, layout: true },
    { path: "/legal/:page", element: <Legal />, layout: true },
    { path: "/free-entry", element: <FreeEntry />, layout: true },
    { path: "/dashboard", element: <Dashboard />, layout: true, protected: true },
    { path: "/games", element: <Games />, layout: true, protected: true },
    { path: "/game/:boardId", element: <GameBoard />, layout: true, protected: true },
    { path: "/game/:boardId/results", element: <GameResults />, layout: true },
    { path: "/profile", element: <Profile />, layout: true, protected: true },
    { path: "/tiers", element: <Tier />, layout: true, protected: true },
    { path: "/payouts", element: <Payouts />, layout: true, protected: true },
    { path: "/payment-success", element: <PaymentSuccess />, layout: true, protected: true },
    { path: "/payment-cancel", element: <PaymentCancel />, layout: true, protected: true },
    { path: "/leaderboard", element: <Leaderboard />, layout: true, admin: true },
    { path: "/restricted", element: <BlockedPage />, layout: false },

    // Admin routes
    { path: "/admin", element: <AdminDashboard />, layout: true, admin: true },
    { path: "/admin/games", element: <AdminGames />, layout: true, admin: true },
    { path: "/admin/users", element: <AdminUsers />, layout: true, admin: true },
    { path: "/admin/users/:userId", element: <AdminUsersSingle />, layout: true, admin: true },
    { path: "/admin/payouts", element: <AdminPayouts />, layout: true, admin: true },
    { path: "/admin/payouts/:payoutId", element: <AdminPayoutsSingle />, layout: true, admin: true },
    { path: "/admin/trivia", element: <AdminTrivia />, layout: true, admin: true },
    { path: "/admin/reports", element: <AdminReports />, layout: true, admin: true },
    { path: "/admin/teams-reports", element: <TeamsFanbase />, layout: true, admin: true },
    { path: "/admin/referral-reports", element: <ReferralReports />, layout: true, admin: true },
  ];

  return (
    <AuthProvider value={{ user, userData }}>
      <GameProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { background: "#363636", color: "#fff" },
              success: { duration: 3000 },
              error: { duration: 4000 },
            }}
          />
          <Suspense
            fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            }
          >
            <Routes>
              {routesConfig.map(({ path, element, layout, protected: isProtected, admin }) => {
                const wrappedElement = layout ? <Layout>{element}</Layout> : element;

                if (admin)
                  return (
                    <Route key={path} path={path} element={<AdminRoute>{wrappedElement}</AdminRoute>} />
                  );

                if (isProtected)
                  return (
                    <Route key={path} path={path} element={<ProtectedRoute>{wrappedElement}</ProtectedRoute>} />
                  );

                return <Route key={path} path={path} element={wrappedElement} />;
              })}

              {/* Catch-all */}
              <Route
                path="*"
                element={<Navigate to={user ? "/dashboard" : "/"} replace />}
              />
            </Routes>
          </Suspense>
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
