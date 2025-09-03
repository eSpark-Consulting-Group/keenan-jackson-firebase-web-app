import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Building2,
  DollarSign,
  Mail,
  Plus,
  Check,
  Edit,
  Trash2,
  Shield,
  AlertCircle,
  X,
  ChevronRight,
  Wallet,
  Send,
  Coins,
} from "lucide-react";
import { db, callFunction } from "../../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/authcontext";

export const PAYMENT_METHODS = {
  paypal: {
    id: "paypal",
    name: "PayPal",
    icon: DollarSign,
    description: "Quick transfer to your PayPal account",
    processingTime: "1-2 hours",
    fee: "No fee",
    fields: [
      {
        name: "email",
        label: "PayPal Email",
        type: "email",
        required: true,
        autoComplete: "email",
        placeholder: "e.g. abc@example.com",
      },
    ],
  },
  venmo: {
    id: "venmo",
    name: "Venmo",
    icon: Wallet, // you can replace with another lucide icon if you prefer
    description: "Send directly to your Venmo account",
    processingTime: "Instant",
    fee: "No fee",
    fields: [
      {
        name: "username",
        label: "Venmo Username",
        type: "text",
        required: true,
        autoComplete: "username",
        placeholder: "e.g. @john-doe",
      },
    ],
  },
  zelle: {
    id: "zelle",
    name: "Zelle",
    icon: Send, // lucide icon suggestion
    description: "Instant transfer via Zelle",
    processingTime: "Instant",
    fee: "No fee",
    fields: [
      {
        name: "contact",
        label: "Zelle Email or Phone",
        type: "text",
        required: true,
        autoComplete: "email",
        placeholder: "e.g. 123-456-7890 or abc@example.com",
      },
    ],
  },
  ach: {
    id: "ach",
    name: "ACH (Bank)",
    icon: Building2,
    description: "Direct deposit to your bank account",
    processingTime: "2-3 business days",
    fee: "No fee",
    fields: [
      {
        name: "name",
        label: "Account Holder Name",
        type: "text",
        required: true,
        autoComplete: "name",
        placeholder: "e.g. John Doe",
      },
      {
        name: "bankName",
        label: "Bank Name",
        type: "text",
        required: true,
        autoComplete: "organization",
        placeholder: "e.g. Chase Bank",
      },
      {
        name: "routing",
        label: "Routing Number",
        type: "text",
        required: true,
        pattern: "[0-9]{9}",
        autoComplete: "routing",
        placeholder: "e.g. 021000021",
      },
      {
        name: "account",
        label: "Account Number",
        type: "text",
        required: true,
        autoComplete: "account",
        placeholder: "e.g. 123456789",
      },
      {
        name: "type",
        label: "Account Type",
        type: "select",
        required: true,
        autoComplete: "account-type",
        placeholder: "Select account type",
        options: ["checking", "savings"],
      },
    ],
  },
  check: {
    id: "check",
    name: "Paper Check",
    icon: Mail,
    description: "Mailed check to your address",
    processingTime: "5-7 business days",
    fee: "No fee",
    fields: [
     {
      name: "name",
      label: "Full Name",
      type: "text",
      required: true,
        autoComplete: "full-name",
      placeholder: "e.g. John Doe",
    },
    {
      name: "addressLine1",
      label: "Address Line 1",
      type: "text",
      required: true,
      autoComplete: "address-line1",
      placeholder: "Street address, P.O. box, company name",
    },
    {
      name: "addressLine2",
      label: "Address Line 2",
      type: "text",
      required: false,
      autoComplete: "address-line2",
      placeholder: "Apartment, suite, unit, building (optional)",
    },
    {
      name: "city",
      label: "City",
      type: "text",
      required: true,
      autoComplete: "address-level2",
      placeholder: "e.g. New York",
    },
    {
      name: "state",
      label: "State/Province/Region",
      type: "text",
      required: true,
      autoComplete: "address-level1",
      placeholder: "e.g. California",
    },
    {
      name: "postalCode",
      label: "ZIP / Postal Code",
      type: "text",
      required: true,
      autoComplete: "postal-code",
      placeholder: "e.g. 10001",
    },
    ],
  },
  crypto: {
    id: "crypto",
    name: "Cryptocurrency",
    icon: Coins, // lucide-react icon
    description: "Transfer directly to your crypto wallet",
    processingTime: "Varies by network",
    fee: "Network fees apply",
    fields: [
      {
        name: "wallet",
        label: "Wallet Address",
        type: "text",
        required: true,
        autoComplete: "off",
        placeholder: "e.g. 0x1234...abcd",
      },
      {
        name: "network",
        label: "Network",
        type: "text",
        required: true,
        autoComplete: "off",
        placeholder: "e.g. Ethereum, Solana",
      },
    ],
  },
};

