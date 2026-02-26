import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { buildTestEmail } from '@/lib/email-templates';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const to = request.nextUrl.searchParams.get('to');
  if (!to) {
    return NextResponse.json({ error: 'Missing ?to=email@example.com query param' }, { status: 400 });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Dope Wars <noreply@playdopewars.com>';

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: 'Dope Wars — Test Email',
      html: buildTestEmail({ fromEmail, sentAt: new Date().toISOString() }),
    });

    if (error) {
      return NextResponse.json({ success: false, error }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data?.id, from: fromEmail, to });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
