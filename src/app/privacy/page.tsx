import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-pixel text-lg text-crt-amber text-glow-amber">
            PRIVACY POLICY
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Last updated: February 2025
          </p>
        </div>

        <div className="space-y-6 text-xs text-muted-foreground leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">1. Information We Collect</h2>
            <p>We collect the following information when you use Dope Wars:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Account data:</strong> Email address, username, and hashed password when you
                register
              </li>
              <li>
                <strong>Game data:</strong> Game scores, session data, action logs for score
                validation, and leaderboard entries
              </li>
              <li>
                <strong>Payment data:</strong> When purchasing Pro, Stripe processes your payment.
                We receive your email and transaction details but never your card number
              </li>
              <li>
                <strong>Technical data:</strong> Standard web server logs including IP address,
                browser type, and access times
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To provide and operate the Game</li>
              <li>To display your username on leaderboards</li>
              <li>To process Pro membership payments</li>
              <li>To send transactional emails (account setup, purchase confirmation)</li>
              <li>To validate game scores and prevent cheating</li>
              <li>To improve the Game and fix bugs</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">3. Third-Party Services</h2>
            <p>We use the following third-party services to operate the Game:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Supabase:</strong> Database and authentication. Your account data and game
                data are stored on Supabase servers. See their{' '}
                <a href="https://supabase.com/privacy" className="text-crt-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
              </li>
              <li>
                <strong>Stripe:</strong> Payment processing for Pro membership. Stripe handles all
                payment card data. See their{' '}
                <a href="https://stripe.com/privacy" className="text-crt-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
              </li>
              <li>
                <strong>Resend:</strong> Transactional email delivery. Your email address is shared
                with Resend to send account-related emails. See their{' '}
                <a href="https://resend.com/legal/privacy-policy" className="text-crt-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
              </li>
              <li>
                <strong>Vercel:</strong> Hosting and deployment. See their{' '}
                <a href="https://vercel.com/legal/privacy-policy" className="text-crt-cyan hover:underline" target="_blank" rel="noopener noreferrer">
                  privacy policy
                </a>
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">4. Cookies</h2>
            <p>
              We use essential cookies for authentication (Supabase session cookies). These are
              required for the Game to function and to keep you logged in. We do not use
              advertising or tracking cookies.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">5. Data Retention</h2>
            <p>
              Your account data is retained for as long as your account exists. Game session data
              and leaderboard entries are retained indefinitely. If you delete your account,
              your personal data will be removed, but anonymized leaderboard entries may remain.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p>
              To exercise these rights, contact us at the email address provided on our website.
              We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">7. Data Security</h2>
            <p>
              We use industry-standard security measures to protect your data. Passwords are hashed
              and never stored in plain text. Payment processing is handled entirely by Stripe.
              All data is transmitted over HTTPS.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">8. Children&apos;s Privacy</h2>
            <p>
              Dope Wars is not intended for children under 13. We do not knowingly collect personal
              information from children under 13. If you believe a child under 13 has provided us
              with personal data, please contact us and we will delete it.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify registered users
              of significant changes via email. The &quot;last updated&quot; date at the top reflects the
              most recent revision.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm text-foreground font-bold">10. Contact</h2>
            <p>
              For privacy-related questions, data requests, or concerns, please contact us at the
              email address provided on our website.
            </p>
          </section>
        </div>

        <div className="pt-4 space-y-3">
          <Link
            href="/terms"
            className="text-xs text-crt-cyan hover:underline block text-center"
          >
            Terms of Service
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
