import React from 'react';
import {
  CreditCard,
  Building2,
  DollarSign,
  Mail,
  Shield,
  Clock
} from 'lucide-react';

// Reusable component to display payment method info consistently
export default function PaymentMethodDisplay({ 
  method, 
  showProcessingTime = false,
  showFee = false,
  size = 'normal', // 'small', 'normal', 'large'
  showBadge = false,
  isDefault = false 
}) {
  if (!method) return null;

  const getIcon = () => {
    switch (method.type) {
      case 'ach':
        return Building2;
      case 'paypal':
        return DollarSign;
      case 'check':
        return Mail;
      default:
        return CreditCard;
    }
  };

  const getMethodName = () => {
    switch (method.type) {
      case 'ach':
        return 'Bank Transfer';
      case 'paypal':
        return 'PayPal';
      case 'check':
        return 'Paper Check';
      default:
        return 'Payment Method';
    }
  };

  const getProcessingTime = () => {
    switch (method.type) {
      case 'ach':
        return '2-3 business days';
      case 'paypal':
        return '1-2 hours';
      case 'check':
        return '5-7 business days';
      default:
        return 'Varies';
    }
  };

  const Icon = getIcon();
  
  const sizeClasses = {
    small: {
      container: 'text-sm',
      icon: 'h-4 w-4',
      badge: 'text-xs px-2 py-0.5'
    },
    normal: {
      container: 'text-base',
      icon: 'h-5 w-5',
      badge: 'text-xs px-2 py-1'
    },
    large: {
      container: 'text-lg',
      icon: 'h-6 w-6',
      badge: 'text-sm px-3 py-1'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.container}`}>
      <Icon className={`${classes.icon} text-gray-500 mr-2`} />
      <div className="flex-1">
        <div className="flex items-center">
          <span className="font-medium text-gray-900">
            {getMethodName()}
          </span>
          {method.displayInfo && (
            <span className="text-gray-500 ml-2">
              ({method.displayInfo})
            </span>
          )}
          {showBadge && isDefault && (
            <span className={`ml-2 bg-blue-600 text-white rounded-full ${classes.badge}`}>
              Default
            </span>
          )}
        </div>
        
        {(showProcessingTime || showFee) && (
          <div className="flex items-center mt-1 text-gray-500 text-sm">
            {showProcessingTime && (
              <div className="flex items-center mr-4">
                <Clock className="h-3 w-3 mr-1" />
                {getProcessingTime()}
              </div>
            )}
            {showFee && (
              <div className="flex items-center">
                <Shield className="h-3 w-3 mr-1" />
                No fee
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for inline display
export function PaymentMethodBadge({ method, className = '' }) {
  if (!method) return null;

  const getIcon = () => {
    switch (method.type) {
      case 'ach':
        return Building2;
      case 'paypal':
        return DollarSign;
      case 'check':
        return Mail;
      default:
        return CreditCard;
    }
  };

  const getShortName = () => {
    switch (method.type) {
      case 'ach':
        return 'Bank';
      case 'paypal':
        return 'PayPal';
      case 'check':
        return 'Check';
      default:
        return 'Card';
    }
  };

  const Icon = getIcon();

  return (
    <span className={`inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {getShortName()}
    </span>
  );
}

// List all payment methods with icons
export function PaymentMethodsList({ methods, defaultMethodId, onSelect, selectedId }) {
  if (!methods || methods.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No payment methods added
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {methods.map((method) => (
        <label
          key={method.id}
          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
            selectedId === method.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          {onSelect && (
            <input
              title="Select payment method"
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedId === method.id}
              onChange={() => onSelect(method.id)}
              className="sr-only"
            />
          )}
          <PaymentMethodDisplay
            method={method}
            showBadge={true}
            isDefault={method.id === defaultMethodId}
            size="normal"
          />
        </label>
      ))}
    </div>
  );
}