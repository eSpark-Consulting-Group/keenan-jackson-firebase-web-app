import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Building2,
  DollarSign,
  Mail,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentMethodSetup({ 
  onComplete, 
  showInModal = false,
  message = "You need to add a payment method to receive your winnings" 
}) {
  const [selectedType, setSelectedType] = useState(null);

  const paymentTypes = [
    {
      id: 'ach',
      name: 'Bank Transfer (ACH)',
      icon: Building2,
      description: 'Direct deposit to your bank account',
      processingTime: '2-3 business days',
      recommended: true,
      benefits: [
        'Most secure option',
        'No transaction limits',
        'Automatic deposits'
      ]
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: DollarSign,
      description: 'Quick transfer to your PayPal account',
      processingTime: '1-2 hours',
      recommended: false,
      benefits: [
        'Fastest option',
        'Easy setup',
        'International support'
      ]
    },
    {
      id: 'check',
      name: 'Paper Check',
      icon: Mail,
      description: 'Traditional check mailed to your address',
      processingTime: '5-7 business days',
      recommended: false,
      benefits: [
        'No bank account needed',
        'Physical payment',
        'Traditional method'
      ]
    }
  ];

  const handleContinue = () => {
    if (selectedType && onComplete) {
      onComplete(selectedType);
    }
  };

  return (
    <div className={showInModal ? '' : 'max-w-3xl mx-auto'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={showInModal ? '' : 'bg-white rounded-lg shadow-lg p-8'}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Set Up Your Payout Method
          </h2>
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Why do I need this?</p>
              <p>
                When you win, we need a way to send you your prize money. All methods are 
                secure and have no fees for standard payouts.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Type Selection */}
        <div className="space-y-4 mb-8">
          {paymentTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <motion.div
                key={type.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <label
                  className={`block relative border-2 rounded-lg p-6 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                  title="Select payment method"
                    type="radio"
                    name="paymentType"
                    value={type.id}
                    checked={isSelected}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="sr-only"
                  />
                  
                  {type.recommended && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                        Recommended
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {type.name}
                      </h3>
                      <p className="text-gray-600 mb-2">
                        {type.description}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        Processing time: {type.processingTime}
                      </p>
                      
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-1"
                        >
                          {type.benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-700">
                              <Check className="h-4 w-4 text-green-500 mr-2" />
                              {benefit}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </label>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {!showInModal && (
            <Link
              to="/dashboard"
              className="flex-1 px-6 py-3 text-center text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Skip for Now
            </Link>
          )}
          
          <button
            onClick={handleContinue}
            disabled={!selectedType}
            className={`flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium transition-all flex items-center justify-center ${
              selectedType
                ? 'hover:bg-blue-700 transform hover:scale-105'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Continue Setup
            <ChevronRight className="ml-2 h-5 w-5" />
          </button>
        </div>

        {/* Trust Badge */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Your payment information is encrypted and secure</p>
        </div>
      </motion.div>
    </div>
  );
}

// Inline prompt component for empty states
export function PaymentMethodPrompt({ className = '' }) {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <CreditCard className="h-5 w-5 text-amber-600 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-gray-900 mb-1">
            Add a Payment Method
          </h4>
          <p className="text-sm text-gray-700 mb-3">
            You'll need to add a payment method before you can receive any winnings.
          </p>
          <Link
            to="/profile#payment-methods"
            className="inline-flex items-center text-sm font-medium text-amber-700 hover:text-amber-800"
          >
            Set up now
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}