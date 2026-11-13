import nodemailer from 'nodemailer';

function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      params[key] = val;
    }
  }
  return params;
}

const params = parseArgs();
const recipient = params.to || params.email;
const otp = params.otp || params.code;
const displayName = params.name || 'there';

if (!recipient || !otp) {
  console.error(JSON.stringify({
    success: false,
    error: 'Missing required arguments: --to <email> and --otp <code>'
  }));
  process.exit(1);
}

const senderEmail = process.env.SMTP_USER || process.env.GMAIL_USER || 'prayagk806@gmail.com';
const appPassword = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD || '').replace(/\s+/g, '');

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your DAYFORM Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9fa; margin: 0; padding: 32px 16px; color: #1c2526; }
    .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e9eb; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 0.08em; color: #1e3a5f; margin-bottom: 24px; text-transform: uppercase; }
    h2 { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #0f172a; }
    p { font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 16px; }
    .otp-box { background: #f0f7ff; border: 2px dashed #0284c7; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0284c7; font-family: monospace; }
    .footer { margin-top: 28px; padding-top: 20px; border-top: 1px solid #edf2f7; font-size: 13px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">DAYFORM</div>
    <h2>Verify your email address</h2>
    <p>Hello ${displayName},</p>
    <p>Thank you for signing up for DAYFORM. Use the verification code below to complete your account registration:</p>
    <div class="otp-box">
      <div class="otp-code">${otp}</div>
    </div>
    <p>This code will expire in <strong>10 minutes</strong>. If you did not request this account creation, please ignore this email.</p>
    <div class="footer">
      <p style="margin: 0;">Sent via DAYFORM Mailer (${senderEmail})</p>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  if (!appPassword) {
    console.error(JSON.stringify({
      success: false,
      error: 'Gmail App Password is not configured for prayagk806@gmail.com. A 16-character Google App Password is required to send real emails to your Gmail inbox.'
    }));
    process.exit(1);
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: senderEmail,
        pass: appPassword
      }
    });

    const info = await transporter.sendMail({
      from: `"DAYFORM" <${senderEmail}>`,
      to: recipient,
      subject: `Your DAYFORM Verification Code: ${otp}`,
      text: `Hello ${displayName},\n\nYour DAYFORM verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nSent from ${senderEmail}`,
      html: htmlContent
    });

    console.log(JSON.stringify({
      success: true,
      simulated: false,
      messageId: info.messageId,
      sender: senderEmail,
      recipient
    }));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({
      success: false,
      error: err.message,
      sender: senderEmail,
      recipient
    }));
    process.exit(1);
  }
}

main();
