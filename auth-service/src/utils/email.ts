import nodemailer from 'nodemailer';
import { logger } from './logger';

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!EMAIL_USER || !EMAIL_PASSWORD) {
      logger.warn('Email credentials not configured. Email sending will be disabled.');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });

    logger.info(`Email transporter created: ${EMAIL_HOST}:${EMAIL_PORT}`);
  }

  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transport = getTransporter();

  if (!transport) {
    logger.warn(`Email not sent (no transporter): ${options.to} - ${options.subject}`);
    return;
  }

  try {
    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    logger.info(`Email sent: ${info.messageId} to ${options.to}`);
  } catch (error: any) {
    logger.error(`Failed to send email to ${options.to}:`, error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const subject = '[도아마켓] 이메일 인증 코드';
  const text = `안녕하세요,\n\n이메일 인증 코드: ${code}\n\n이 코드는 10분간 유효합니다.\n\n감사합니다.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4CAF50;">이메일 인증 코드</h2>
      <p>안녕하세요,</p>
      <p>도아마켓 이메일 인증을 위한 코드입니다:</p>
      <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 5px; margin: 0;">${code}</h1>
      </div>
      <p>이 코드는 <strong>10분간 유효</strong>합니다.</p>
      <p>본인이 요청하지 않은 경우, 이 메일을 무시하셔도 됩니다.</p>
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">본 메일은 발신 전용입니다.</p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
