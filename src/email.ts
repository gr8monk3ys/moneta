import nodemailer from 'nodemailer';
import { ApiError } from './errors.js';
import { logInfo } from './logger.js';

export interface EmailService {
  sendPasswordResetCode(input: { to: string; code: string; expiresAt: string }): Promise<void>;
}

function isNonEmptyString(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function createEmailService(options: { nodeEnv: string }): EmailService {
  const nodeEnv = options.nodeEnv;
  const host = process.env.SMTP_HOST?.trim();

  if (!isNonEmptyString(host)) {
    if (nodeEnv === 'production') {
      // EMAIL_DELIVERY=disabled is a deliberate launch posture, not a default:
      // the app ships, and password reset alone reports itself unavailable
      // until SMTP credentials land. Anything else stays a boot failure.
      if (process.env.EMAIL_DELIVERY?.trim().toLowerCase() === 'disabled') {
        logInfo({ message: 'EMAIL_DELIVERY=disabled: password reset emails are unavailable until SMTP is configured' });
        return {
          sendPasswordResetCode: async () => {
            throw new ApiError(503, 'Password reset email is not available yet. Contact support.');
          }
        };
      }

      throw new Error('SMTP_HOST must be set in production to enable password reset emails (or set EMAIL_DELIVERY=disabled to launch without it)');
    }

    return {
      sendPasswordResetCode: async ({ to, code, expiresAt }) => {
        logInfo({
          message: 'password_reset_email',
          to,
          code,
          expiresAt,
          note: 'SMTP is not configured; using console email service.'
        });
      }
    };
  }

  const port = Number(process.env.SMTP_PORT ?? 587);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error('SMTP_PORT must be a valid number');
  }

  const secure = (process.env.SMTP_SECURE ?? '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim();

  if (nodeEnv === 'production') {
    if (!isNonEmptyString(from)) {
      throw new Error('SMTP_FROM must be set in production');
    }
    if (!isNonEmptyString(user) || !isNonEmptyString(pass)) {
      throw new Error('SMTP_USER and SMTP_PASS must be set in production');
    }
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure,
    ...(isNonEmptyString(user) && isNonEmptyString(pass) ? { auth: { user, pass } } : {})
  });

  return {
    sendPasswordResetCode: async ({ to, code, expiresAt }) => {
      const expiresLabel = new Date(expiresAt).toLocaleString('en-US', { timeZone: 'UTC' });
      await transport.sendMail({
        from: from || 'no-reply@moneta.local',
        to,
        subject: 'Moneta password reset code',
        text: [
          'Your Moneta password reset code:',
          '',
          code,
          '',
          `This code expires at ${expiresLabel} UTC.`,
          'If you did not request this, you can ignore this email.'
        ].join('\n')
      });
    }
  };
}

