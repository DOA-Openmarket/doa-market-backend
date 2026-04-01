import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { logger } from '../utils/logger';

export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@xn--9m1b13r66n.com';

    // Initialize SES client with AWS profile for development
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      ...(process.env.AWS_PROFILE && {
        credentials: undefined, // AWS SDK will use the profile from environment
      }),
    });
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const subject = '[DOA Market] 회원가입 이메일 인증 코드';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #1D4ED8;
            }
            .code-box {
              background-color: #1D4ED8;
              color: white;
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              padding: 20px;
              border-radius: 8px;
              letter-spacing: 8px;
              margin: 30px 0;
              font-family: 'Courier New', monospace;
            }
            .info {
              background-color: #f0f7ff;
              border-left: 4px solid #1D4ED8;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .content {
              font-size: 16px;
              line-height: 1.8;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 12px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #1D4ED8; margin: 0; font-size: 28px;">DOA Market</h1>
              <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">회원가입 인증</p>
            </div>

            <div class="content">
              <p>안녕하세요,</p>
              <p>DOA Market 회원가입을 환영합니다.</p>
              <p>회원가입을 완료하시려면 아래의 인증 코드를 입력해주세요.</p>

              <div class="code-box">${code}</div>

              <div class="info">
                <p style="margin: 5px 0;"><strong>유효시간:</strong> 10분</p>
                <p style="margin: 5px 0;"><strong>주의사항:</strong> 본인이 요청하지 않은 경우 이 이메일을 무시하세요.</p>
              </div>

              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                본 인증 코드는 회원가입 시에만 사용 가능하며, 타인에게 공유하지 마세요.
              </p>
            </div>

            <div class="footer">
              <p>본 메일은 발신전용 메일입니다.</p>
              <p style="margin-top: 5px;">© 2026 DOA Market. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
DOA Market 이메일 인증

안녕하세요,

DOA Market 회원가입을 위한 이메일 인증 코드입니다.

인증 코드: ${code}

유효시간: 10분
본인이 요청하지 않은 경우 이 이메일을 무시하세요.

© 2026 DOA Market. All rights reserved.
    `;

    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      const response = await this.sesClient.send(command);
      logger.info(`Email sent successfully to ${to}`, { messageId: response.MessageId });
    } catch (error: any) {
      logger.error('Failed to send email via SES', {
        error: error.message,
        to,
        code: error.Code,
      });
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const subject = '[DOA Market] 비밀번호 재설정 코드';
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .code-box {
              background-color: #DC2626;
              color: white;
              font-size: 32px;
              font-weight: bold;
              text-align: center;
              padding: 20px;
              border-radius: 8px;
              letter-spacing: 8px;
              margin: 20px 0;
            }
            .info {
              background-color: #fff;
              border-left: 4px solid #DC2626;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="color: #DC2626; margin: 0;">DOA Market</h1>
              <p style="color: #666; margin: 10px 0 0 0;">비밀번호 재설정</p>
            </div>

            <p>안녕하세요,</p>
            <p>비밀번호 재설정을 위한 인증 코드입니다.</p>
            <p>아래의 인증 코드를 입력해주세요:</p>

            <div class="code-box">${code}</div>

            <div class="info">
              <p style="margin: 0;"><strong>⏰ 유효시간:</strong> 10분</p>
              <p style="margin: 10px 0 0 0;"><strong>⚠️ 주의사항:</strong> 본인이 요청하지 않은 경우 즉시 비밀번호를 변경하세요.</p>
            </div>

            <div class="footer">
              <p>본 메일은 발신전용입니다.</p>
              <p>© 2026 DOA Market. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textBody = `
DOA Market 비밀번호 재설정

안녕하세요,

비밀번호 재설정을 위한 인증 코드입니다.

인증 코드: ${code}

유효시간: 10분
본인이 요청하지 않은 경우 즉시 비밀번호를 변경하세요.

© 2026 DOA Market. All rights reserved.
    `;

    try {
      const command = new SendEmailCommand({
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      });

      const response = await this.sesClient.send(command);
      logger.info(`Password reset email sent successfully to ${to}`, { messageId: response.MessageId });
    } catch (error: any) {
      logger.error('Failed to send password reset email via SES', {
        error: error.message,
        to,
        code: error.Code,
      });
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }
}

export default new EmailService();
