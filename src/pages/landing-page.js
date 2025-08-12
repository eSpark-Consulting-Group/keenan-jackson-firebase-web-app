import { useState } from "react";
import "../styles/landing-page.css";

const Landing = () => {
//   const [activeFaq, setActiveFaq] = useState(null);

//   const toggleFaq = (index) => {
//     setActiveFaq(activeFaq === index ? null : index);
//   };

//   const squares = Array.from({ length: 50 }, (_, i) => ({
//     id: i,
//     active: Math.random() > 0.7,
//   }));

//   const faqData = [
//     {
//       question: "How is this different from gambling?",
//       answer:
//         "Square Trivia is 100% skill-based! Winners are determined by their sports knowledge and answer speed, not random chance. It's like a timed quiz competition with prizes - completely legal and based on your abilities.",
//     },
//     {
//       question: "Are there really NO FEES?",
//       answer:
//         "Yes! There are absolutely no fees to play or win. The entry amount you see is exactly what you pay, and the prize amount shown is exactly what you win. The only optional fee is 4% if you choose instant payout instead of waiting 2-3 days for the full amount.",
//     },
//     {
//       question: "How fast do I need to answer trivia questions?",
//       answer:
//         "Average winning times are between 2-5 seconds. The timer starts when the question appears, so quick reading and fast thinking are key! Practice makes perfect, and you'll get faster over time.",
//     },
//     {
//       question: "How do I know if my square wins?",
//       answer:
//         "Your square wins if its numbers match the last digits of the score in ANY order. For example, square (2,7) wins with scores like 12-17, 17-12, 22-7, or 7-32.",
//     },
//     {
//       question: "What happens if I lose on a winning square?",
//       answer:
//         "If your square wins but you had the slower answer time, you get consolation prizes! You'll receive free trivia questions that you can use to claim squares on $25 tier boards.",
//     },
//     {
//       question: "When and how do I get paid?",
//       answer:
//         "You can choose instant payout (96%) or wait 2-3 days for the full 100%. Payments are processed via your preferred method - we support multiple payout options!",
//     },
//   ];

  return (
    <>
 {/* <!-- Navigation --> */}
    <nav>
        <div class="nav-container">
            <div class="logo">🏈 Square Trivia</div>
            <div class="nav-links">
                <a href="#how-it-works">How It Works</a>
                <a href="#tiers">Pricing</a>
                <a href="#features">Features</a>
                <a href="#faq">FAQ</a>
                <a href="#" class="cta-button">Play Now</a>
            </div>
        </div>
    </nav>

    {/* <!-- Hero Section --> */}
    <section class="hero">
        <div class="hero-container">
            <div class="hero-content">
                <h1>Win Big with Your <span>Sports Knowledge</span></h1>
                <p class="hero-subtitle">The only skill-based sports squares platform where speed and knowledge determine winners!</p>
                
                <div class="hero-features">
                    <div class="feature-badge">NO FEES on Entry or Prizes</div>
                    <div class="feature-badge">100% Skill-Based</div>
                    <div class="feature-badge">Instant Payouts</div>
                </div>

                <div class="hero-cta">
                    <a href="#" class="cta-button">Start Playing Now</a>
                    <a href="#how-it-works" class="secondary-button">Learn More</a>
                </div>
            </div>

            <div class="hero-visual">
                <div class="game-board">
                    <div class="board-grid">
                        {/* <!-- Generate 50 squares --> */}
                        {/* <script>
                            document.write(Array(50).fill(0).map((_, i) => 
                                `<div class="square ${Math.random() > 0.7 ? 'active' : ''}">${i}</div>`
                            ).join(''));
                        </script> */}
                    </div>
                    <div class="board-stats">
                        <div class="stat">
                            <div class="stat-value">$800</div>
                            <div class="stat-label">Prize Pool</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">2.3s</div>
                            <div class="stat-label">Avg Win Time</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">47/50</div>
                            <div class="stat-label">Squares Filled</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    {/* <!-- How It Works Section --> */}
    <section id="how-it-works" class="how-it-works">
        <div class="section-header">
            <h2>How Square Trivia Works</h2>
            <p>Simple, fair, and rewarding - here's how you play and win!</p>
        </div>

        <div class="steps-container">
            <div class="step">
                <div class="step-number">1</div>
                <div class="step-icon">💰</div>
                <h3>Choose Your Tier</h3>
                <p>Select from 6 tiers starting at just $25. Higher tiers mean bigger prizes!</p>
            </div>

            <div class="step">
                <div class="step-number">2</div>
                <div class="step-icon">🧠</div>
                <h3>Answer Trivia</h3>
                <p>Test your sports knowledge with quick trivia questions. Correct answers earn square tokens!</p>
            </div>

            <div class="step">
                <div class="step-number">3</div>
                <div class="step-icon">🎯</div>
                <h3>Claim Your Square</h3>
                <p>Pick your lucky numbers on the game board. Each square holds up to 2 players.</p>
            </div>

            <div class="step">
                <div class="step-number">4</div>
                <div class="step-icon">⚡</div>
                <h3>Win by Speed</h3>
                <p>When your square hits, the fastest trivia answer wins! No luck, just skill.</p>
            </div>

            <div class="step">
                <div class="step-number">5</div>
                <div class="step-icon">💸</div>
                <h3>Get Paid Fast</h3>
                <p>Choose instant payout (96%) or wait 2-3 days for 100%. No hidden fees!</p>
            </div>
        </div>
    </section>

    {/* <!-- Tiers Section --> */}
    <section id="tiers" class="tiers">
        <div class="section-header">
            <h2>Choose Your Playing Tier</h2>
            <p>Guaranteed prizes every quarter - NO FEES on playing or winning!</p>
        </div>

        <div class="tiers-container">
            <div class="tier-card">
                <div class="tier-label">Starter</div>
                <div class="tier-amount">$25</div>
                <div class="tier-prize">Win $200/Quarter</div>
                <ul class="tier-features">
                    <li>$800 Total Prize Pool</li>
                    <li>Available All Games</li>
                    <li>1 Consolation Question</li>
                    <li>Perfect for Beginners</li>
                </ul>
                <a href="#" class="cta-button" style="width: 100%;">Get Started</a>
            </div>

            <div class="tier-card featured">
                <div class="tier-label">Most Popular</div>
                <div class="tier-amount">$100</div>
                <div class="tier-prize">Win $900/Quarter</div>
                <ul class="tier-features">
                    <li>$3,600 Total Prize Pool</li>
                    <li>Available All Games</li>
                    <li>1 Consolation Question</li>
                    <li>Best Value for Players</li>
                </ul>
                <a href="#" class="cta-button" style="width: 100%; background: var(--accent);">Get Started</a>
            </div>

            <div class="tier-card">
                <div class="tier-label">High Roller</div>
                <div class="tier-amount">$500</div>
                <div class="tier-prize">Win $4,500/Quarter</div>
                <ul class="tier-features">
                    <li>$18,000 Total Prize Pool</li>
                    <li>Playoffs & Championships</li>
                    <li>2 Consolation Questions</li>
                    <li>Serious Players Only</li>
                </ul>
                <a href="#" class="cta-button" style="width: 100%;">Get Started</a>
            </div>
        </div>
    </section>

    {/* <!-- Features Section --> */}
    <section id="features" class="features">
        <div class="section-header">
            <h2>Why Square Trivia is Different</h2>
            <p>We've revolutionized the traditional squares game with skill-based competition</p>
        </div>

        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🎯</div>
                <h3>100% Skill-Based</h3>
                <p>No random drawings or luck involved. Winners are determined purely by trivia knowledge and answer speed. Your sports expertise directly translates to wins!</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">💵</div>
                <h3>NO FEES Guaranteed</h3>
                <p>We mean it - no fees on entry or prizes! You pay exactly what you see, and win exactly what's advertised. The only optional fee is 4% for instant payouts.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">⏱️</div>
                <h3>Hidden Answer Times</h3>
                <p>Your trivia answer times stay private until a square wins. This prevents strategic avoidance and keeps competition fair and exciting for everyone.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">🏆</div>
                <h3>Consolation Prizes</h3>
                <p>Lost a speed competition? Get free trivia questions for future games! Higher tiers get more chances. We reward participation and keep you in the game.</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">⚡</div>
                <h3>Instant Payouts</h3>
                <p>Won big? Get 96% of your prize immediately with our express payout option, or wait 2-3 days for the full 100%. Your choice, your money!</p>
            </div>

            <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3>Multi-Platform Access</h3>
                <p>Play on web, get notifications via Telegram, track games on mobile. We're everywhere you are, making it easy to never miss a game or win!</p>
            </div>
        </div>
    </section>

    {/* <!-- FAQ Section --> */}
    <section id="faq" class="faq">
        <div class="section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about Square Trivia</p>
        </div>

        <div class="faq-container">
            <div class="faq-item">
                <div class="faq-question">
                    How is this different from gambling?
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    Square Trivia is 100% skill-based! Winners are determined by their sports knowledge and answer speed, not random chance. It's like a timed quiz competition with prizes - completely legal and based on your abilities.
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question">
                    Are there really NO FEES?
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    Yes! There are absolutely no fees to play or win. The entry amount you see is exactly what you pay, and the prize amount shown is exactly what you win. The only optional fee is 4% if you choose instant payout instead of waiting 2-3 days for the full amount.
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question">
                    How fast do I need to answer trivia questions?
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    Average winning times are between 2-5 seconds. The timer starts when the question appears, so quick reading and fast thinking are key! Practice makes perfect, and you'll get faster over time.
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question">
                    How do I know if my square wins?
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    Your square wins if its numbers match the last digits of the score in ANY order. For example, square (2,7) wins with scores like 12-17, 17-12, 22-7, or 7-32. Each square has two ways to win, doubling your chances!
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question">
                    What happens if I lose on a winning square?
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    If your square wins but you had the slower answer time, you get consolation prizes! You'll receive free trivia questions (1-4 depending on your tier) that you can use to claim squares on $25 tier boards. It's our way of keeping you in the game!
                </div>
            </div>

            <div class="faq-item">
                <div class="faq-question">
                    When and how do I get paid?
                    <span class="faq-toggle">+</span>
                </div>
                <div class="faq-answer">
                    You have two options: Choose instant payout to get 96% of your prize the same day (4% express service fee), or wait 2-3 days to receive the full 100% amount. Payments are processed via your preferred method - we support multiple payout options!
                </div>
            </div>
        </div>
    </section>

    {/* <!-- Final CTA --> */}
    <section class="final-cta">
        <h2>Ready to Turn Your Sports Knowledge into Cash?</h2>
        <p>Join thousands of sports fans winning with their trivia skills - NO FEES, just pure competition!</p>
        <a href="#" class="cta-button">Start Playing Now →</a>
    </section>

    {/* <!-- Footer --> */}
    <footer>
        <div class="footer-content">
            <div class="footer-links">
                <a href="#">Terms of Service</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Support</a>
                <a href="#">Contact</a>
            </div>
            <p>&copy; 2025 Square Trivia. All rights reserved. 18+ only.</p>
        </div>
    </footer>
    </>
  );
};

export default Landing;
