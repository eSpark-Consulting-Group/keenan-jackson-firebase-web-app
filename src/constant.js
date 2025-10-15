import { Award, CheckCircle } from "lucide-react";

export const nflTeams = [
  "Arizona Cardinals",
  "Atlanta Falcons",
  "Baltimore Ravens",
  "Buffalo Bills",
  "Carolina Panthers",
  "Chicago Bears",
  "Cincinnati Bengals",
  "Cleveland Browns",
  "Dallas Cowboys",
  "Denver Broncos",
  "Detroit Lions",
  "Green Bay Packers",
  "Houston Texans",
  "Indianapolis Colts",
  "Jacksonville Jaguars",
  "Kansas City Chiefs",
  "Las Vegas Raiders",
  "Los Angeles Chargers",
  "Los Angeles Rams",
  "Miami Dolphins",
  "Minnesota Vikings",
  "New England Patriots",
  "New Orleans Saints",
  "New York Giants",
  "New York Jets",
  "Philadelphia Eagles",
  "Pittsburgh Steelers",
  "San Francisco 49ers",
  "Seattle Seahawks",
  "Tampa Bay Buccaneers",
  "Tennessee Titans",
  "Washington Commanders",
];

export const nbaTeams = [
  "Atlanta Hawks",
  "Boston Celtics",
  "Brooklyn Nets",
  "Charlotte Hornets",
  "Chicago Bulls",
  "Cleveland Cavaliers",
  "Dallas Mavericks",
  "Denver Nuggets",
  "Detroit Pistons",
  "Golden State Warriors",
  "Houston Rockets",
  "Indiana Pacers",
  "Los Angeles Clippers",
  "Los Angeles Lakers",
  "Memphis Grizzlies",
  "Miami Heat",
  "Milwaukee Bucks",
  "Minnesota Timberwolves",
  "New Orleans Pelicans",
  "New York Knicks",
  "Oklahoma City Thunder",
  "Orlando Magic",
  "Philadelphia 76ers",
  "Phoenix Suns",
  "Portland Trail Blazers",
  "Sacramento Kings",
  "San Antonio Spurs",
  "Toronto Raptors",
  "Utah Jazz",
  "Washington Wizards",
];

