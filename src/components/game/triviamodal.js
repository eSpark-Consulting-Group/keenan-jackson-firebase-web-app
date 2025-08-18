import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Brain,
  Timer,
  CheckCircle,
  XCircle,
  Zap,
  Trophy,
} from "lucide-react";
import { callFunction } from "../../firebase/config";
import toast from "react-hot-toast";
import Confetti from "react-confetti";

const TRIVIA_TIME_LIMIT = 30; // seconds

export default function TriviaModal({
  isOpen,
  onClose,
  onComplete,
  boardId,
  tierId,
  sport,
  squarePosition,
}) {
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(TRIVIA_TIME_LIMIT);
  const [sessionId, setSessionId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startTriviaSession();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen]);

  const startTriviaSession = async () => {
    try {
      setLoading(true);
      setSubmitted(false);
      setResult(null);
      setSelectedAnswer(null);

      // Call cloud function to start trivia session
      const response = await callFunction("getTriviaQuestion", {
        tier: tierId,
        boardId, // Default to NFL if not specified
      });

      if (response.success) {
        setQuestion(response.question);
        setSessionId(response.sessionId);
        setStartTime(Date.now());
        setTimeRemaining(TRIVIA_TIME_LIMIT);

        // Start countdown timer
        intervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              handleTimeout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(response.error || "Failed to load trivia question");
        onClose();
      }
    } catch (error) {
      console.error("Error starting trivia session:", error);
      toast.error("Failed to load trivia question");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleTimeout = () => {
    if (!submitted) {
      submitAnswer(null); // Submit with no answer
    }
  };

  const submitAnswer = async (answerIndex) => {
    if (submitted) return;

    setSubmitted(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const endTime = Date.now();
    const answerTime = ((endTime - startTime) / 1000).toFixed(1);

    try {
      // Call cloud function to submit answer
      const response = await callFunction("submitTriviaAnswer", {
        sessionId,
        answerIndex: answerIndex ?? -1, // -1 for timeout/no answer
        answerTime: parseFloat(answerTime),
      });

      if (response.success) {
        setResult({
          correct: response.correct,
          correctAnswer: response.correctAnswer,
          answerTime: response.answerTime,
          token: response.token,
        });

        if (response.correct) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 3000);
        }

        // Wait a bit to show result, then complete
        setTimeout(
          () => {
            onComplete(response.correct, response.answerTime, response.token);
          },
          response.correct ? 3000 : 2000
        );
      } else {
        toast.error(response.error || "Failed to submit answer");
        onClose();
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer");
      onClose();
    }
  };

  const handleAnswerSelect = (index) => {
    if (submitted || loading) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || submitted) return;
    submitAnswer(selectedAnswer);
  };

  const getTimeColor = () => {
    if (timeRemaining > 20) return "text-green-600";
    if (timeRemaining > 10) return "text-yellow-600";
    if (timeRemaining > 5) return "text-orange-600";
    return "text-red-600 animate-pulse";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={submitted ? undefined : onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Celebration confetti */}
          {showCelebration && (
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />
          )}

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Brain className="h-8 w-8 mr-3" />
                <div>
                  <h2 className="text-2xl font-bold">Trivia Challenge</h2>
                  <p className="text-blue-100">Square #{squarePosition}</p>
                </div>
              </div>
              {!submitted && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading question...</p>
              </div>
            ) : (
              <>
                {/* Timer */}
                {!submitted && (
                  <div className="mb-6 text-center">
                    <div className={`text-4xl font-bold ${getTimeColor()}`}>
                      <Timer className="inline h-8 w-8 mr-2" />
                      {timeRemaining}s
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Time remaining</p>
                  </div>
                )}

                {/* Question */}
                <div className="mb-8">
                  <div className="flex items-start mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full mr-3">
                      {question?.category || "General"}
                    </span>
                    <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                      {question?.difficulty || "Medium"}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mt-4">
                    {question?.question}
                  </h3>
                </div>

                {/* Answers */}
                <div className="space-y-3 mb-6">
                  {question?.answers?.map((answer, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect = result && index === result.correctAnswer;
                    const isWrong = result && isSelected && !isCorrect;

                    return (
                      <motion.button
                        key={index}
                        whileHover={!submitted ? { scale: 1.02 } : {}}
                        whileTap={!submitted ? { scale: 0.98 } : {}}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={submitted}
                        className={`
                          w-full text-left p-4 rounded-lg border-2 transition-all
                          ${
                            !submitted && isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }
                          ${isCorrect ? "border-green-500 bg-green-50" : ""}
                          ${isWrong ? "border-red-500 bg-red-50" : ""}
                          ${
                            submitted && !isCorrect && !isWrong
                              ? "opacity-50"
                              : ""
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {String.fromCharCode(65 + index)}. {answer}
                          </span>
                          {result && (
                            <>
                              {isCorrect && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {isWrong && (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                            </>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Result message */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      p-4 rounded-lg mb-6 text-center
                      ${
                        result.correct
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    `}
                  >
                    {result.correct ? (
                      <>
                        <Trophy className="h-12 w-12 mx-auto mb-2 text-green-600" />
                        <p className="text-lg font-bold mb-1">Correct!</p>
                        <p className="text-2xl font-bold">
                          Answer Time: {result.answerTime}s
                        </p>
                        <p className="text-sm mt-2">
                          You can now claim square #{squarePosition}
                        </p>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-12 w-12 mx-auto mb-2 text-red-600" />
                        <p className="text-lg font-bold mb-1">Incorrect</p>
                        <p className="text-sm">
                          The correct answer was:{" "}
                          {question?.answers[result.correctAnswer]}
                        </p>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Submit button */}
                {!submitted && (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className={`
                      w-full py-3 px-4 rounded-lg font-medium transition-all
                      ${
                        selectedAnswer !== null
                          ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    Submit Answer
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer tip */}
          {!submitted && !loading && (
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center text-sm text-gray-600">
                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                <span>
                  Quick tip: Answer speed determines winners when squares match
                  scores!
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
