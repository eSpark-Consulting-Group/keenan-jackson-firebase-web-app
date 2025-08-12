import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  AlertCircle,
  Target,
  BarChart,
  Clock,
  Award,
} from "lucide-react";
import { db, collections } from "../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function AdminTrivia() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([
    "Rules & Regulations",
    "Team History",
    "Player Statistics",
    "Records & Achievements",
    "Current Season",
    "Classic Games",
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOptions, setFilterOptions] = useState({
    sport: "all",
    category: "all",
    difficulty: "all",
    status: "active",
  });
  const [stats, setStats] = useState({
    totalQuestions: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
    bySport: { NFL: 0, NBA: 0, NCAA_FOOTBALL: 0, NCAA_BASKETBALL: 0 },
    avgAnswerTime: 0,
    correctRate: 0,
  });

  // Form state
  const [questionForm, setQuestionForm] = useState({
    question: "",
    correctAnswer: "",
    wrongAnswers: ["", "", ""],
    sport: "NFL",
    category: "",
    difficulty: "medium",
    timeLimit: 30,
    points: 100,
    explanation: "",
  });

  useEffect(() => {
    loadQuestions();
  }, [filterOptions]);

  const loadQuestions = async () => {
    try {
      setLoading(true);

      let constraints = [orderBy("createdAt", "desc"), limit(100)];

      if (filterOptions.sport !== "all") {
        constraints.unshift(where("sport", "==", filterOptions.sport));
      }

      if (filterOptions.category !== "all") {
        constraints.unshift(where("category", "==", filterOptions.category));
      }

      if (filterOptions.difficulty !== "all") {
        constraints.unshift(
          where("difficulty", "==", filterOptions.difficulty)
        );
      }

      if (filterOptions.status === "active") {
        constraints.unshift(where("isActive", "==", true));
      } else if (filterOptions.status === "inactive") {
        constraints.unshift(where("isActive", "==", false));
      }

      const q = query(collection(db, collections.trivia), ...constraints);
      const snapshot = await getDocs(q);

      const questionsData = [];
      const statsTemp = {
        totalQuestions: 0,
        byDifficulty: { easy: 0, medium: 0, hard: 0, expert: 0 },
        bySport: { NFL: 0, NBA: 0, NCAA_FOOTBALL: 0, NCAA_BASKETBALL: 0 },
        totalAnswered: 0,
        totalCorrect: 0,
        totalTime: 0,
      };

      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        questionsData.push(data);

        // Update stats
        statsTemp.totalQuestions++;
        if (
          data.difficulty &&
          statsTemp.byDifficulty[data.difficulty] !== undefined
        ) {
          statsTemp.byDifficulty[data.difficulty]++;
        }
        if (data.sport && statsTemp.bySport[data.sport] !== undefined) {
          statsTemp.bySport[data.sport]++;
        }

        // Mock usage stats (in real app, would query from attempts)
        data.timesAnswered = Math.floor(Math.random() * 100);
        data.correctRate = Math.random() * 0.3 + 0.5; // 50-80%
        data.avgAnswerTime = Math.random() * 10 + 5; // 5-15 seconds
      });

      setQuestions(questionsData);
      setStats({
        ...statsTemp,
        avgAnswerTime: 8.5,
        correctRate: 0.65,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
      setLoading(false);
    }
  };

  const saveQuestion = async (e) => {
    e.preventDefault();

    // Validate form
    if (questionForm.wrongAnswers.some((a) => !a.trim())) {
      toast.error("Please fill in all wrong answers");
      return;
    }

    try {
      setLoading(true);

      const questionData = {
        question: questionForm.question.trim(),
        answers: [
          { text: questionForm.correctAnswer.trim(), isCorrect: true },
          ...questionForm.wrongAnswers.map((a) => ({
            text: a.trim(),
            isCorrect: false,
          })),
        ].sort(() => Math.random() - 0.5), // Shuffle answers
        sport: questionForm.sport,
        category: questionForm.category,
        difficulty: questionForm.difficulty,
        timeLimit: questionForm.timeLimit,
        points: questionForm.points,
        explanation: questionForm.explanation.trim(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingQuestion) {
        await updateDoc(doc(db, collections.trivia, editingQuestion.id), {
          ...questionData,
          createdAt: editingQuestion.createdAt, // Preserve original creation date
        });
        toast.success("Question updated successfully");
      } else {
        await addDoc(collection(db, collections.trivia), questionData);
        toast.success("Question added successfully");
      }

      setShowAddModal(false);
      setEditingQuestion(null);
      resetForm();
      loadQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question");
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, collections.trivia, questionId));
      toast.success("Question deleted successfully");
      loadQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const toggleQuestionStatus = async (questionId, currentStatus) => {
    try {
      await updateDoc(doc(db, collections.trivia, questionId), {
        isActive: !currentStatus,
        updatedAt: new Date(),
      });
      toast.success(`Question ${!currentStatus ? "activated" : "deactivated"}`);
      loadQuestions();
    } catch (error) {
      console.error("Error toggling question status:", error);
      toast.error("Failed to update question status");
    }
  };

  const resetForm = () => {
    setQuestionForm({
      question: "",
      correctAnswer: "",
      wrongAnswers: ["", "", ""],
      sport: "NFL",
      category: "",
      difficulty: "medium",
      timeLimit: 30,
      points: 100,
      explanation: "",
    });
  };

  const editQuestion = (question) => {
    const correctAnswer = question.answers.find((a) => a.isCorrect);
    const wrongAnswers = question.answers
      .filter((a) => !a.isCorrect)
      .map((a) => a.text);

    setQuestionForm({
      question: question.question,
      correctAnswer: correctAnswer?.text || "",
      wrongAnswers: [...wrongAnswers, "", "", ""].slice(0, 3),
      sport: question.sport,
      category: question.category,
      difficulty: question.difficulty,
      timeLimit: question.timeLimit || 30,
      points: question.points || 100,
      explanation: question.explanation || "",
    });
    setEditingQuestion(question);
    setShowAddModal(true);
  };

  const importQuestions = () => {
    // In real implementation, would handle file upload
    toast("This is an info message", {
      icon: "ℹ️",
    });
  };

  const exportQuestions = () => {
    const csv = [
      [
        "Question",
        "Correct Answer",
        "Wrong Answer 1",
        "Wrong Answer 2",
        "Wrong Answer 3",
        "Sport",
        "Category",
        "Difficulty",
        "Time Limit",
        "Points",
      ],
      ...questions.map((q) => {
        const correct = q.answers.find((a) => a.isCorrect);
        const wrong = q.answers.filter((a) => !a.isCorrect);
        return [
          q.question,
          correct?.text || "",
          wrong[0]?.text || "",
          wrong[1]?.text || "",
          wrong[2]?.text || "",
          q.sport,
          q.category,
          q.difficulty,
          q.timeLimit,
          q.points,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trivia-questions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    toast.success(`Exported ${questions.length} questions`);
  };

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      searchTerm === "" ||
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.answers.some((a) =>
        a.text.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      hard: "bg-orange-100 text-orange-800",
      expert: "bg-red-100 text-red-800",
    };
    return colors[difficulty] || colors.medium;
  };

  if (loading && questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Trivia Questions
            </h1>
            <p className="text-gray-600 mt-2">
              Manage sports trivia questions and categories
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={importQuestions}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </button>
            <button
              onClick={exportQuestions}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => {
                resetForm();
                setEditingQuestion(null);
                setShowAddModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-xl font-bold">{stats.totalQuestions}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Avg Answer Time</p>
                <p className="text-xl font-bold">
                  {stats.avgAnswerTime.toFixed(1)}s
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <Target className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Correct Rate</p>
                <p className="text-xl font-bold">
                  {(stats.correctRate * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-center">
              <BarChart className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">By Difficulty</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                    E:{stats.byDifficulty.easy}
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                    M:{stats.byDifficulty.medium}
                  </span>
                  <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">
                    H:{stats.byDifficulty.hard}
                  </span>
                  <span className="text-xs bg-red-100 text-red-800 px-1 rounded">
                    X:{stats.byDifficulty.expert}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterOptions.sport}
              onChange={(e) =>
                setFilterOptions({ ...filterOptions, sport: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Sports</option>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
              <option value="NCAA_FOOTBALL">NCAA Football</option>
              <option value="NCAA_BASKETBALL">NCAA Basketball</option>
            </select>

            <select
              value={filterOptions.category}
              onChange={(e) =>
                setFilterOptions({ ...filterOptions, category: e.target.value })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filterOptions.difficulty}
              onChange={(e) =>
                setFilterOptions({
                  ...filterOptions,
                  difficulty: e.target.value,
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>

            <button
              onClick={loadQuestions}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}
                      >
                        {question.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {question.sport}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {question.category}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          question.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {question.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {question.question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      {question.answers.map((answer, index) => (
                        <div
                          key={index}
                          className={`flex items-center p-2 rounded-md ${
                            answer.isCorrect
                              ? "bg-green-50 border border-green-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          {answer.isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                          )}
                          <span className="text-sm">{answer.text}</span>
                        </div>
                      ))}
                    </div>

                    {question.explanation && (
                      <div className="bg-blue-50 rounded-md p-3 mb-3">
                        <p className="text-sm text-blue-900">
                          <strong>Explanation:</strong> {question.explanation}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {question.timeLimit}s limit
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        {question.points} points
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        {question.timesAnswered || 0} attempts
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        {((question.correctRate || 0) * 100).toFixed(0)}%
                        correct
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => editQuestion(question)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Question"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        toggleQuestionStatus(question.id, question.isActive)
                      }
                      className={
                        question.isActive
                          ? "text-yellow-600 hover:text-yellow-900"
                          : "text-green-600 hover:text-green-900"
                      }
                      title={question.isActive ? "Deactivate" : "Activate"}
                    >
                      {question.isActive ? (
                        <XCircle className="h-5 w-5" />
                      ) : (
                        <CheckCircle className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Question"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Questions Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or add a new question.
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Question Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </h2>

                <form onSubmit={saveQuestion}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question *
                      </label>
                      <textarea
                        value={questionForm.question}
                        onChange={(e) =>
                          setQuestionForm({
                            ...questionForm,
                            question: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        rows="3"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sport *
                        </label>
                        <select
                          value={questionForm.sport}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              sport: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="NFL">NFL</option>
                          <option value="NBA">NBA</option>
                          <option value="NCAA_FOOTBALL">NCAA Football</option>
                          <option value="NCAA_BASKETBALL">
                            NCAA Basketball
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={questionForm.category}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              category: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correct Answer *
                      </label>
                      <input
                        type="text"
                        value={questionForm.correctAnswer}
                        onChange={(e) =>
                          setQuestionForm({
                            ...questionForm,
                            correctAnswer: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wrong Answers *
                      </label>
                      <div className="space-y-2">
                        {questionForm.wrongAnswers.map((answer, index) => (
                          <input
                            key={index}
                            type="text"
                            value={answer}
                            onChange={(e) => {
                              const newAnswers = [...questionForm.wrongAnswers];
                              newAnswers[index] = e.target.value;
                              setQuestionForm({
                                ...questionForm,
                                wrongAnswers: newAnswers,
                              });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            placeholder={`Wrong answer ${index + 1}`}
                            required
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty *
                        </label>
                        <select
                          value={questionForm.difficulty}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              difficulty: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                          <option value="expert">Expert</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Limit (seconds)
                        </label>
                        <input
                          type="number"
                          value={questionForm.timeLimit}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              timeLimit: parseInt(e.target.value) || 30,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          min="10"
                          max="60"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Points
                        </label>
                        <input
                          type="number"
                          value={questionForm.points}
                          onChange={(e) =>
                            setQuestionForm({
                              ...questionForm,
                              points: parseInt(e.target.value) || 100,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          min="50"
                          max="500"
                          step="50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Explanation (optional)
                      </label>
                      <textarea
                        value={questionForm.explanation}
                        onChange={(e) =>
                          setQuestionForm({
                            ...questionForm,
                            explanation: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="Provide additional context or fun facts about the answer"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingQuestion(null);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {loading
                        ? "Saving..."
                        : editingQuestion
                          ? "Update Question"
                          : "Add Question"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
