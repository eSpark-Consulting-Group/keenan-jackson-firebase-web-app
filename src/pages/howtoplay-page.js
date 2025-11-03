import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Timer,
  Trophy,
  DollarSign,
  Grid3X3,
  Zap,
  Shield,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Users,
  Award,
} from "lucide-react";

export default function HowToPlay() {
  const steps = [
    {
      icon: DollarSign,
      title: "1. Choose Your Board ($25/$50/$100)",
      description:
        "Select from 6 boards with guaranteed prizes ranging from $200 to $9,000 per quarter. NO FEES on playing or winning!",
      details: [
        "$25 Board: Win $200/quarter",
        "$50 Board: Win $450/quarter",
        "$100 Board: Win $900/quarter",
        "Higher boards available for playoffs & championships",
      ],
    },
    {
      icon: Brain,
      title: "2. Answer trivia questions to earn squares",
      description:
        "Test your sports knowledge with quick trivia questions. Questions get harder with higher boards.",
      details: [
        "Questions cover rules, history, stats, players, and records",
        "Timer starts when question appears",
        "Correct answers earn square tokens",
        "Tokens valid for 48 hours",
      ],
    },
    {
      icon: Grid3X3,
      title: "3. Pick your squares",
      description:
        "Use your tokens to claim squares on the 50-square game board (10×5 grid).",
      details: [
        "Each square can hold maximum 2 players",
        "Choose any available square position",
        "Maximum 3 squares per board through trivia",
        "Your answer time is recorded but hidden",
      ],
    },
    {
      icon: Timer,
      title: "4. Compete in 5 speed contests per board (Q1-Q4 + Champion)",
      description:
        "When game scores match your square numbers, the player with the fastest trivia answer time wins!",
      details: [
        "Winners determined each quarter",
        "Square (3,7) wins with scores 13-17 OR 17-13",
        "Fastest answer time takes the prize",
        "Answer times revealed only after winning",
      ],
    },
    {
      icon: Trophy,
      title: "5. Fastest answer wins each contest",
      description:
        "Every contest rewards knowledge and quick thinking - the faster you answered your trivia, the bigger your edge.",
      details: [
        "Tiebreakers decided by earliest answer submission",
        "Each win is automatically tracked and verified",
        "Winners notified instantly after each quarter",
        "Payouts processed within 24 hours",
      ],
    },
    {
      icon: Award,
      title: "6. Speed Wins Always",
      description:
        "Square Trivia rewards the smartest and fastest players - no luck, no fees, just pure skill and competition.",
      details: [
        "Win multiple times per board with consistent play",
        "Top players qualify for playoff and championship rounds",
        "Climb leaderboards and earn recognition badges",
        "Your trivia speed defines your legacy - every second counts!",
      ],
    },
  ];

  const keyFeatures = [
    {
      icon: Shield,
      title: "100% Skill-Based",
      description:
        "Winners determined by trivia knowledge and speed - no luck involved",
    },
    {
      icon: DollarSign,
      title: "NO FEES",
      description:
        "Guaranteed prize amounts with no hidden fees. Only optional 4% for instant payout.",
    },
    {
      icon: Trophy,
      title: "Consolation Prizes",
      description:
        "Lose a speed competition? Get free trivia questions for future games!",
    },
    {
      icon: Zap,
      title: "Instant Payouts",
      description:
        "Choose instant payout (96%) or wait 2-3 days for full amount (100%)",
    },
  ];

  const faqs = [
    {
      question: "How is this different from gambling?",
      answer:
        "Winners are determined by skill (trivia speed), not random chance. It's like a timed quiz competition with prizes.",
    },
    {
      question: "How many contests per board? ",
      answer:
        "Each board runs 5 contests - one per quarter (Q1, Q2, Q3, Q4) plus the Board Champion (fastest overall time across all quarters).",
    },
    {
      question: "What's the difference between boards?",
      answer:
        "Boards are separated by entry price - $25, $50, or $100 per square. Higher boards have bigger contest prizes.",
    },
    {
      question: "How much can I win?",
      answer:
        "Depends on your board! From $200/quarter in the $25 board up to $9,000/quarter in the $1000 board.",
    },
    {
      question: "How fast do I need to answer?",
      answer:
        "Average winning times are 2-5 seconds. Practice makes perfect! Times are measured to milliseconds.",
    },
    {
      question: "What if I lose on a winning square?",
      answer:
        "You get consolation prizes! Free $25 board trivia questions based on your original board (1-4 questions).",
    },
    {
      question: "How do I know if my square wins?",
      answer: `Your square wins when its two numbers match the last digits of each team’s score — in either order.<br />
👉 Example: Square (2,7) wins if the final score ends in 12–17, 17–12, 22–7, or 7–32.<br />
Every square has two ways to win per game, so you’re always in play.`,
    },
    {
      question: "What if I lose on a winning square?",
      answer: `If your square matches but your opponent had the faster trivia time, you still get a consolation prize:<br />
👉 A free $25 tier trivia question you can use in a future game to claim another square.<br />
This way, you’re always earning another shot to win big.`,
    },
    {
      question: "How is the Board Champion determined",
      answer:
        "The player with the single fastest correct answer time across all 4 quarters becomes Board Champion and wins the championship bonus prize.",
    },
    {
      question: "What if I win multiple contests on one board?",
      answer:
        "You can win multiple quarter contests AND the Board Championship! If you're fast consistently, you could sweep all prizes.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How to Play Square Trivia
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The revolutionary skill-based sports squares game where your
            knowledge and speed determine winners!
          </p>
        </motion.div>

        {/* Video Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-12 text-center"
        >
          <div className="bg-gray-200 rounded-lg h-64 md:h-96 flex items-center justify-center mb-4">
            <div className="text-center">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Tutorial Video Coming Soon</p>
            </div>
          </div>
          <p className="text-gray-600">
            Watch our 2-minute video to see Square Trivia in action
          </p>
        </motion.div>

        {/* Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            4 Simple Steps to Win
          </h2>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row items-start">
                  <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{step.description}</p>

                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Key Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 rounded-lg p-8 md:p-12 mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Makes Square Trivia Special
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white rounded-lg shadow-lg p-8 mb-16"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            🎯 5 Prizes Every Game
          </h2>

          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <div className="space-y-3">
              <p className="text-gray-700">
                Each game pays out{" "}
                <span className="font-semibold">5 guaranteed prizes</span>:
              </p>

              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-lg mr-2">🏆</span>
                  <span>
                    <strong>1 Board Champion</strong> — fastest time across the
                    whole board (grand prize)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-lg mr-2">📅</span>
                  <span>
                    <strong>4 Quarter Winners</strong> — fastest time in each
                    quarter
                  </span>
                </li>
              </ul>

              <p className="text-gray-700">
                That means every game gives you{" "}
                <strong>5 opportunities to win.</strong>
              </p>
            </div>

            {/* Example Section */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Example: How Winners Are Determined
              </h3>

              <div className="bg-white rounded-lg p-6 border border-gray-200 space-y-4">
                <p className="text-gray-700">
                  <strong>Scenario:</strong> NFL game ends{" "}
                  <strong>24–17</strong> → Winning square = (4–7)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded p-4 border-2 border-gray-200">
                    <div className="flex items-center mb-2">
                      <Users className="h-5 w-5 text-blue-600 mr-2" />
                      <strong>Player A</strong>
                    </div>
                    <p className="text-sm text-gray-600">
                      Answer time: 2.347 seconds
                    </p>
                  </div>

                  <div className="bg-green-50 rounded p-4 border-2 border-green-500">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <strong>Player B - WINNER!</strong>
                    </div>
                    <p className="text-sm text-gray-600">
                      Answer time: 1.892 seconds
                    </p>
                  </div>
                </div>

                <p className="text-gray-700">
                  <strong>Result:</strong> Player B wins the $900 prize (Tier
                  $100) with the faster answer time!
                </p>

                <p className="text-gray-800 font-semibold">
                  💰 Player B total payout: $1,800 (Quarter Prize $900 +
                  Champion Prize $900)
                </p>
              </div>
            </div>

            {/* Why It’s Different */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                Why It’s Different
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>
                  💡 <strong>100% Skill-Based</strong> → Speed + Knowledge =
                  Wins
                </li>
                <li>
                  🎁 <strong>5 prizes per game</strong> → Not just one chance to
                  win
                </li>
                <li>
                  ⚡ <strong>Double rewards possible</strong> → Quarter +
                  Champion in the same game
                </li>
                <li>
                  💵 <strong>Guaranteed payouts</strong> → No fees, instant
                  payout option
                </li>
              </ul>
            </div>

            {/* Highlight Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-center">
              <p className="font-semibold text-blue-700 text-lg">
                ⚡ 5 Prizes. 5 Winners. One Champion.
              </p>
              <p className="text-gray-700 font-medium">
                Be the fastest. Take it all.
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  {faq.question}
                </h3>
                <p
                  className="text-gray-700 ml-7"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 md:p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Test Your Skills?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of players winning real money with their sports
            knowledge
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-blue-600 bg-white rounded-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
            >
              Start Playing Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>

            <Link
              to="/games"
              className="inline-flex items-center px-8 py-4 text-lg font-medium text-white bg-blue-800 bg-opacity-50 rounded-lg hover:bg-opacity-70 transition-all duration-200 hover:text-white"
            >
              View Active Games
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
