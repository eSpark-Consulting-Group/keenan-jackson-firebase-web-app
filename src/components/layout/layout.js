import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Grid3X3,
  User,
  LogOut,
  HelpCircle,
  Shield,
  Mail,
  Brain,
  DollarSign,
  ChevronDown,
  Settings,
  BarChart3,
  Users,
  CircleDollarSign,
} from "lucide-react";
import { useAuth } from "../../contexts/authcontext";
import toast from "react-hot-toast";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const navigation = [
    { name: "Home", href: "/", icon: Home, public: true },
    { name: "Dashboard", href: "/dashboard", icon: Grid3X3, requireAuth: true },
    { name: "Games", href: "/games", icon: Brain, requireAuth: true },
    {
      name: "How to Play",
      href: "/how-to-play",
      icon: HelpCircle,
      public: true,
    },
    {
      name: "Payouts",
      href: "/payouts",
      icon: DollarSign,
      requireAuth: true,
    },
  ];

  const userNavigation = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
    {
      name: "Payouts",
      href: "/payouts",
      icon: DollarSign,
      public: true,
    },
  ];

  const adminNavigation = [
    { name: "Admin Dashboard", href: "/admin", icon: BarChart3 },
    { name: "Manage Users", href: "/admin/users", icon: Users },
    { name: "Manage Games", href: "/admin/games", icon: Grid3X3 },
    { name: "Manage Payouts", href: "/admin/payouts", icon: CircleDollarSign },
    { name: "Manage Reports", href: "/admin/reports", icon: BarChart3 },
    { name: "Team Reports", href: "/admin/teams-reports", icon: BarChart3 },
    {
      name: "Referral Reports",
      href: "/admin/referral-reports",
      icon: BarChart3,
    },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main nav */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center min-w-0">
                <img src="../logo.svg" alt="Square Trivia" width="150px" />
              </Link>

              {/* Desktop navigation */}
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                {navigation.map((item) => {
                  if (item.requireAuth && !user) return null;
                  if (!item.public && !item.requireAuth) return null;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`
                        inline-flex items-center px-1 pt-1 text-sm font-medium
                        border-b-2 transition-colors duration-200
                        ${
                          isActive(item.href)
                            ? "border-blue-600 text-gray-900"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }
                      `}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center">
              {user ? (
                <>
                  {/* Tier badges */}
                  {userData?.currentTiers?.length > 0 && (
                    <div className="hidden md:flex items-center mr-4 space-x-2">
                      {userData.currentTiers.slice(0, 3).map((tier, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                        >
                          ${tier.replace("tier_", "")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {user.email?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                        >
                          <div className="py-1">
                            {/* User info */}
                            <div className="px-4 py-2 border-b">
                              <p className="text-sm font-medium text-gray-900">
                                {user.email}
                              </p>
                              {userData?.hasTelegram && (
                                <p className="text-xs text-gray-500">
                                  {userData.telegramUsername?.startsWith("@")
                                    ? userData.telegramUsername
                                    : `@${userData.telegramUsername}`}
                                </p>
                              )}
                            </div>

                            {/* User navigation */}
                            {userNavigation.map((item) => (
                              <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                <item.icon className="h-4 w-4 mr-3" />
                                {item.name}
                              </Link>
                            ))}

                            {/* Admin navigation */}
                            {userData?.isAdmin && (
                              <>
                                <div className="border-t my-1"></div>
                                {adminNavigation.map((item) => (
                                  <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setUserMenuOpen(false)}
                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <item.icon className="h-4 w-4 mr-3" />
                                    {item.name}
                                  </Link>
                                ))}
                              </>
                            )}

                            <div className="border-t my-1"></div>
                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <LogOut className="h-4 w-4 mr-3" />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors hover:text-white"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden ml-2 p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100
    max-[320px]:-ml-1"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navigation.map((item) => {
                  if (item.requireAuth && !user) return null;
                  if (!item.public && !item.requireAuth) return null;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center px-3 py-2 rounded-md text-base font-medium
                        ${
                          isActive(item.href)
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  );
                })}

                {user ? (
                  <>
                    <div className="border-t my-2"></div>
                    <Link
                      to="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <User className="h-5 w-5 mr-3" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t my-2"></div>
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main content */}
      <main className="pt-16">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* About */}
            <div>
              <Link
                to="/"
                className="text-lg font-semibold mb-4 flex items-center gap-2"
              >
                <img src="../logo.svg" alt="Square Trivia" width="160px" />
              </Link> 
              <p className="text-gray-400 text-sm">
                100% skill-based sports competition platform. Win money with
                your knowledge!
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/how-to-play"
                    className="text-gray-400 hover:text-white"
                  >
                    How to Play
                  </Link>
                </li>
                <li>
                  <Link
                    to="/free-entry"
                    className="text-gray-400 hover:text-white"
                  >
                    Free Entry (AMOE)
                  </Link>
                </li>
                <li>
                  <Link to="/games" className="text-gray-400 hover:text-white">
                    Active Games
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/legal/terms"
                    className="text-gray-400 hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/legal/privacy"
                    className="text-gray-400 hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/legal/skill-certification"
                    className="text-gray-400 hover:text-white"
                  >
                    Skill Certification
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-400">
                  <Mail className="h-4 w-4 mr-2" />
                  support@squaretrivia.com
                </li>
                <li className="flex items-center text-gray-400">
                  <Shield className="h-4 w-4 mr-2" />
                  100% Legal & Secure
                </li>
                <li className="flex items-center text-gray-400">
                  <DollarSign className="h-4 w-4 mr-2" />
                  NO FEES Guarantee
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Square Trivia. All rights reserved.</p>
            <p className="mt-2">
              Skill-based competition platform • Not gambling • No purchase
              necessary
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
