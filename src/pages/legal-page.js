import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Shield,
  Lock,
  Award,
  ChevronLeft,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react";

export default function Legal() {
  const { page } = useParams();

  const renderContent = () => {
    switch (page) {
      case "terms":
        return <TermsOfService />;
      case "privacy":
        return <PrivacyPolicy />;
      case "responsible-competition":
        return <ResponsibleCompetition />;
      // Legacy redirect for old URLs
      case "skill-certification":
        return <ResponsibleCompetition />;
      default:
        return <LegalHub />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-gradient-to-r from-blue-600 to-blue-600 rounded-lg p-8 md:p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Test Your Skills?
          </h2>
          <p className="text-xl mb-4 text-blue-100">
            Join thousands of players winning real money with their sports
            knowledge
          </p>

          {/* Taglines */}
          <div className="mb-8 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 text-blue-100 text-lg font-medium">
            <span className="italic">Speed Wins Always</span>
            <span className="italic">•</span>
            <span className="italic">Be the Fastest</span>
            <span className="italic">•</span>
            <span className="italic">Board Champion = Fastest Overall</span>
          </div>

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

function LegalHub() {
  const pages = [
    {
      title: "Terms of Service",
      description: "Our terms and conditions for using Square Trivia",
      icon: FileText,
      link: "/legal/terms",
    },
    {
      title: "Privacy Policy",
      description: "How we collect, use, and protect your data",
      icon: Lock,
      link: "/legal/privacy",
    },
    {
      title: "Responsible Competition",
      description: "Our commitment to fair, skill-based competition",
      icon: Award,
      link: "/legal/responsible-competition",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Legal Information
      </h1>

      <div className="space-y-4">
        {pages.map((page, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={page.link}
              className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <page.icon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    {page.title}
                  </h2>
                  <p className="text-gray-600">{page.description}</p>
                </div>
                <ExternalLink className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function TermsOfService() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/legal"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Legal
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Terms of Service
      </h1>

      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Effective Date: January 8, 2026
          </p>
          <p className="text-gray-700 mb-6">
            Welcome to Square Trivia! These Terms of Service govern your use of
            our skill-based sports trivia competition platform.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Platform Overview
          </h2>
          <p className="text-gray-700 mb-3">
            Square Trivia is a skill-based competition platform. Participation
            and success depend entirely on your knowledge and skill in answering
            trivia questions correctly and quickly. Winners are determined by
            the speed of their correct trivia answers. This is not a game of
            chance, lottery, or gambling service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            2. Eligibility
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Must be 18 years or older</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Must be a legal resident of the United States</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                Must not reside in restricted states: AZ, AR, CT, DE, ID, LA,
                MD, MT, RI, SC, TN, VT
              </span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>One account per person</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>
                Must provide accurate identity information (SSN last 4 + DOB for
                verification)
              </span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            3. Competition Rules
          </h2>
          <p className="text-gray-700 mb-3">
            Square Trivia is a skill-based competition where winners are
            determined by:
          </p>
          <ul className="space-y-2 text-gray-700 ml-4">
            <li>• Correctly answering sports trivia questions</li>
            <li>• Speed of correct answers (measured in milliseconds)</li>
            <li>• Strategic square selection</li>
            <li>• No element of chance in winner determination</li>
            <li>• Maximum 3 squares per board per participant</li>
          </ul>
          <p className="text-gray-700 mt-3">
            When two participants occupy the same square, the participant with
            the faster trivia answer time wins. Single-participant squares
            compete against the Board Average Answer Time (BAAT).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            4. Entry Fees & Prizes
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li>
              • Entry fees grant access to skill-based competitions ($25 -
              $1,000 tiers)
            </li>
            <li>
              • Entry fees are non-refundable once a competition position is
              claimed
            </li>
            <li>
              • Guaranteed prize amounts with NO platform fees on winnings
            </li>
            <li>• Standard payouts processed Tuesday/Friday (0% fee)</li>
            <li>• Optional instant payout service (8% convenience fee)</li>
            <li>• W-9 required for $600+ annual winnings</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            5. Refund Policy
          </h2>
          <p className="text-gray-700 mb-3">
            Entry fees are generally non-refundable once a competition position
            is claimed. Limited exceptions:
          </p>
          <ul className="space-y-2 text-gray-700 ml-4">
            <li>
              • Technical failure preventing competition participation (our
              systems)
            </li>
            <li>• Unauthorized access by minor (with verification)</li>
            <li>• Duplicate payment processing errors</li>
            <li>
              • First-time participant 24-hour cooling period (one-time
              courtesy)
            </li>
          </ul>
          <p className="text-gray-700 mt-3 text-sm">
            Process: Email support@squaretrivia.com within 30 days with
            documentation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            6. Prohibited Conduct
          </h2>
          <p className="text-gray-700 mb-3">You may not:</p>
          <ul className="space-y-2 text-gray-700 ml-4">
            <li>• Use automated tools, bots, or scripts</li>
            <li>• Create multiple accounts</li>
            <li>• Share accounts or play as proxy for another person</li>
            <li>• Use VPNs or location-masking technology</li>
            <li>• Attempt to manipulate or hack the system</li>
            <li>• Collude with other participants</li>
            <li>• Engage in any fraudulent activity</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            7. Account Termination
          </h2>
          <p className="text-gray-700">
            We reserve the right to suspend or terminate accounts that violate
            these terms, with forfeiture of any pending prizes or credits.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            8. Dispute Resolution
          </h2>
          <p className="text-gray-700">
            Any disputes arising from use of Square Trivia shall be resolved
            through binding arbitration under AAA Consumer Rules, conducted
            individually (not as a class action). Governing law: State of New
            Mexico.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            9. Disclaimer
          </h2>
          <p className="text-gray-700">
            Square Trivia is provided "as is" without warranties of any kind. We
            are not responsible for technical issues, game cancellations, or
            score corrections that may affect outcomes. Liability is limited to
            entry fees paid.
          </p>
        </section>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            By using Square Trivia, you agree to these Terms of Service. For
            questions, contact support@squaretrivia.com
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function PrivacyPolicy() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/legal"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Legal
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

      <div className="bg-white rounded-lg shadow-md p-8 space-y-6">
        <div>
          <p className="text-sm text-gray-500 mb-4">
            Effective Date: January 8, 2026
          </p>
          <p className="text-gray-700 mb-6">
            Your privacy is important to us. This policy explains how we
            collect, use, and protect your information.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Information We Collect
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Account Information
              </h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>• Email address</li>
                <li>• Username</li>
                <li>• Phone number</li>
                <li>• Date of birth</li>
                <li>• Last 4 digits of SSN (for identity verification)</li>
                <li>• Mailing address</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Competition Data
              </h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>• Trivia answer times (measured in milliseconds)</li>
                <li>• Square selections</li>
                <li>• Win/loss history</li>
                <li>• Skill performance metrics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Payment Information
              </h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>• Processed securely through our payment processor</li>
                <li>• We do not store credit card numbers</li>
                <li>• Tax information (W-9) when required by law</li>
                <li>
                  • Payout history and banking details for prize distribution
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Technical Information
              </h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>
                  • IP address (for geo-verification and fraud prevention)
                </li>
                <li>• Device information</li>
                <li>• Browser type</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            How We Use Your Information
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Process competition entries and determine winners</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Verify identity and age (18+ requirement)</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Verify geographic eligibility (state restrictions)</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Process payouts and tax reporting</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Send competition notifications and updates</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Prevent fraud, collusion, and ensure fair play</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Comply with legal and regulatory requirements</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Data Security
          </h2>
          <p className="text-gray-700">
            We implement industry-standard security measures including
            encryption, secure servers, and regular security audits to protect
            your information. Trivia answer timing data is securely stored and
            protected against tampering to ensure fair competition.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Data Retention
          </h2>
          <p className="text-gray-700">
            We retain your information for as long as your account is active or
            as needed to provide services. Financial records are retained as
            required by tax law (typically 7 years). You may request account
            deletion at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Rights
          </h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Access your personal data</li>
            <li>• Request data correction or deletion</li>
            <li>• Opt-out of marketing communications</li>
            <li>• Export your data</li>
            <li>• Close your account at any time</li>
          </ul>
          <p className="text-gray-700 mt-3 text-sm">
            California residents have additional rights under CCPA. Contact us
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Third-Party Services
          </h2>
          <p className="text-gray-700">
            We use third-party services for payment processing, identity
            verification, and data storage. These services are contractually
            bound to protect your information and use it only for the purposes
            we specify.
          </p>
        </section>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            For privacy questions or requests, contact privacy@squaretrivia.com
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function ResponsibleCompetition() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/legal"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Legal
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Responsible Competition
      </h1>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <Award className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            Square Trivia is 100% Skill-Based
          </h2>
          <p className="text-gray-600 mt-2">
            Not gambling. Not a lottery. Pure skill competition.
          </p>
        </div>

        <div className="space-y-6 text-gray-700">
          {/* Skill-Based Framework */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Skill-Based Framework
            </h3>
            <p className="mb-4">
              Square Trivia operates as a skill-based competition platform where
              outcomes are determined entirely by participants' knowledge,
              speed, and strategy—never by chance.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Knowledge:</strong> Correct answers require sports
                  trivia knowledge
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Speed:</strong> Answer time determines winners
                  (millisecond precision)
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Strategy:</strong> Square selection requires tactical
                  decision-making
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Consistency:</strong> Better-skilled participants win
                  more often
                </span>
              </li>
            </ul>
          </section>

          {/* How Winners Are Determined */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              How Winners Are Determined
            </h3>
            <p className="mb-3">
              When a square's numbers match the game score at the end of any
              quarter:
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                • <strong>Two participants on square:</strong> Faster trivia
                answer time wins
              </li>
              <li>
                • <strong>One participant on square:</strong> Competes against
                Board Average Answer Time (BAAT)
              </li>
              <li>
                • Game scores only activate squares—they do not determine
                winners
              </li>
              <li>• The faster, more knowledgeable participant always wins</li>
            </ul>
          </section>

          {/* No Element of Chance */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              No Element of Chance
            </h3>
            <p className="mb-3">
              Unlike traditional squares games where winners are randomly
              determined:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• Winners are determined by measurable skill metrics</li>
              <li>• Answer times are objectively recorded to milliseconds</li>
              <li>• No random number generators or chance mechanics</li>
              <li>• Skill directly correlates with success rate</li>
              <li>• Given identical inputs, outcomes are 100% predictable</li>
            </ul>
          </section>

          {/* Responsible Play Policy */}
          <section className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Responsible Play Policy
            </h3>
            <p className="mb-4 text-sm">
              While Square Trivia is not gambling, we maintain responsible play
              features to promote fairness, transparency, and participant
              wellbeing:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Voluntary Participation:</strong> All competitions are
                  optional
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Age Verification:</strong> 18+ strictly enforced
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Self-Exclusion:</strong> 30-day exclusion available
                  via support@squaretrivia.com
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Transparency:</strong> All rules and outcomes are
                  clearly disclosed
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>No Credit:</strong> We never offer loans or credit for
                  entry fees
                </span>
              </li>
            </ul>
            <p className="mt-4 text-xs text-gray-600 italic">
              This policy exists not because Square Trivia is gambling, but to
              affirm that it is not—providing transparency, trust, and
              regulatory clarity.
            </p>
          </section>

          {/* Legal Compliance */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Legal Compliance
            </h3>
            <p className="mb-3">
              Square Trivia maintains compliance with all applicable laws and
              regulations:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• UIGEA compliant (skill-based contest, not gambling)</li>
              <li>• FTC guidelines for contests and competitions</li>
              <li>• State-specific skill game regulations</li>
              <li>• Consumer protection laws</li>
              <li>• Tax reporting requirements (1099/W-2G)</li>
              <li>
                • Privacy and data protection regulations (CCPA compliant)
              </li>
            </ul>
          </section>

          {/* Restricted States */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Geographic Restrictions
            </h3>
            <p className="mb-3">
              Paid competitions are not available in the following states:
            </p>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <span className="bg-gray-100 px-2 py-1 rounded">
                Arizona (AZ)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Arkansas (AR)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Connecticut (CT)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Delaware (DE)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">Idaho (ID)</span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Louisiana (LA)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Maryland (MD)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Montana (MT)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Rhode Island (RI)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                South Carolina (SC)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Tennessee (TN)
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded">
                Vermont (VT)
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Available in 38 states.
            </p>
          </section>

          {/* Disclaimer */}
          <section className="bg-gray-50 rounded-lg p-6 text-sm">
            <p className="text-gray-600 text-center">
              This information is based on legal analysis of skill-based
              competition laws. Participants should verify local regulations in
              their jurisdiction. Square Trivia operates legally as a
              skill-based competition platform in jurisdictions where such
              competitions are permitted.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
