// ---------------------------------------------------------------------------
// Dope Wars — Email Templates
// Shared HTML email builders for transactional emails (Resend)
// ---------------------------------------------------------------------------

interface ProWelcomeEmailParams {
  appUrl: string;
  isExistingUser: boolean;
  sessionId?: string;
}

interface TestEmailParams {
  fromEmail: string;
  sentAt: string;
}

// Inline color constants — email clients don't support CSS variables
const C = {
  bgDark: '#0a0a0a',
  card: '#111111',
  border: '#222222',
  borderStrong: '#333333',
  cyan: '#00ffcc',
  amber: '#ffaa00',
  green: '#33ff33',
  textPrimary: '#e0e0e0',
  textMuted: '#888888',
  textDim: '#555555',
} as const;

const FONT_PIXEL = "'Press Start 2P', 'Courier New', monospace";
const FONT_BODY = "'Courier New', Consolas, 'Liberation Mono', monospace";

// ---------------------------------------------------------------------------
// Shell — DOCTYPE, <head> with font import, dark-mode meta, centered table
// ---------------------------------------------------------------------------

function emailShell(innerContent: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>Dope Wars</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: 'Courier New', Consolas, monospace !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-spacing: 0; border-collapse: collapse; }
    td { padding: 0; }
    img { border: 0; display: block; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${C.bgDark}; font-family: ${FONT_BODY}; color: ${C.textPrimary}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${C.bgDark};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%;">
${innerContent}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cardRow(content: string, borderColor: string = C.border): string {
  return `
          <tr>
            <td style="padding-bottom: 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${C.card}; border: 1px solid ${borderColor};">
                <tr>
                  <td style="padding: 24px;">
${content}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function ctaButtonRow(label: string, href: string): string {
  return `
          <tr>
            <td style="padding-bottom: 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:52px;v-text-anchor:middle;width:480px;" arcsize="0%" fillcolor="${C.cyan}" stroke="f">
                      <w:anchorlock/>
                      <center style="color:${C.bgDark};font-family:'Courier New',monospace;font-size:14px;font-weight:bold;">${label}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${href}" target="_blank" style="display: block; width: 100%; background-color: ${C.cyan}; color: ${C.bgDark}; font-family: ${FONT_PIXEL}; font-size: 13px; font-weight: bold; text-align: center; text-decoration: none; padding: 16px 24px; border: 2px solid ${C.cyan}; box-sizing: border-box; letter-spacing: 0.05em;">
                      ${label}
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

// ---------------------------------------------------------------------------
// Pro Welcome Email
// ---------------------------------------------------------------------------

export function buildProWelcomeEmail({ appUrl, isExistingUser, sessionId }: ProWelcomeEmailParams): string {
  const ctaLabel = isExistingUser ? '&#9654; PLAY NOW' : '&#9654; CREATE YOUR ACCOUNT';
  const ctaUrl = isExistingUser
    ? `${appUrl}/game`
    : `${appUrl}/setup-account?session_id=${sessionId}`;

  // ── Header ──
  const header = cardRow(`
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <span style="font-family: ${FONT_PIXEL}; font-size: 10px; color: ${C.cyan}; letter-spacing: 0.15em;">&gt; &gt; &gt;</span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 4px;">
                          <h1 style="margin: 0; font-family: ${FONT_PIXEL}; font-size: 22px; color: ${C.cyan}; letter-spacing: 0.05em; line-height: 1.4;">DOPE WARS</h1>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom: 8px;">
                          <span style="font-family: ${FONT_PIXEL}; font-size: 10px; color: ${C.cyan}; letter-spacing: 0.15em;">&lt; &lt; &lt;</span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="border-top: 1px solid ${C.border}; padding-top: 16px;">
                          <span style="font-family: ${FONT_PIXEL}; font-size: 12px; color: ${C.amber}; letter-spacing: 0.1em;">&#9733; PRO UNLOCKED &#9733;</span>
                        </td>
                      </tr>
                    </table>`,
    C.borderStrong,
  );

  // ── Payment card ──
  const payment = cardRow(`
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 16px; border-bottom: 1px solid ${C.border};">
                          <span style="font-family: ${FONT_PIXEL}; font-size: 10px; color: ${C.textMuted}; letter-spacing: 0.05em;">PAYMENT CONFIRMED</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.textMuted}; padding-bottom: 8px;">Amount</td>
                              <td align="right" style="font-family: ${FONT_PIXEL}; font-size: 14px; color: ${C.amber}; padding-bottom: 8px;">$7.99</td>
                            </tr>
                            <tr>
                              <td style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.textMuted}; padding-bottom: 8px;">Type</td>
                              <td align="right" style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.textPrimary}; padding-bottom: 8px;">One-time payment</td>
                            </tr>
                            <tr>
                              <td style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.textMuted};">Status</td>
                              <td align="right" style="font-family: ${FONT_PIXEL}; font-size: 10px; color: ${C.green}; letter-spacing: 0.05em;">COMPLETED</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>`,
  );

  // ── Features card ──
  const features = [
    'Choose your campaign: 30, 45, or 60 days',
    'Buy a Lab &mdash; cut drugs for 2x profit',
    'Build a Warehouse for bulk storage',
    'Unlock Plane routes to Miami, LA &amp; Medellin',
    'Buy a Plantation in Colombia',
    'Collect weapons &amp; survive DEA raids',
    'Compete on the Pro Leaderboards',
  ];

  const featureRows = features
    .map(
      (f) => `
                            <tr>
                              <td width="20" valign="top" style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.amber}; padding-bottom: 10px; padding-right: 8px;">+</td>
                              <td style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.textPrimary}; padding-bottom: 10px; line-height: 1.5;">${f}</td>
                            </tr>`,
    )
    .join('');

  const featuresCard = cardRow(`
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-bottom: 16px; border-bottom: 1px solid ${C.border};">
                          <span style="font-family: ${FONT_PIXEL}; font-size: 10px; color: ${C.textMuted}; letter-spacing: 0.05em;">YOUR PRO FEATURES</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 16px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${featureRows}
                          </table>
                        </td>
                      </tr>
                    </table>`,
  );

  // ── Context message ──
  const contextText = isExistingUser
    ? 'Your account has been upgraded. All Pro features are now active.'
    : 'Create your account to start playing with all Pro features unlocked.';

  const contextRow = `
          <tr>
            <td align="center" style="padding-bottom: 20px;">
              <span style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.textMuted};">${contextText}</span>
            </td>
          </tr>`;

  // ── Footer ──
  const footer = `
          <tr>
            <td align="center" style="padding-top: 16px; border-top: 1px solid ${C.border};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <span style="font-family: ${FONT_BODY}; font-size: 11px; color: ${C.textDim};">No subscription. Pay once, play forever.</span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <span style="font-family: ${FONT_BODY}; font-size: 11px; color: ${C.textDim};">Secure payment processed by Stripe.</span>
                  </td>
                </tr>${!isExistingUser ? `
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="font-family: ${FONT_BODY}; font-size: 11px; color: ${C.textDim};">If you already set up your account, you can ignore this email.</span>
                  </td>
                </tr>` : ''}
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="font-family: ${FONT_BODY}; font-size: 10px; color: ${C.textDim};">&copy; ${new Date().getFullYear()} playdopewars.com</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;

  return emailShell(`
${header}
${payment}
${featuresCard}
${contextRow}
${ctaButtonRow(ctaLabel, ctaUrl)}
${footer}`);
}

// ---------------------------------------------------------------------------
// Test Email
// ---------------------------------------------------------------------------

export function buildTestEmail({ fromEmail, sentAt }: TestEmailParams): string {
  return emailShell(
    cardRow(`
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom: 16px;">
                          <h1 style="margin: 0; font-family: ${FONT_PIXEL}; font-size: 18px; color: ${C.cyan}; letter-spacing: 0.05em;">DOPE WARS</h1>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="border-top: 1px solid ${C.border}; padding-top: 16px; padding-bottom: 16px;">
                          <span style="font-family: ${FONT_PIXEL}; font-size: 11px; color: ${C.amber}; letter-spacing: 0.05em;">TEST EMAIL</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-family: ${FONT_BODY}; font-size: 13px; color: ${C.textPrimary}; padding-bottom: 12px; line-height: 1.5;">
                          If you&#39;re reading this, Resend is working correctly.
                        </td>
                      </tr>
                      <tr>
                        <td style="border-top: 1px solid ${C.border}; padding-top: 12px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="font-family: ${FONT_BODY}; font-size: 11px; color: ${C.textDim};">From: ${fromEmail}</td>
                            </tr>
                            <tr>
                              <td style="font-family: ${FONT_BODY}; font-size: 11px; color: ${C.textDim}; padding-top: 4px;">Sent: ${sentAt}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>`,
      C.borderStrong,
    ),
  );
}