export default function PaymentMethods({
  embedded = false,
  onMethodSelect = null,
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultMethod, setDefaultMethod] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData?.paymentMethods) {
        setPaymentMethods(userData.paymentMethods);
        setDefaultMethod(userData.defaultPaymentMethod || null);
      }
    } catch (error) {
      console.error("Error loading payment methods:", error);
      toast.error("Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const method = PAYMENT_METHODS[selectedType];

    method.fields.forEach((field) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }

      if (field.pattern && formData[field.name]) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(formData[field.name])) {
          newErrors[field.name] = `Invalid ${field.label} format`;
        }
      }

      if (field.type === "email" && formData[field.name]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.name])) {
          newErrors[field.name] = "Invalid email address";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveMethod = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const methodId = editingMethod?.id || `${selectedType}_${Date.now()}`;
      const newMethod = {
        id: methodId,
        type: selectedType,
        ...formData,
        createdAt: editingMethod?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Mask sensitive data for display
        displayInfo: getMaskedDisplay(selectedType, formData),
      };

      let updatedMethods;
      if (editingMethod) {
        updatedMethods = paymentMethods.map((m) =>
          m.id === editingMethod.id ? newMethod : m
        );
      } else {
        updatedMethods = [...paymentMethods, newMethod];
      }

      // Update in Firestore
      await updateDoc(doc(db, "users", user.uid), {
        paymentMethods: updatedMethods,
        // Set as default if it's the first method
        ...(updatedMethods.length === 1 && { defaultPaymentMethod: methodId }),
      });

      setPaymentMethods(updatedMethods);
      if (updatedMethods.length === 1) {
        setDefaultMethod(methodId);
      }

      toast.success(
        editingMethod ? "Payment method updated" : "Payment method added"
      );
      handleCloseModal();

      // If callback provided (for embedded use)
      if (onMethodSelect && !editingMethod) {
        onMethodSelect(newMethod);
      }
    } catch (error) {
      console.error("Error saving payment method:", error);
      toast.error("Failed to save payment method");
    } finally {
      setSaving(false);
    }
  };

  const getMaskedDisplay = (type, data) => {
    switch (type) {
      case "ach":
        return `****${data.accountNumber?.slice(-4) || ""}`;
      case "paypal":
        return data.email;
      case "check":
        return `${data.city}, ${data.state}`;
      default:
        return "";
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      await updateDoc(doc(db, "users", user.uid), {
        defaultPaymentMethod: methodId,
      });
      setDefaultMethod(methodId);
      toast.success("Default payment method updated");
    } catch (error) {
      console.error("Error setting default method:", error);
      toast.error("Failed to update default method");
    }
  };

  const handleDeleteMethod = async (methodId) => {
    if (!window.confirm("Are you sure you want to delete this payment method?"))
      return;

    try {
      const updatedMethods = paymentMethods.filter((m) => m.id !== methodId);
      const updates = { paymentMethods: updatedMethods };

      // Update default if needed
      if (defaultMethod === methodId) {
        updates.defaultPaymentMethod = updatedMethods[0]?.id || null;
        setDefaultMethod(updates.defaultPaymentMethod);
      }

      await updateDoc(doc(db, "users", user.uid), updates);
      setPaymentMethods(updatedMethods);
      toast.success("Payment method deleted");
    } catch (error) {
      console.error("Error deleting method:", error);
      toast.error("Failed to delete payment method");
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingMethod(null);
    setFormData({});
    setErrors({});
  };

  const handleEditMethod = (method) => {
    setEditingMethod(method);
    setSelectedType(method.type);
    const { id, type, displayInfo, createdAt, updatedAt, ...methodData } =
      method;
    setFormData(methodData);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={embedded ? "" : "bg-white rounded-lg shadow-lg p-6"}>
      {!embedded && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Payment Methods
          </h2>
          <p className="text-gray-600">Manage how you receive your winnings</p>
        </div>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length > 0 ? (
        <div className="space-y-4">
          {paymentMethods.map((method) => {
            const methodConfig = PAYMENT_METHODS[method.type];
            const Icon = methodConfig?.icon || CreditCard;
            const isDefault = method.id === defaultMethod;

            return (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 ${
                  isDefault ? "border-blue-500 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isDefault ? "bg-blue-100" : "bg-gray-100"
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          isDefault ? "text-blue-600" : "text-gray-600"
                        }`}
                      />
                    </div>

                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-gray-900">
                          {methodConfig?.name || "Payment Method"}
                        </h3>
                        {isDefault && (
                          <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Processing: {methodConfig?.processingTime} •{" "}
                        {methodConfig?.fee}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => handleEditMethod(method)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMethod(method.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No payment methods added yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Add a payment method to receive your winnings
          </p>
        </div>
      )}

      {/* Add Payment Method Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="mt-6 w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-5 w-5 mr-2" />
        Add Payment Method
      </button>

      {/* Security Notice */}
      {!embedded && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-1">
                Your payment information is secure
              </p>
              <p>
                We use bank-level encryption to protect your data. Payment
                details are only used for sending your winnings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Payment Method Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingMethod ? "Edit Payment Method" : "Add Payment Method"}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Payment Type Selection */}
                {!editingMethod && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Type
                    </label>
                    <div className="space-y-2">
                      {Object.values(PAYMENT_METHODS).map((method) => {
                        const Icon = method.icon;
                        return (
                          <label
                            key={method.id}
                            className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedType === method.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentType"
                              autoComplete="payment-method"
                              placeholder="Select payment method"
                              value={method.id}
                              checked={selectedType === method.id}
                              onChange={(e) => {
                                setSelectedType(e.target.value);
                                setFormData({});
                                setErrors({});
                              }}
                              className="sr-only"
                            />
                            <Icon
                              className={`h-5 w-5 mr-3 flex-shrink-0 ${
                                selectedType === method.id
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {method.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {method.description}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {method.processingTime} • {method.fee}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {PAYMENT_METHODS[selectedType].fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>

                      {field.type === "select" ? (
                        <select
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.name]: e.target.value,
                            })
                          }
                          autoComplete={field.autoComplete || "off"}
                          placeholder={field.placeholder || ""}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[field.name]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((option) => (
                            <option key={option} value={option}>
                              {option?.charAt(0)?.toUpperCase() + option?.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [field.name]: e.target.value,
                            })
                          }
                          autoComplete={field.autoComplete || 'off'}
                          placeholder={field.placeholder || ""}
                          pattern={field.pattern || undefined}
                          maxLength={field.maxLength}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[field.name]
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        />
                      )}

                      {errors[field.name] && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors[field.name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Security Notice */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                    <p className="text-sm text-blue-800">
                      Your payment information is encrypted and secure. We'll
                      only use this to send your winnings.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMethod}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {editingMethod ? "Update" : "Add"} Method
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
