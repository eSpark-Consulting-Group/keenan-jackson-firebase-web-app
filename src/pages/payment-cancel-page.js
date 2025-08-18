import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  XCircle,
  ArrowLeft,
  CreditCard,
  HelpCircle,
  Mail,
  ChevronRight,
  AlertCircle,
  Shield,
} from "lucide-react";

export default function PaymentCancel() {
  const reasons = [
    {
      icon: CreditCard,
      title: "Changed Your Mind?",
      description: "No worries! You can always come back when you're ready.",
      action: "Browse Tiers",
      link: "/games",
    },
    {
      icon: HelpCircle,
      title: "Have Questions?",
      description: "Our support team is here to help with any concerns.",
      action: "Contact Support",
      link: "mailto:support@squaretrivia.com",
    },
    {
      icon: Mail,
      title: "Try Free Entry",
      description: "No purchase necessary - request free entry by mail.",
      action: "Learn More",
      link: "/free-entry",
    },
  ];

  const benefits = [
    "100% skill-based - no luck involved",
    "NO FEES on playing or winning",
    "Guaranteed prize amounts every game",
    "Instant payout option available",
    "Fair competition with hidden answer times",
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Cancelled
          </h1>

          <p className="text-xl text-gray-600">
            Your payment was not processed and no charges were made.
          </p>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {reasons.map((reason, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="bg-white rounded-lg shadow-md p-6 text-center"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <reason.icon className="h-6 w-6 text-gray-600" />
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {reason.title}
              </h3>

              <p className="text-gray-600 mb-4 text-sm">{reason.description}</p>

              {reason.link.startsWith("mailto:") ? (
                <a
                  href={reason.link}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  {reason.action}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </a>
              ) : (
                <Link
                  to={reason.link}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                >
                  {reason.action}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Why Join */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 rounded-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Players Love Square Trivia
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex items-center"
              >
                <Shield className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center"
        >
          <blockquote className="text-lg text-gray-700 italic mb-4">
            "I was skeptical at first, but Square Trivia is amazing! Won $900 in
            my second week just by knowing sports and answering fast. The NO
            FEES promise is real!"
          </blockquote>
          <cite className="text-gray-600 not-italic">
            - Michael T., $100 Tier Player
          </cite>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-100 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-gray-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Your Information is Safe
              </h3>
              <p className="text-gray-700">
                No payment information was stored during this process. All
                transactions are processed securely through Stripe when you're
                ready to join.
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Give It Another Try?
          </h2>

          <p className="text-gray-600 mb-8">
            Join thousands of players winning real money with their sports
            knowledge
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/games"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 hover:text-white"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Try Again
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Dashboard
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Questions? Email us at{" "}
            <a
              href="mailto:support@squaretrivia.com"
              className="text-blue-600 hover:text-blue-800"
            >
              support@squaretrivia.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
