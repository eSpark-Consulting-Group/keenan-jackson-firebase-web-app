import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, X } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";
import toast from "react-hot-toast";

const payoutFields = {
  paypal: [{ name: "email", label: "PayPal Email", type: "email" }],
  venmo: [{ name: "username", label: "Venmo Username", type: "text" }],
  zelle: [{ name: "contact", label: "Zelle Email or Phone", type: "text" }],
  ach: [
    { name: "name", label: "Account Holder Name", type: "text" },
    { name: "bankName", label: "Bank Name", type: "text" },
    { name: "routing", label: "Routing Number", type: "text" },
    { name: "account", label: "Account Number", type: "text" },
    { name: "type", label: "Account Type", type: "text" },
  ],
  check: [
    { name: "name", label: "Full Name", type: "text" },
    { name: "address", label: "Mailing Address", type: "text" },
  ],
  crypto: [
    { name: "wallet", label: "Wallet Address", type: "text" },
    {
      name: "network",
      label: "Network (e.g., Ethereum, Solana)",
      type: "text",
    },
  ],
};

const PayoutModal = ({ isOpen, onClose }) => {
  const [method, setMethod] = useState("");
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setMethod("");
      setFormData({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const savePayout = httpsCallable(functions, "savePayoutDetails");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = { method, ...formData };
      const res = await savePayout(payload);

      toast.success("✅ Payout saved");
      onClose();
    } catch (error) {
      console.error("❌ Error saving payout:", error);
      toast.error("Failed to save payout. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white rounded-t-xl flex justify-between items-center">
              <div className="flex items-center">
                <Brain className="h-8 w-8 mr-3" />
                <h2 className="text-2xl font-bold">Connect Payout</h2>
              </div>
              <button onClick={onClose}>
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">
                  Select Method
                </label>
                <select
                  className="w-full border rounded-lg p-2"
                  value={method}
                  onChange={(e) => {
                    setMethod(e.target.value);
                    setFormData({});
                  }}
                  required
                >
                  <option value="">-- Choose --</option>
                  <option value="paypal">PayPal</option>
                  <option value="venmo">Venmo</option>
                  <option value="zelle">Zelle</option>
                  <option value="ach">ACH (Bank)</option>
                  <option value="check">Check</option>
                  <option value="crypto">Crypto</option>
                </select>
              </div>

              {method &&
                payoutFields[method].map((field) => (
                  <div key={field.name}>
                    <label className="block text-gray-700 font-medium mb-1">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name] || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-2"
                      required
                    />
                  </div>
                ))}

              {method && (
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Save Payout Method
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PayoutModal;
