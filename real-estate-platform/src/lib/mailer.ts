import nodemailer from 'nodemailer';
import { formatOtpForDisplay, OTP_EXPIRY_MINUTES } from './otp';

// ============================================
// EMAIL SERVICE DETECTION
// ============================================
export function isEmailServiceConfigured(): boolean {
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasSmtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  return hasResend || hasSmtp;
}

// ============================================
// RESEND HTTP API (preferred — free tier)
// ============================================
async function sendViaResend(options: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY!;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: options.from,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend API error ${res.status}: ${JSON.stringify(err)}`);
  }
}

// ============================================
// NODEMAILER SMTP (fallback)
// ============================================
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return transporter;
}

// ============================================
// EMAIL TYPES
// ============================================
export interface SendOtpEmailOptions {
  to: string;
  name: string;
  otp: string;
  locale?: 'ar' | 'en';
}

// ============================================
// OTP EMAIL TEMPLATE
// ============================================
function buildOtpEmailHtml(name: string, otp: string, locale: 'ar' | 'en'): string {
  const isAr = locale === 'ar';
  const dir = isAr ? 'rtl' : 'ltr';
  const formattedOtp = formatOtpForDisplay(otp);
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'عقارات السعودية';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const content = isAr
    ? {
        greeting: `مرحباً ${name}،`,
        intro: 'شكراً لتسجيلك في منصة عقارات السعودية. لإتمام التحقق من بريدك الإلكتروني، يرجى استخدام رمز التحقق التالي:',
        otpLabel: 'رمز التحقق',
        expiry: `ينتهي صلاحية هذا الرمز خلال <strong>${OTP_EXPIRY_MINUTES} دقائق</strong>.`,
        warning: 'إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني. لا تشارك هذا الرمز مع أي شخص.',
        security: '🔒 لأسباب أمنية، لن يطلب منك فريقنا أبداً هذا الرمز عبر الهاتف أو البريد الإلكتروني.',
        footer: `© ${new Date().getFullYear()} ${appName}. جميع الحقوق محفوظة.`,
        btnText: 'زيارة الموقع',
      }
    : {
        greeting: `Hello ${name},`,
        intro: 'Thank you for registering with Saudi Real Estate. To complete your email verification, please use the following OTP code:',
        otpLabel: 'Verification Code',
        expiry: `This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.`,
        warning: 'If you did not request this code, please ignore this email. Never share this code with anyone.',
        security: '🔒 For security reasons, our team will never ask for this code via phone or email.',
        footer: `© ${new Date().getFullYear()} ${appName}. All rights reserved.`,
        btnText: 'Visit Website',
      };

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isAr ? 'رمز التحقق' : 'Email Verification'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: ${isAr ? "'Segoe UI', Tahoma, Arial" : "'Segoe UI', Roboto, Arial"}, sans-serif;
      background-color: #f0f4f8;
      color: #1e293b;
      direction: ${dir};
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #072849 0%, #0c8fe7 100%);
      padding: 36px 40px;
      text-align: center;
    }
    .header-logo {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .header-tagline {
      font-size: 13px;
      color: rgba(255,255,255,0.75);
      margin-top: 4px;
    }
    .body {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 16px;
    }
    .intro {
      font-size: 15px;
      color: #475569;
      line-height: 1.7;
      margin-bottom: 32px;
    }
    .otp-container {
      background: linear-gradient(135deg, #f0f7ff 0%, #e0effe 100%);
      border: 2px solid #bae0fd;
      border-radius: 16px;
      padding: 32px;
      text-align: center;
      margin-bottom: 32px;
    }
    .otp-label {
      font-size: 13px;
      font-weight: 600;
      color: #0070c5;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-bottom: 16px;
    }
    .otp-code {
      font-size: 48px;
      font-weight: 800;
      color: #072849;
      letter-spacing: 12px;
      font-family: 'Courier New', Courier, monospace;
      line-height: 1;
    }
    .otp-expiry {
      font-size: 13px;
      color: #64748b;
      margin-top: 16px;
    }
    .warning-box {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 24px;
    }
    .warning-text {
      font-size: 13px;
      color: #92400e;
      line-height: 1.6;
    }
    .security-note {
      font-size: 13px;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .btn-container {
      text-align: center;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #0070c5 0%, #0c8fe7 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
    }
    .divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 0 0 24px;
    }
    .footer {
      background: #f8fafc;
      padding: 24px 40px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer-text {
      font-size: 12px;
      color: #94a3b8;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">${appName}</div>
      <div class="header-tagline">${isAr ? 'منصتك العقارية الأولى' : 'Your Premier Real Estate Platform'}</div>
    </div>

    <!-- Body -->
    <div class="body">
      <p class="greeting">${content.greeting}</p>
      <p class="intro">${content.intro}</p>

      <!-- OTP Box -->
      <div class="otp-container">
        <div class="otp-label">${content.otpLabel}</div>
        <div class="otp-code">${formattedOtp}</div>
        <div class="otp-expiry">${content.expiry}</div>
      </div>

      <!-- Warning -->
      <div class="warning-box">
        <p class="warning-text">⚠️ ${content.warning}</p>
      </div>

      <!-- Security Note -->
      <p class="security-note">${content.security}</p>

      <!-- CTA Button -->
      <div class="btn-container">
        <a href="${appUrl}" class="btn">${content.btnText}</a>
      </div>

      <hr class="divider" />
    </div>

    <!-- Footer -->
    <div class="footer">
      <p class="footer-text">${content.footer}</p>
      <p class="footer-text" style="margin-top: 4px;">
        ${isAr ? 'هذا البريد الإلكتروني تم إرساله تلقائياً، يرجى عدم الرد عليه.' : 'This is an automated email, please do not reply.'}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================
// SEND OTP EMAIL — uses Resend if configured, falls back to SMTP
// ============================================
export async function sendOtpEmail({
  to,
  name,
  otp,
  locale = 'ar',
}: SendOtpEmailOptions): Promise<void> {
  const isAr = locale === 'ar';
  const subject = isAr
    ? `رمز التحقق من بريدك الإلكتروني - ${formatOtpForDisplay(otp)}`
    : `Email Verification Code - ${formatOtpForDisplay(otp)}`;

  const html = buildOtpEmailHtml(name, otp, locale);
  const text = isAr
    ? `مرحباً ${name}،\n\nرمز التحقق الخاص بك هو: ${otp}\n\nينتهي خلال ${OTP_EXPIRY_MINUTES} دقائق.\n\nلا تشارك هذا الرمز مع أي شخص.`
    : `Hello ${name},\n\nYour verification code is: ${otp}\n\nExpires in ${OTP_EXPIRY_MINUTES} minutes.\n\nNever share this code with anyone.`;

  const from =
    process.env.SMTP_FROM ||
    process.env.RESEND_FROM ||
    `"عقارات السعودية" <onboarding@resend.dev>`;

  // ── Priority 1: Resend API ──
  if (process.env.RESEND_API_KEY) {
    await sendViaResend({ from, to, subject, html, text });
    return;
  }

  // ── Priority 2: SMTP (nodemailer) ──
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transport = getTransporter();
    await transport.sendMail({
      from,
      to,
      subject,
      html,
      text,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'Saudi Real Estate Platform',
      },
    });
    return;
  }

  // ── No email service configured ──
  throw new Error('NO_EMAIL_SERVICE: No email provider configured (RESEND_API_KEY or SMTP_USER/SMTP_PASS required)');
}

// ============================================
// VERIFY EMAIL SERVICE (health check)
// ============================================
export async function verifySmtpConnection(): Promise<boolean> {
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  try {
    const transport = getTransporter();
    await transport.verify();
    return true;
  } catch {
    return false;
  }
}
