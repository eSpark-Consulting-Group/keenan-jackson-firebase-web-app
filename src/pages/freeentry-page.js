import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  CreditCard,
  Gift,
  ChevronRight,
  Copy,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FreeEntry() {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const mailingAddress = `Square Trivia AMOE
PO Box 12345
Dallas, TX 75201`;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(mailingAddress);
    setCopiedAddress(true);
    toast.success('Address copied to clipboard!');
    setTimeout(() => setCopiedAddress(false), 3000);
  };

  const requirements = [
    {
      icon: FileText,
      title: "Handwritten Letter",
      description: "Write your name, email, phone number, and desired board on a 3x5 index card"
    },
    {
      icon: Mail,
      title: "Self-Addressed Stamped Envelope",
      description: "Include a #10 SASE with first-class postage for your entry confirmation"
    },
    {
      icon: Clock,
      title: "Processing Time",
      description: "Allow 5-7 business days for processing and email confirmation"
    }
  ];

  const steps = [
    "Get a 3x5 index card and a #10 envelope",
    "Write your full name, email address, and phone number on the card",
    "Write your desired board (e.g., \"$25 Board\") on the card",
    "Put the index card in an envelope",
    "Include a self-addressed stamped envelope (SASE)",
    "Mail to the address below"
  ];

  const faqs = [
    {
      question: "Why do you offer free entry?",
      answer: "As a skill-based competition, we're required to offer a free alternative method of entry (AMOE) to ensure no purchase is necessary to play or win."
    },
    {
      question: "How many free entries can I request?",
      answer: "One free entry per envelope. You may send multiple envelopes, but each must be mailed separately and contain all required materials."
    },
    {
      question: "What board access do I get?",
      answer: "You'll receive access to the board you specify on your index card, with the same features and prize opportunities as paid players."
    },
    {
      question: "How long is my free entry valid?",
      answer: "Free entries are valid for 30 days from the date of email confirmation."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <Gift className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Free Entry Option (AMOE)
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            No purchase necessary to play or win. Request your free entry by mail.
          </p>
        </motion.div>

        {/* Notice Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8"
        >
          <div className="flex items-start">
            <Info className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Equal Opportunity to Win
              </h3>
              <p className="text-gray-700">
                Free entry participants have the exact same features, square selection opportunities, 
                and prize eligibility as those who donate. The only difference is the entry method.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Requirements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What You'll Need
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {requirements.map((req, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                  <req.icon className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{req.title}</h3>
                <p className="text-gray-600 text-sm">{req.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step by Step */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Send className="h-6 w-6 mr-2 text-blue-600" />
            How to Request Free Entry
          </h2>
          
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                  {index + 1}
                </span>
                <span className="text-gray-700 pt-1">{step}</span>
              </li>
            ))}
          </ol>

          {/* Mailing Address */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Mailing Address:</h3>
            <div className="flex items-start justify-between">
              <pre className="text-gray-700 font-mono text-sm">{mailingAddress}</pre>
              <button
                onClick={handleCopyAddress}
                className="ml-4 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Copy address"
              >
                {copiedAddress ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8"
        >
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            Important Notes
          </h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Entries missing any required materials will not be processed</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Photocopied or mechanically reproduced entries are not accepted</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>We are not responsible for lost, late, or misdirected mail</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>You'll receive email confirmation once your entry is processed</span>
            </li>
          </ul>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-700">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center text-white"
        >
          <h2 className="text-2xl font-bold mb-4">
            Prefer Instant Access?
          </h2>
          <p className="text-lg mb-6 text-blue-100">
            Skip the wait and start playing immediately with a donation
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3 text-lg font-medium text-blue-600 bg-white rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Donate & Play Now
            </Link>
            
            <Link
              to="/how-to-play"
              className="inline-flex items-center px-8 py-3 text-lg font-medium text-white bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-200"
            >
              Learn How to Play
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}