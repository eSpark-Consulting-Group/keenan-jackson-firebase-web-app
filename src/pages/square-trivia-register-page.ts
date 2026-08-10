import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  AtSign,
  Gift,
  CheckCircle,
  AlertCircle,
  Brain 
} from 'lucide-react';
import { useAuth } from '../contexts/authcontext';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, user } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    telegramUsername: '',
    phone: '',
    referralCode: searchParams.get('ref') || '',
    acceptTerms: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Telegram username (optional but validate format if provided)
    if (formData.telegramUsername && !formData.telegramUsername.match(/^@?[a-zA-Z0-9_]{5,32}$/)) {
      newErrors.telegramUsername = 'Invalid Telegram username format';
    }

    // Phone (optional but validate format if provided)
    if (formData.phone && !formData.phone.match(/^\+?[1-9]\d{1,14}$/)) {
      newErrors.phone = 'Invalid phone number format';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms to continue';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        telegramUsername: formData.telegramUsername || null,
        phone: formData.phone || null,
        referredBy: formData.referralCode || null
      };

      // Register user
      await register(
        registrationData.email,
        registrationData.password,
        {
          telegramUsername: registrationData.telegramUsername,
          phone: registrationData.phone,
          referredBy: registrationData.referredBy
        }
      );
      
      // Success - navigate to dashboard
      toast.success('Account created successfully!');
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({ general: err.message || 'Failed to create account. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Play in 6 different prize tiers',
    'Win guaranteed prizes with NO FEES',
    'Compete based on skill, not luck',
    'Get consolation prizes when you lose',
    'Join our active player community'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-blue-600" />
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white shadow-xl rounded-lg p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error Message */}
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-red-50 border border-red-200 rounded-md p-4"
                >
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-800">{errors.general}</p>
                  </div>
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`
                      appearance-none block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.email ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="you@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`
                      appearance-none block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.password ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm password *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`
                      appearance-none block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Telegram Username (Optional) */}
              <div>
                <label htmlFor="telegramUsername" className="block text-sm font-medium text-gray-700">
                  Telegram username (optional)
                  <span className="text-xs text-gray-500 ml-2">Get 2x daily plays!</span>
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AtSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="telegramUsername"
                    name="telegramUsername"
                    type="text"
                    value={formData.telegramUsername}
                    onChange={handleChange}
                    className={`
                      appearance-none block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.telegramUsername ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="username"
                  />
                </div>
                {errors.telegramUsername && (
                  <p className="mt-1 text-sm text-red-600">{errors.telegramUsername}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone number (optional)
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`
                      appearance-none block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500
                      ${errors.phone ? 'border-red-300' : 'border-gray-300'}
                    `}
                    placeholder="+1234567890"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Referral Code (Optional) */}
              <div>
                <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700">
                  Referral code (optional)
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Gift className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="referralCode"
                    name="referralCode"
                    type="text"
                    value={formData.referralCode}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ABC123"
                  />
                </div>
              </div>

              {/* Terms Checkbox */}
              <div>
                <div className="flex items-start">
                  <input
                    id="acceptTerms"
                    name="acceptTerms"
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                    I agree to the{' '}
                    <Link to="/legal/terms" target="_blank" className="text-blue-600 hover:text-blue-500">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/legal/privacy" target="_blank" className="text-blue-600 hover:text-blue-500">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="mt-1 text-sm text-red-600">{errors.acceptTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`
                  w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }
                  transition-colors duration-200
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </>
                ) : (
                  'Create free account'
                )}
              </button>
            </form>
          </motion.div>

          {/* Benefits Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-blue-50 rounded-lg p-8"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Join Square Trivia today and:
            </h3>
            
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  className="flex items-start"
                >
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-6 bg-white rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                💡 Pro tip: Add Telegram
              </h4>
              <p className="text-sm text-gray-600">
                Players with Telegram get 10 daily trivia attempts instead of 5, 
                plus instant notifications when they win!
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                No purchase necessary •{' '}
                <Link to="/free-entry" className="text-blue-600 hover:text-blue-500">
                  Free entry available
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}