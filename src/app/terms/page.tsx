import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-pixel text-lg text-crt-amber text-glow-amber">
            TERMS OF SERVICE
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Last updated: September 18, 2026
          </p>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Dope Wars (&quot;the Game&quot;), you agree to be bound by these
              Terms of Service. If you do not agree, do not use the Game. We reserve the right to
              update these terms at any time. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">2. Description of Service</h2>
            <p>
              Dope Wars is a browser-based strategy game inspired by the classic 1984 game by
              John E. Dell. The Game is provided for entertainment purposes only. It is a work of
              fiction and does not promote or endorse any illegal activities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">3. Accounts</h2>
            <p>
              You may play and submit Classic scores as a guest using a public nickname, without
              an account. Guest names are not reserved and are marked as guests on the leaderboard.
              Pro score submission requires a Pro account. When you create an account, use a valid
              email address, username, and password, and keep your credentials confidential.
            </p>
            <p>
              You must provide accurate information. Usernames must be 3-20 characters and may
              contain letters, numbers, hyphens, and underscores. We reserve the right to remove
              accounts or scores with offensive or misleading names.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">4. Pro Membership</h2>
            <p>
              The Pro tier is available as a one-time payment of $7.99 USD. This grants permanent
              access to Pro features including extended game modes (45-day and 60-day campaigns),
              additional gameplay mechanics, and Pro leaderboards.
            </p>
            <p>
              Payments are processed securely through Stripe. We do not store your payment card
              information. All sales are final. Refunds may be considered on a case-by-case basis
              by contacting us within 14 days of purchase.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">5. Fair Play</h2>
            <p>
              Game scores are validated server-side through replay verification. Attempting to
              tamper with game data, submit fraudulent scores, exploit bugs, or use automated
              tools to gain an unfair advantage is strictly prohibited.
            </p>
            <p>
              We reserve the right to remove scores, suspend accounts, or ban users who violate
              fair play rules without notice or refund.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">6. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Reverse engineer, decompile, or exploit the Game</li>
              <li>Use bots, scripts, or automation tools</li>
              <li>Impersonate other players or staff</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">7. Intellectual Property</h2>
            <p>
              All content, graphics, code, and gameplay mechanics are our property or used under
              license. Dope Wars is inspired by the original 1984 public domain game. You may not
              reproduce, distribute, or create derivative works without our permission.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">8. Termination</h2>
            <p>
              We may suspend or terminate your access at any time for violations of these terms or
              any reason at our discretion. You may delete your account at any time by contacting us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">9. Disclaimer of Warranties</h2>
            <p>
              The Game is provided &quot;as is&quot; without warranties of any kind. We do not guarantee
              uninterrupted or error-free operation. Game data, including scores and progress, may
              be lost due to technical issues.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect,
              incidental, special, or consequential damages arising from your use of the Game.
              Our total liability shall not exceed the amount you paid for Pro membership.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">11. Contact</h2>
            <p>
              For questions about these terms, refund requests, or account issues, please contact
              us at the email address provided on our website.
            </p>
          </section>
        </div>

        <div className="pt-4 space-y-3">
          <Link
            href="/privacy"
            className="text-xs text-crt-cyan hover:underline block text-center"
          >
            Privacy Policy
          </Link>
          <Link
            href="/"
            className="retro-btn block w-full max-w-xs mx-auto py-3 text-xs text-center font-pixel"
          >
            BACK TO MENU
          </Link>
        </div>
      </div>
    </main>
  );
}
