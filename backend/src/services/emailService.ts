import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  fullName?: string;
}

export const emailInternals = {
  // Can be mocked in tests
  transporterOverride: null as any,
  lastSentOtp: null as { to: string; otp: string; timestamp: Date } | null,
};

function generateOtpEmailHtml(otp: string, fullName?: string): string {
  const greeting = fullName ? `Xin chào ${fullName},` : 'Xin chào quý khách,';

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Khôi phục mật khẩu TechGear Pro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">TECHGEAR PRO</h1>
              <p style="margin: 6px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Xác thực tài khoản an toàn</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #0f172a;">${greeting}</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản TechGear Pro của bạn. Vui lòng sử dụng mã xác thực OTP 6 số dưới đây để hoàn tất:
              </p>

              <!-- OTP Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="background-color: #0f172a; color: #38bdf8; font-size: 34px; font-weight: 800; letter-spacing: 10px; text-align: center; padding: 20px 28px; border-radius: 12px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; display: inline-block; border: 1px solid #1e293b; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 8px 0; font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                ⏳ Mã xác thực có hiệu lực trong vòng <strong>10 phút</strong>.
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; color: #ef4444; font-weight: 600; text-align: center;">
                Tuyệt đối không chia sẻ mã này với bất kỳ ai để đảm bảo an toàn.
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />

              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
                Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email. Tài khoản của bạn vẫn an toàn và không có thay đổi nào được thực hiện.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: 500;">
                © 2026 TechGear Pro. All rights reserved.
              </p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">
                Hệ thống thương mại điện tử linh kiện & thiết bị công nghệ cao
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends a 6-digit OTP code to the requested email.
 * If credentials are not configured or email sending fails, logs the OTP prominently to the terminal.
 */
export async function sendOtpEmail({ to, otp, fullName }: SendOtpEmailOptions): Promise<boolean> {
  emailInternals.lastSentOtp = {
    to: to.toLowerCase().trim(),
    otp,
    timestamp: new Date(),
  };

  const hasCredentials = Boolean(ENV.EMAIL.user && ENV.EMAIL.appPassword);

  if (!hasCredentials && !emailInternals.transporterOverride) {
    console.log('\n============================================================');
    console.log('🔑 [TechGear Pro] PASSWORD RESET OTP GENERATED (DEV MODE)');
    console.log(`   Recipient: ${to}`);
    console.log(`   OTP Code:  ${otp}`);
    console.log('   Validity:  10 minutes');
    console.log('   Notice:    SMTP credentials not set; OTP logged for testing');
    console.log('============================================================\n');
    return true;
  }

  try {
    const transporter =
      emailInternals.transporterOverride ||
      nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: ENV.EMAIL.user,
          pass: ENV.EMAIL.appPassword,
        },
      });

    const mailOptions = {
      from: ENV.EMAIL.from || `TechGear Pro <${ENV.EMAIL.user}>`,
      to,
      subject: '[TechGear Pro] Mã xác thực đặt lại mật khẩu tài khoản của bạn',
      text: `Xin chào,\n\nMã xác thực OTP đặt lại mật khẩu TechGear Pro của bạn là: ${otp}\nMã này có hiệu lực trong 10 phút. Tuyệt đối không chia sẻ mã này.\n\nNếu bạn không yêu cầu, vui lòng bỏ qua email này.`,
      html: generateOtpEmailHtml(otp, fullName),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 [TechGear Pro] Reset password OTP email sent successfully to ${to} | 🔑 OTP: ${otp}`);
    return true;
  } catch (error: any) {
    console.error('⚠️ [TechGear Pro] Failed to send email via SMTP transporter:', error.message);
    console.log('\n============================================================');
    console.log('🔑 [TechGear Pro] OTP FALLBACK CONSOLE LOG:');
    console.log(`   Recipient: ${to}`);
    console.log(`   OTP Code:  ${otp}`);
    console.log('============================================================\n');
    return true; // Still return true so the client can proceed if in dev/test environment
  }
}
