import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, X } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/config";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/authcontext";
import { data } from "autoprefixer";

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
  const [isLoading, setIsLoading] = useState(false);
  const { refreshUserData, userData } = useAuth();
  const [dropdownOptions, setDropDownOptions] = useState([
    { label: "PayPal", value: "paypal" },
    { label: "Venmo", value: "venmo" },
    { label: "Zelle", value: "zelle" },
    { label: "ACH (Bank)", value: "ach" },
    { label: "Check", value: "check" },
    { label: "Crypto", value: "crypto" },
  ]);

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
    setIsLoading(true);

    try {
      const payload = { method, ...formData };
      const res = await savePayout(payload);

      toast.success("Payout saved");
      setIsLoading(false);
      refreshUserData();
      onClose();
    } catch (error) {
      console.error("❌ Error saving payout:", error);
      setIsLoading(false);
      toast.error("Failed to save payout. Please try again.");
    }
  };

  useEffect(() => {
    const currentChoice = userData?.payoutDetails?.method;
    if (currentChoice) {
      const data = dropdownOptions?.filter(
        (item) => item?.value !== currentChoice
      );
      setDropDownOptions(data);
    }
  }, [userData]);

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
                  {dropdownOptions?.map((item) => (
                    <option value={item?.value}>{item?.label}</option>
                  ))}
                </select>
              </div>

              {method &&
                payoutFields[method].map((field) => (
                  <div key={field?.name}>
                    <label className="block text-gray-700 font-medium mb-1">
                      {field?.label}
                    </label>
                    <input
                      type={field?.type}
                      name={field?.name}
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
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center"
                >
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      ></path>
                    </svg>
                  ) : (
                    "Save Payout Method"
                  )}
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
