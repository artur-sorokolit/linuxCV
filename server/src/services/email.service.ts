import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

interface ContactEmailData {
  name: string;
  email: string;
  message: string;
}

export class EmailService {
  private recipientEmail: string;

  constructor() {
    this.recipientEmail = process.env.GMAIL_USER || '';
  }

  async sendContactNotification(data: ContactEmailData): Promise<void> {
    const { name, email, message } = data;

    const mailOptions = {
      from: `"LinuxCV Contact Form" <${this.recipientEmail}>`,
      to: this.recipientEmail,
      replyTo: email,
      subject: `📬 Нове повідомлення від ${name}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px 32px;">
            <h1 style="margin: 0; font-size: 22px; color: #ffffff;">📬 Нове повідомлення з контактної форми</h1>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr>
                <td style="padding: 12px 16px; background: #16213e; border-radius: 8px 8px 0 0; font-weight: 600; color: #a78bfa; width: 100px;">Ім'я</td>
                <td style="padding: 12px 16px; background: #16213e; border-radius: 8px 8px 0 0;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 16px; background: #1a1a3e; font-weight: 600; color: #a78bfa;">Email</td>
                <td style="padding: 12px 16px; background: #1a1a3e;">
                  <a href="mailto:${email}" style="color: #667eea; text-decoration: none;">${email}</a>
                </td>
              </tr>
            </table>
            <div style="background: #16213e; border-radius: 8px; padding: 20px; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 8px 0; font-weight: 600; color: #a78bfa;">Повідомлення:</p>
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            <p style="margin-top: 24px; font-size: 13px; color: #666; text-align: center;">
              Ви можете відповісти напряму, натиснувши Reply — лист відправиться на <strong>${email}</strong>
            </p>
          </div>
        </div>
      `,
    };

    console.log(`📧 Sending contact email notification from ${name} (${email}) to ${this.recipientEmail}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`🎉 Email sent successfully! Message ID: ${info.messageId}`);
  }
}

export const emailService = new EmailService();