export const TERMS_OF_SERVICE = [
  {
    heading: "1. Eligibility",
    isCheckCircle: true,
    listItems: [
      {
        text: "Be <b>18 years of age</b> or <b>older</b>",
      },
      {
        text: "Be a <b>legal resident of the United States</b>",
      },
      {
        text: "Follow <b>Square Trivia</b> rules strictly",
      },
      {
        text: "Maintain only <b>one account per person</b>",
      },
    ],
    footer:
      "<b>Ineligible Participants:</b> Employees, contractors, and immediate family members of Square Trivia are not eligible to participate. Participation is void where prohibited by law. ",
  },
  {
    heading: "2. Nature of the Game",
    isCheckCircle: false,
    listItems: [
      {
        text: "Winners are determined by <b>speed</b> and <b>accuracy</b> of trivia responses",
      },
      {
        text: "No element of <b>chance</b> determines winners",
      },
      {
        text: "Sports scores serve only as <b>neutral triggers</b> for trivia-based contests",
      },
      {
        text: "Game outcomes are <b>independent</b> of sports team performance",
      },
      {
        text: "Players can earn a maximum of <b>3 squares per board</b> through trivia performance",
      },
    ],
  },
  {
    heading: "3. Entry Methods",
    isCheckCircle: false,
    listItems: [
      {
        text: "Players may enter by making a <b>donation</b> to access designated tiered boards",
      },
      {
        text: "Available tiers:",
        points: [
          "<b>Rookies:</b> $25",
          "<b>Starters:</b> $50",
          "<b>Playmakers:</b> $100",
          "<b>Primetimers:</b> $250",
          "<b>Heavyweights:</b> $500",
          "<b>Champions:</b> $1,000",
        ],
      },
      {
        text: "All donations are <b>non-refundable</b> and support platform operations",
      },
    ],
  },
  {
    isCheckCircle: false,
    subHeading: "<b>Free Entry (Alternative Method of Entry - AMOE) </b> ",
    listItems: [
      {
        text: "No purchase necessary to enter or win ",
      },
      {
        text: "Free entry details available by contacting admin@squaretrivia.com ",
      },
      {
        text: "Free entry participants have access subject to availability and platform discretion ",
      },
    ],
  },
  {
    heading: "4. Game Structure & Rules",
    isCheckCircle: false,
    listItems: [
      {
        text: "Each game board contains <b>100 squares</b>",
      },
      {
        text: "Winners are determined as follows:",
        points: [
          "<b>Quarter Winners:</b> 1 winner per quarter (4 total)",
          "<b>Board Champion:</b> Fastest correct respondent across all quarters",
          "<b>Additional Recognition:</b> May be awarded for exceptional performance",
        ],
      },

      {
        text: "Maximum of <b>5 prize winners</b> per game board",
      },
      {
        text: "All winner determinations are <b>final</b> and based solely on trivia performance metrics",
      },
    ],
  },
  {
    heading: "5. Prizes",
    isCheckCircle: false,
    subHeading: "Prize Structure by Tier:",
    listItems: [
      {
        text: "<b>Rookies ($25):</b> $200 per quarter",
      },
      {
        text: "<b>Starters ($50):</b> $450 per quarter",
      },
      {
        text: "<b>Playmakers ($100):</b> $900 per quarter",
      },
      {
        text: "<b>Primetimers ($250):</b> $2,250 per quarter",
      },
      {
        text: "<b>Heavyweights ($500):</b> $4,500 per quarter",
      },
      {
        text: "<b>Champions ($1,000):</b> $9,000 per quarter",
      },
    ],
  },
  {
    subHeading: "Important Prize Terms:",
    isCheckCircle: false,
    listItems: [
      {
        text: "All prizes are <b>guaranteed amounts</b> with <b>NO FEES</b> on standard payouts",
      },
      {
        text: "Prizes are <b>not transferable</b> or exchangeable for cash alternatives",
      },
      {
        text: "<b>Board Champions</b> may receive additional recognition or bonuses",
      },
      {
        text: "Winners are responsible for any applicable <b>taxes</b> on prizes",
      },
      {
        text: "<b>W-9 form</b> required for cumulative annual winnings of $600 or more",
      },
    ],
  },
  {
    heading: "6. Payouts & Payment Processing",
    isCheckCircle: false,
    listItems: [
      {
        text: "<b>Standard Payout:</b> Issued within 1–2 business days at no charge",
      },
      {
        text: "<b>Instant Payout Option:</b> Available immediately with a 4% convenience fee",
      },
      {
        text: "Payments processed via <b>secure financial partners</b> (Stripe, Relay, Mercury)",
      },
      {
        text: "Payment method must be <b>verified</b> and belong to the account holder",
      },
      {
        text: "Square Trivia reserves the right to <b>withhold payment</b> pending identity verification or investigation of suspected violations",
      },
    ],
  },
  {
    heading: "7. Prohibited Conduct",
    subHeading: "Users may not:",
    isCheckCircle: false,
    listItems: [
      {
        text: "Use automated tools, bots, scripts, or any artificial means to gain advantage",
      },
      {
        text: "Create or operate <b>multiple accounts</b>",
      },
      {
        text: "Share accounts or play as a <b>proxy</b> for another person",
      },
      {
        text: "Attempt to manipulate, hack, or exploit the system",
      },
      {
        text: "Engage in <b>fraudulent activity</b>, collusion, or cheating",
      },
      {
        text: "Misrepresent identity or provide <b>false information</b>",
      },
      {
        text: "Abuse, harass, or threaten other users or staff",
      },
    ],
    footer:
      "<b>Violations will result in immediate account suspension or termination with forfeiture of prizes, credits, and entry fees.</b>",
  },
  {
    heading: "8. Account Termination ",
    subHeading: "Square Trivia reserves the right to:",
    isCheckCircle: false,
    listItems: [
      {
        text: "Suspend or terminate accounts that violate these Terms",
      },
      {
        text: "Investigate <b>suspicious activity</b>",
      },
      {
        text: "Withhold or <b>forfeit prizes</b> for accounts under investigation",
      },
      {
        text: "Ban users <b>permanently</b> for serious violations",
      },
      {
        text: "Take <b>legal action</b> for fraud or abuse",
      },
    ],
  },
  {
    heading: "9. Limitations & Restrictions",
    isCheckCircle: false,
    listItems: [
      {
        text: "One account per person; <b>multiple accounts</b> result in disqualification",
      },
      {
        text: "Free entry availability is at <b>Square Trivia's discretion</b>",
      },
      {
        text: "Square Trivia reserves the right to modify:",
        points: [
          "Board schedules",
          "Prize structures",
          "Eligibility requirements",
          "Game formats",
        ],
      },
      {
        text: "Changes will be communicated via <b>platform updates</b> or email",
      },
    ],
  },
  {
    heading: "10. Publicity & Use of Likeness ",
    isCheckCircle: false,
    subHeading:
      "By participating, you grant Square Trivia the right to use your username, winning statistics, and performance data in promotional materials, leaderboards, and marketing content unless prohibited by law. We will not use your legal name or personal information without additional consent. ",
  },
  {
    heading: "11. Disclaimers & Limitations of Liability ",
    isCheckCircle: false,
    subHeading: `<b>Service Provided "As Is"</b> Square Trivia is provided "as is" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. `,
  },
  {
    subheading: "No Liability For:",
    isCheckCircle: false,
    listItems: [
      {
        text: "Technical failures, internet outages, or connectivity issues",
      },
      {
        text: "Errors in entry submission or game display",
      },
      {
        text: "Game cancellations or postponements",
      },
      {
        text: "Score corrections or data errors",
      },
      {
        text: "Third-party payment processor issues",
      },
      {
        text: "Loss of data or account access",
      },
    ],
    footer:
      "<b>Maximum Liability:</b> Square Trivia's total liability to any user shall not exceed the amount of <b>entry donations</b> made by that user in the preceding 12 months.",
  },
  {
    heading: "12. Governing Law & Dispute Resolution",
    isCheckCircle: false,
    listItems: [
      {
        text: "These Terms are governed by the laws of the <b>State of New Mexico</b>, without regard to conflict of law provisions.",
      },
      {
        text: "Any disputes arising from these Terms or your use of Square Trivia shall be resolved through <b>binding arbitration</b> in accordance with the rules of the American Arbitration Association.",
      },
    ],
  },
  {
    heading: "13. Modifications to Terms",
    isCheckCircle: false,
    subHeading:
      "Square Trivia reserves the right to <b>modify</b> these Terms at any time. Changes will be <b>effective immediately</b> upon posting to the platform. Continued use of Square Trivia after changes constitutes <b>acceptance</b> of the modified Terms. Material changes will be communicated via <b>email</b> or platform notification.",
  },
  {
    heading: "14. Severability",
    isCheckCircle: false,
    subHeading:
      "If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.",
  },
  {
    heading: "15. Contact Information",
    isCheckCircle: false,
    subHeading: `For questions, concerns, AMOE submissions, or official correspondence:
</p></p><b>Email:</b><a href="mailto:admin@squaretrivia.com" style="color:black; text-decoration:underline;">
  admin@squaretrivia.com
</a>


</p></p><b>Mailing Address:</b> 1209 Mountain Road Pl NE, Suite R, Albuquerque, NM 87110
</p></p><b> By using Square Trivia, you acknowledge that you have <b>read</b>, <b>understood</b>, and <b>agree</b> to be bound by these Terms of Service.</b>`,
  },
];

