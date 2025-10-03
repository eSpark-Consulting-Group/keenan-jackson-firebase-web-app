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
} from "lucide-react";
import { STTos } from "../constant";

export default function Legal() {
  const { page } = useParams();

  const renderContent = () => {
    switch (page) {
      case "terms":
        return <TermsOfService />;
      case "privacy":
        return <PrivacyPolicy />;
      case "skill-certification":
        return <SkillCertification />;
      default:
        return <LegalHub />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
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
      title: "Skill Certification",
      description: "Legal certification of Square Trivia as a skill-based game",
      icon: Award,
      link: "/legal/skill-certification",
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

const CircelList = ({ data }) => {
  return (
    <section>
      {data.heading && (
        <h2
          className="text-xl font-semibold text-gray-900 mb-4"
          dangerouslySetInnerHTML={{ __html: data.heading }}
        />
      )}
      {data?.subHeading && (
        <p
          className="text-gray-700"
          dangerouslySetInnerHTML={{ __html: data.subHeading }}
        />
      )}
      {data?.listItems && (
        <ul className="space-y-2 text-gray-700">
          {data.listItems.map((point, index) => (
            <li key={index} className="flex flex-col">
              <div className="flex items-start">
                {data.isCheckCircle ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <span>•&nbsp;&nbsp;</span>
                )}
                <span dangerouslySetInnerHTML={{ __html: point?.text }} />
              </div>

              {point?.points && (
                <ul className="space-y-2 text-gray-700 mt-2 ml-6">
                  {point.points.map((subPoint, subIndex) => (
                    <li key={subIndex} className="flex items-start">
                      {data.isCheckCircle ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <span>•&nbsp;&nbsp;</span>
                      )}
                      <span dangerouslySetInnerHTML={{ __html: subPoint }} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.footer && (
        <p
          className="text-gray-700 mt-2"
          dangerouslySetInnerHTML={{ __html: data.footer }}
        />
      )}
    </section>
  );
};

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
            Effective Date: January 1, 2025
          </p>
          <p className="text-gray-700 mb-6">
            Welcome to Square Trivia! These Terms of Service ("Terms") govern
            your use of our skill-based sports trivia platform. By accessing or
            using Square Trivia, you agree to be bound by these Terms.
          </p>
        </div>
        {STTos?.map((item, index) => (
          <CircelList key={index} data={item} />
        ))}

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
            Effective Date: January 1, 2025
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
                <li>• Phone number (optional)</li>
                <li>• Telegram username (optional)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Game Data</h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>• Trivia answer times</li>
                <li>• Square selections</li>
                <li>• Win/loss history</li>
                <li>• Transaction records</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Payment Information
              </h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li>• Processed securely through Stripe</li>
                <li>• We do not store credit card numbers</li>
                <li>• Tax information (W-9) when required</li>
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
              <span>Process game entries and payouts</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Send game notifications and updates</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Prevent fraud and ensure fair play</span>
            </li>
            <li className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <span>Comply with legal requirements</span>
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
            your information.
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
            <li>• Close your account at any time</li>
          </ul>
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

function SkillCertification() {
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
        Skill-Based Game Certification
      </h1>

      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <Award className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">
            Square Trivia is 100% Skill-Based
          </h2>
        </div>

        <div className="space-y-6 text-gray-700">
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Legal Classification
            </h3>
            <p>
              Square Trivia qualifies as a skill-based competition under U.S.
              law because winners are determined entirely by participants'
              knowledge and speed in answering trivia questions, with no element
              of chance involved in the outcome determination.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Key Skill Elements
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Knowledge:</strong> Correct answers require sports
                  knowledge
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Speed:</strong> Faster correct answers win
                  competitions
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Strategy:</strong> Square selection requires strategic
                  thinking
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Practice:</strong> Performance improves with
                  experience
                </span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              No Element of Chance
            </h3>
            <p className="mb-3">
              Unlike traditional squares games where winners are randomly
              determined by score combinations, Square Trivia ensures that:
            </p>
            <ul className="space-y-2 ml-4">
              <li>• Winners are determined by measurable skill metrics</li>
              <li>• Answer times are objectively recorded to milliseconds</li>
              <li>• No random number generators or chance mechanics</li>
              <li>• Skill directly correlates with success rate</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Alternative Method of Entry (AMOE)
            </h3>
            <p>
              In compliance with skill-based competition regulations, Square
              Trivia offers a free alternative method of entry via mail-in
              request, ensuring no purchase is necessary to participate or win.
            </p>
          </section>

          <section className="bg-blue-50 rounded-lg p-6">
            <p className="text-sm text-gray-600 text-center">
              This certification is based on legal analysis of skill-based
              gaming laws. Players should verify local regulations in their
              jurisdiction. Square Trivia operates legally as a skill-based
              competition in jurisdictions where such competitions are
              permitted.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
