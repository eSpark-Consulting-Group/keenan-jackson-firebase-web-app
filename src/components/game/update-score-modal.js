import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const UpdateScoreModal = ({ open, onClose, onSuccess, loading = true }) => {
  const [score, setScore] = useState({
    quarter: "",
    homeScore: "",
    awayScore: "",
  });
  const isDisabled =
    score.quarter === "" || score.homeScore === "" || score.awayScore === "";
  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-5"
        >
          <button
            onClick={onClose}
            className="absolute right-2 top-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Quarter
            </label>
            <select
              value={score.quarter}
              onChange={(e) => setScore({ ...score, quarter: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option className="whitespace-nowrap" value="" disabled>
                Please select quater
              </option>
              <option className="whitespace-nowrap" value="q1">
                Q1
              </option>
              <option className="whitespace-nowrap" value="q2">
                Q2
              </option>
              <option className="whitespace-nowrap" value="q3">
                Q3
              </option>
              <option className="whitespace-nowrap" value="q4">
                Q4
              </option>
            </select>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Home Score
            </label>
            <input
              title="Enter home team score"
              type="number"
              value={score.homeScore}
              onChange={(e) =>
                setScore({
                  ...score,
                  homeScore: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Away Score
            </label>
            <input
              title="Enter away team score"
              type="number"
              value={score.awayScore}
              onChange={(e) =>
                setScore({
                  ...score,
                  awayScore: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <motion.button
            onClick={() => onSuccess(open, score)}
            disabled={isDisabled || loading}
            className={`w-full mt-5 text-left p-4 rounded-lg border-2 transition-all flex items-center justify-center ${isDisabled ? "bg-gray-300 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"}`}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-5 w-5 text-blue-500"
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
                    strokeWidth="2"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>{" "}
              </span>
            ) : (
              "Update Score"
            )}
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpdateScoreModal;
