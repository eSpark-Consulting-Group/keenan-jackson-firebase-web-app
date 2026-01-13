import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Trophy,
  Brain,
  DollarSign,
  Zap,
  Shield,
  Clock,
  Users,
  ChevronRight,
  Plus,
  Check,
  Grid3X3,
} from "lucide-react";
import { useAuth } from "../contexts/authcontext";

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [activeSquares, setActiveSquares] = useState(new Set());
  const boardRef = useRef(null);
  const { scrollYProgress } = useScroll();

  const { hash } = useLocation();
  const { userData } = useAuth();
  const tiersData = userData != null ? "/tiers" : "/register";

  const handleGetStarted = (id) => {
    navigate(userData != null ? `/games?board=${id}` : "/register");
  };

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [hash]);

  // Parallax effect for hero background
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  // Animate random squares
  useEffect(() => {
    const interval = setInterval(() => {
      const randomSquare = Math.floor(Math.random() * 50);
      setActiveSquares((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(randomSquare)) {
          newSet.delete(randomSquare);
        } else {
          newSet.add(randomSquare);
        }
        return newSet;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      number: 1,
      icon: <DollarSign className="w-8 h-8" />,
      title: "Choose Your Board",
      description:
        "Select from 6 boards starting at just $25. Higher boards mean bigger prizes!",
    },
    {
      number: 2,
      icon: <Brain className="w-8 h-8" />,
      title: "Answer Trivia",
      description:
        "Test your sports knowledge with quick trivia questions. Correct answers earn square tokens!",
    },
    {
      number: 3,
      icon: <Grid3X3 className="w-8 h-8" />,
      title: "Claim Your Square",
      description:
        "Pick your lucky numbers on the game board. Each square holds up to 2 players.",
    },
    {
      number: 4,
      icon: <Zap className="w-8 h-8" />,
      title: "Win by Speed",
      description:
        "When your square hits, the fastest trivia answer wins! No luck, just skill.",
    },
    {
      number: 5,
      icon: <Trophy className="w-8 h-8" />,
      title: "Get Paid Fast",
      description:
        "Choose instant payout (92%) or wait 2-3 days for 100%. No hidden fees!",
    },
  ];

  const tiers = [
    {
      name: "Starter",
      amount: 25,
      prizePerQuarter: 200,
      totalPrize: 1000,
      features: [
        "$1000 Total Contest Prizes per Game",
        "Available All Games",
        "1 Consolation Question",
        "Perfect for Beginners",
      ],
      popular: false,
      id: "tier_25",
    },
    {
      name: "Most Popular",
      amount: 100,
      prizePerQuarter: 900,
      totalPrize: 4500,
      features: [
        "$4,500 Total Contest Prizes per Game",
        "Big wins at an accessible entry point ",
        "1 Consolation Question",
        "Best Value for Players",
      ],
      popular: true,
      id: "tier_100",
    },
    {
      name: "High Roller",
      amount: 500,
      prizePerQuarter: 4500,
      totalPrize: 22500,
      features: [
        "$22,500 Total Contest Prizes",
        "Playoffs & Championships",
        "2 consolation trivia questions ",
        "For serious competitors ",
      ],
      popular: false,
      id: "tier_500",
    },
  ];

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "100% Skill-Based",
      description:
        "No random drawings or luck involved. Winners are determined purely by trivia knowledge and answer speed. Your sports expertise directly translates to wins!",
    },
    {
      icon: <DollarSign className="w-8 h-8" />,
      title: "NO FEES Guaranteed",
      description:
        "We mean it - no fees on entry or prizes! You pay exactly what you see, and win exactly what's advertised. The only optional fee is 8% for instant payouts.",
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Hidden Answer Times",
      description:
        "Your trivia answer times stay private until a square wins. This prevents strategic avoidance and keeps competition fair and exciting for everyone.",
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Consolation Prizes",
      description:
        "Lost a speed competition? Get free trivia questions for future games! Higher boards get more chances. We reward participation and keep you in the game.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Instant Payouts",
      description:
        "Won big? Get 92% of your prize immediately with our express payout option, or wait 2-3 days for the full 100%. Your choice, your money!",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Multi-Platform Access",
      description:
        "Play on web, get notifications via Telegram, track games on mobile. We're everywhere you are, making it easy to never miss a game or win!",
    },
  ];

  const faqs = [
    {
      question: "How is this different from gambling?",
      answer:
        "Square Trivia is 100% skill-based! Winners are determined by their sports knowledge and answer speed, not random chance. It's like a timed quiz competition with prizes - completely legal and based on your abilities.",
    },
    {
      question: "Are there really NO FEES?",
      answer:
        "Yes! There are absolutely no fees to play or win. The entry amount you see is exactly what you pay, and the prize amount shown is exactly what you win. The only optional fee is 8% if you choose instant payout instead of waiting 2-3 days for the full amount.",
    },
    {
      question: "How fast do I need to answer trivia questions?",
      answer:
        "Average winning times are between 2-5 seconds. The timer starts when the question appears, so quick reading and fast thinking are key! Practice makes perfect, and you'll get faster over time.",
    },
    {
      question: "How do I know if my square wins?",
      answer:
        "Your square wins if its numbers match the last digits of the score in ANY order. For example, square (2,7) wins with scores like 12-17, 17-12, 22-7, or 7-32. Each square has two ways to win, doubling your chances!",
    },
    {
      question: "What happens if I lose on a winning square?",
      answer:
        "If your square wins but you had the slower answer time, you get consolation prizes! You'll receive free trivia questions (1-4 depending on your board) that you can use to claim squares on $25 board. It's our way of keeping you in the game!",
    },
    {
      question: "When and how do I get paid?",
      answer:
        "You have two options: Choose instant payout to get 92% of your prize the same day (8% express service fee), or wait 2-3 days to receive the full 100% amount. Payments are processed via your preferred method - we support multiple payout options!",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-emerald-50 pt-20">
        <motion.div className="absolute inset-0 opacity-10" style={{ y }}>
          <div className="absolute top-0 -right-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        </motion.div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Win Big with Your{" "}
                <span className="bg-gradient-to-r from-emerald-500 to-blue-600 bg-clip-text text-transparent">
                  Sports Knowledge
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                The only skill-based sports squares platform where speed and
                knowledge determine winners!
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold">
                    NO FEES on Entry or Prizes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold">100% Skill-Based</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span className="font-semibold">Instant Payouts</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate(tiersData)}
                  className="px-8 py-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 transform hover:scale-105 transition-all shadow-lg"
                >
                  Start Playing Now
                </button>
                <button
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      .scrollIntoView({ behavior: "smooth" })
                  }
                  className="px-8 py-4 border-2 border-emerald-500 text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-all"
                >
                  Learn More
                </button>
              </div>
            </motion.div>

            {/* Hero Visual - Game Board */}
            <motion.div
              ref={boardRef}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-auto">
                <div className="grid grid-cols-10 gap-1 mb-4">
                  {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.2 }}
                      className={`aspect-square rounded flex items-center justify-center text-xs font-semibold cursor-pointer transition-all ${
                        activeSquares.has(i)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 hover:bg-emerald-500 hover:text-white"
                      }`}
                    >
                      {i}
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-500">
                      $1,000
                    </div>
                    <div className="text-sm text-gray-600">Contest Prizes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-500">
                      2.3s
                    </div>
                    <div className="text-sm text-gray-600">Avg Win Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-500">
                      {activeSquares.size}/50
                    </div>
                    <div className="text-sm text-gray-600">Squares Filled</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Square Trivia Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, fair, and rewarding - here's how you play and win!
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                <div className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="absolute -top-4 -right-4 text-6xl font-bold text-gray-100">
                    {step.number}
                  </div>
                  <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Boards Section */}
      <section
        className="py-20 bg-gradient-to-br from-emerald-50 to-blue-50"
        id="pricing"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Playing Board
            </h2>
            <p className="text-xl text-gray-600">
              Guaranteed prizes every quarter - NO FEES on playing or winning!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ y: -10 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl p-8 ${
                  tier.popular
                    ? "ring-4 ring-yellow-400 transform scale-105"
                    : "shadow-lg"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black px-4 py-1 rounded-full text-sm font-bold">
                    MOST POPULAR
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="text-sm font-semibold text-gray-500 mb-2">
                    {tier.name}
                  </div>
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    ${tier.amount}
                  </div>
                  <div className="text-lg text-emerald-600 font-semibold">
                    Win ${tier.prizePerQuarter.toLocaleString()}/Quarter
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <Check className="w-5 h-5 text-emerald-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  // onClick={() => navigate(tiersData)}
                  onClick={() => handleGetStarted(tier?.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? "bg-yellow-400 text-black hover:bg-yellow-500"
                      : "bg-emerald-500 text-white hover:bg-emerald-600"
                  }`}
                >
                  {/* Get Started */}
                  Search Boards
                </button>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to={tiersData}
              className="text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              View all 6 boards →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Square Trivia is Different
            </h2>
            <p className="text-xl text-gray-600">
              We've revolutionized the traditional squares game with skill-based
              competition
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Square Trivia
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <button
                  onClick={() =>
                    setActiveFaq(activeFaq === index ? null : index)
                  }
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>
                  <Plus
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      activeFaq === index ? "rotate-45" : ""
                    }`}
                  />
                </button>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: activeFaq === index ? "auto" : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-4 text-gray-600">{faq.answer}</div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Turn Your Sports Knowledge into Cash?
          </h2>
          <p
            className="text-xl mb-8 opacity-90"
            dangerouslySetInnerHTML={{
              __html:
                "Join thousands of sports fans winning with their trivia skills <br> NO FEES, just pure competition!",
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(tiersData)}
            className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-lg hover:bg-gray-100 transition-all inline-flex items-center gap-2"
          >
            Start Playing Now <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div
              className="flex justify-center gap-8 mb-8 flex-wrap
          max-[320px]:flex-col max-[320px]:gap-2"
            >
              <Link
                to="/legal"
                className="hover:text-emerald-400 transition-colors max-[320px]:text-sm"
              >
                Terms of Service
              </Link>
              <Link
                to="/legal"
                className="hover:text-emerald-400 transition-colors max-[320px]:text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                to="/support"
                className="hover:text-emerald-400 transition-colors max-[320px]:text-sm"
              >
                Support
              </Link>
              <Link
                to="/contact"
                className="hover:text-emerald-400 transition-colors max-[320px]:text-sm"
              >
                Contact
              </Link>
            </div>
            <p className="text-gray-400 max-[320px]:text-xs max-[320px]:px-2">
              © 2025 Square Trivia. All rights reserved. 18+ only.
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