export const skillCertification = [
  {
    heading: "Legal Classification",
    isCheckCircle: false,
    subHeading:
      "Square Trivia qualifies as a <b>skill-based competition</b> under U.S. law because winners are determined entirely by participants' <b>knowledge</b> and <b>speed</b> in answering trivia questions, with no element of chance involved in the outcome determination.",
    footer: "",
  },
  {
    heading: "Key Skill Elements",
    isCheckCircle: true,
    listItems: [
      {
        text: "<b>Knowledge:</b> Correct answers require sports knowledge",
      },
      {
        text: "<b>Speed:</b> Faster correct answers win competitions",
      },
      {
        text: "<b>Strategy:</b> Square selection requires strategic thinking",
      },
      {
        text: "<b>Practice:</b> Performance improves with experience",
      },
    ],
    footer: "",
  },
  {
    heading: "No Element of Chance",
    subHeading:
      "Unlike traditional squares games where winners are randomly determined by score combinations, Square Trivia ensures that:",
    isCheckCircle: false,
    listItems: [
      {
        text: "Winners are determined by <b>measurable skill metrics</b>",
      },
      {
        text: "Answer times are objectively recorded to <b>milliseconds</b>",
      },
      {
        text: "No random number generators or chance mechanics",
      },
      {
        text: "Skill directly correlates with <b>success rate</b>",
      },
    ],
    footer: "",
  },
  {
    heading: "Alternative Method of Entry (AMOE)",
    isCheckCircle: false,
    subHeading:
      "In compliance with skill-based competition regulations, Square Trivia offers a free alternative method of entry via mail-in request, ensuring no purchase is necessary to participate or win.",
    footer: "",
  },
];
