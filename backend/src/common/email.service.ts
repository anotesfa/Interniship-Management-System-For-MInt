import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private getSmtpConfig() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      SMTP_PASSWORD,
      SMTP_FROM,
      EMAIL_FROM,
    } = process.env;

    const fromAddress = SMTP_FROM || EMAIL_FROM;
    const password = SMTP_PASS || SMTP_PASSWORD;

    return {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      password,
      fromAddress,
    };
  }

  private getMintLogoPath() {
    const logoCandidates = [
      path.resolve(process.cwd(), '..', 'frontend', 'public', 'assets', 'images', 'mint_logo.png'),
      path.resolve(process.cwd(), 'frontend', 'public', 'assets', 'images', 'mint_logo.png'),
    ];

    return logoCandidates.find((candidate) => fs.existsSync(candidate));
  }

  private getFrontendLoginUrl() {
    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      process.env.CLIENT_URL ||
      process.env.WEB_APP_URL;

    if (!baseUrl) {
      return null;
    }

    return `${baseUrl.replace(/\/$/, '')}/login`;
  }

  async sendCredentialsEmail(params: {
    to: string;
    studentName: string;
    username: string;
    temporaryPassword: string;
    roleLabel?: string;
  }) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, password, fromAddress } = this.getSmtpConfig();

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !password || !fromAddress) {
      this.logger.warn(
        `SMTP is not configured; skipping credentials email for ${params.to}`,
      );
      return false;
    }

    const logoPath = this.getMintLogoPath();
  const loginUrl = this.getFrontendLoginUrl();

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: password,
      },
    });

    const htmlLogo = logoPath
      ? `<img src="cid:mint-logo" alt="MInT" width="92" style="display:block;margin:0 auto 18px auto;" />`
      : '';

    await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: 'Your MInT Internship System login details',
      text: [
        `Hello ${params.studentName},`,
        '',
        `Your ${params.roleLabel || 'account'} has been created or approved.`,
        `Username: ${params.username}`,
        `Temporary password: ${params.temporaryPassword}`,
        '',
        'Use your username and temporary password to sign in, then change your password after the first login.',
        loginUrl ? `Login page: ${loginUrl}` : null,
      ].join('\n'),
      html: `
        <div style="background:#f4f7fb;padding:32px 16px;font-family:'Poppins','Segoe UI',Arial,sans-serif;color:#0f172a;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(15,32,64,0.08);">
            <div style="background:linear-gradient(135deg,#0F2040 0%,#1A3D6B 100%);padding:28px 24px;text-align:center;">
              ${htmlLogo}
              <div style="color:#e8eff8;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;">Ministry of Innovation and Technology</div>
              <div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:6px;">${params.roleLabel || 'System'} Credentials</div>
            </div>
            <div style="padding:30px 26px;line-height:1.7;">
              <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;">Hello ${params.studentName},</p>
              <p style="margin:0 0 16px 0;font-size:14px;font-weight:600;">Your account has been created and your secure login details are below.</p>
              <div style="background:#eef4fb;border:1px solid #d7e4f3;border-radius:16px;padding:18px 20px;margin:20px 0;">
                <p style="margin:0 0 10px 0;font-size:14px;font-weight:700;"><strong>Username:</strong> ${params.username}</p>
                <p style="margin:0;font-size:14px;font-weight:700;"><strong>Temporary password:</strong> ${params.temporaryPassword}</p>
              </div>
              ${loginUrl ? `<div style="text-align:center;margin:24px 0 18px 0;"><a href="${loginUrl}" style="display:inline-block;background:#0F2040;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:999px;">Sign in to the portal</a></div>` : ''}
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;">Use these credentials to sign in, then change your password after the first login.</p>
              ${loginUrl ? `<p style="margin:0 0 8px 0;font-size:13px;color:#475569;">Login page: <a href="${loginUrl}" style="color:#1A3D6B;text-decoration:none;">${loginUrl}</a></p>` : ''}
              <p style="margin:0;color:#475569;font-size:13px;font-weight:500;">If you did not expect this email, contact the university coordinator immediately.</p>
            </div>
          </div>
        </div>
      `,
      attachments: logoPath
        ? [
            {
              filename: 'mint_logo.png',
              path: logoPath,
              cid: 'mint-logo',
            },
          ]
        : [],
    });

    return true;
  }

    async sendStudentCredentialsEmail(params: {
      to: string;
      studentName: string;
      username: string;
      temporaryPassword: string;
    }) {
      return this.sendCredentialsEmail({
        ...params,
        roleLabel: 'Internship System',
      });
    }

  async sendEvaluationPublishedEmail(params: {
    to: string;
    studentName: string;
    grade: string;
    score?: number | null;
    supervisorName?: string | null;
  }) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, password, fromAddress } = this.getSmtpConfig();

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !password || !fromAddress) {
      this.logger.warn(
        `SMTP is not configured; skipping evaluation email for ${params.to}`,
      );
      return false;
    }

    const logoPath = this.getMintLogoPath();
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: password,
      },
    });

    const htmlLogo = logoPath
      ? `<img src="cid:mint-logo" alt="MInT" width="92" style="display:block;margin:0 auto 18px auto;" />`
      : '';

    const scoreText = Number.isFinite(params.score as number)
      ? `${Math.round(params.score as number)}/100`
      : 'N/A';

    await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: 'Your MInT internship evaluation has been published',
      text: [
        `Hello ${params.studentName},`,
        '',
        'Your internship evaluation has been published by MInT.',
        `Grade: ${params.grade}`,
        `Score: ${scoreText}`,
        params.supervisorName ? `Supervisor: ${params.supervisorName}` : null,
        '',
        'This result is now visible to you and your university coordinator in the system.',
      ].filter(Boolean).join('\n'),
      html: `
        <div style="background:#f4f7fb;padding:32px 16px;font-family:'Poppins','Segoe UI',Arial,sans-serif;color:#0f172a;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(15,32,64,0.08);">
            <div style="background:linear-gradient(135deg,#0F2040 0%,#1A3D6B 100%);padding:28px 24px;text-align:center;">
              ${htmlLogo}
              <div style="color:#e8eff8;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;">Ministry of Innovation and Technology</div>
              <div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:6px;">Evaluation Published</div>
            </div>
            <div style="padding:30px 26px;line-height:1.7;">
              <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;">Hello ${params.studentName},</p>
              <p style="margin:0 0 16px 0;font-size:14px;font-weight:600;">Your internship evaluation has been successfully published by MInT.</p>
              <div style="background:#eef4fb;border:1px solid #d7e4f3;border-radius:16px;padding:18px 20px;margin:20px 0;">
                <p style="margin:0 0 10px 0;font-size:14px;font-weight:700;"><strong>Final Grade:</strong> ${params.grade}</p>
                <p style="margin:0 0 10px 0;font-size:14px;font-weight:700;"><strong>Final Score:</strong> ${scoreText}</p>
                ${params.supervisorName ? `<p style="margin:0;font-size:14px;font-weight:600;"><strong>Supervisor:</strong> ${params.supervisorName}</p>` : ''}
              </div>
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;">This evaluation result is now visible to you and your university coordinator in the internship system.</p>
              <p style="margin:0;color:#475569;font-size:13px;font-weight:500;">If you have questions about this result, contact your university coordinator.</p>
            </div>
          </div>
        </div>
      `,
      attachments: logoPath
        ? [
            {
              filename: 'mint_logo.png',
              path: logoPath,
              cid: 'mint-logo',
            },
          ]
        : [],
    });

    return true;
  }

  async sendUniversityApprovalEmail(params: {
    to: string;
    contactName: string;
    universityName: string;
    username: string;
    temporaryPassword: string;
  }) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, password, fromAddress } = this.getSmtpConfig();

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !password || !fromAddress) {
      this.logger.warn(
        `SMTP is not configured; skipping university approval email for ${params.to}`,
      );
      return false;
    }

    const logoPath = this.getMintLogoPath();
    const loginUrl = this.getFrontendLoginUrl();
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: password,
      },
    });

    const htmlLogo = logoPath
      ? `<img src="cid:mint-logo" alt="MInT" width="92" style="display:block;margin:0 auto 18px auto;" />`
      : '';

    await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: 'University Approved - MInT Internship System Access',
      text: [
        `Hello ${params.contactName},`,
        '',
        `Your university ${params.universityName} has been approved and is ready for access.`,
        `Username: ${params.username}`,
        `Temporary password: ${params.temporaryPassword}`,
        '',
        'Use these credentials to sign in and access the university dashboard.',
        loginUrl ? `Login page: ${loginUrl}` : null,
      ].join('\n'),
      html: `
        <div style="background:#f4f7fb;padding:32px 16px;font-family:'Poppins','Segoe UI',Arial,sans-serif;color:#0f172a;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(15,32,64,0.08);">
            <div style="background:linear-gradient(135deg,#0F2040 0%,#1A3D6B 100%);padding:28px 24px;text-align:center;">
              ${htmlLogo}
              <div style="color:#e8eff8;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;">Ministry of Innovation and Technology</div>
              <div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:6px;">University Approved</div>
            </div>
            <div style="padding:30px 26px;line-height:1.7;">
              <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;">Hello ${params.contactName},</p>
              <p style="margin:0 0 16px 0;font-size:14px;font-weight:600;">Your university <strong>${params.universityName}</strong> has been approved for the MInT Internship Management System and your access is ready.</p>
              <div style="background:#eef4fb;border:1px solid #d7e4f3;border-radius:16px;padding:18px 20px;margin:20px 0;">
                <p style="margin:0 0 10px 0;font-size:14px;font-weight:700;"><strong>Username:</strong> ${params.username}</p>
                <p style="margin:0;font-size:14px;font-weight:700;"><strong>Temporary password:</strong> ${params.temporaryPassword}</p>
              </div>
              ${loginUrl ? `<div style="text-align:center;margin:24px 0 18px 0;"><a href="${loginUrl}" style="display:inline-block;background:#0F2040;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:999px;">Open university dashboard</a></div>` : ''}
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;">Use these credentials to sign in and submit bulk student applications.</p>
              ${loginUrl ? `<p style="margin:0 0 8px 0;font-size:13px;color:#475569;">Login page: <a href="${loginUrl}" style="color:#1A3D6B;text-decoration:none;">${loginUrl}</a></p>` : ''}
              <p style="margin:0;color:#475569;font-size:13px;font-weight:500;">Please change the password after your first login.</p>
            </div>
          </div>
        </div>
      `,
      attachments: logoPath
        ? [
            {
              filename: 'mint_logo.png',
              path: logoPath,
              cid: 'mint-logo',
            },
          ]
        : [],
    });

    return true;
  }

  async sendUniversityRejectionEmail(params: {
    to: string;
    contactName: string;
    universityName: string;
    rejectedReason: string;
  }) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, password, fromAddress } = this.getSmtpConfig();

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !password || !fromAddress) {
      this.logger.warn(
        `SMTP is not configured; skipping university rejection email for ${params.to}`,
      );
      return false;
    }

    const logoPath = this.getMintLogoPath();
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: password,
      },
    });

    const htmlLogo = logoPath
      ? `<img src="cid:mint-logo" alt="MInT" width="92" style="display:block;margin:0 auto 18px auto;" />`
      : '';

    await transporter.sendMail({
      from: fromAddress,
      to: params.to,
      subject: 'University Registration Update - MInT Internship System',
      text: [
        `Hello ${params.contactName},`,
        '',
        `Your university ${params.universityName} registration was not approved.`,
        `Reason: ${params.rejectedReason}`,
        '',
        'Please review the feedback and resubmit when ready.',
      ].join('\n'),
      html: `
        <div style="background:#f4f7fb;padding:32px 16px;font-family:'Poppins','Segoe UI',Arial,sans-serif;color:#0f172a;">
          <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(15,32,64,0.08);">
            <div style="background:linear-gradient(135deg,#DA121A 0%,#9f1239 100%);padding:28px 24px;text-align:center;">
              ${htmlLogo}
              <div style="color:#fee2e2;font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:800;">Ministry of Innovation and Technology</div>
              <div style="color:#ffffff;font-size:22px;font-weight:800;margin-top:6px;">University Registration Update</div>
            </div>
            <div style="padding:30px 26px;line-height:1.7;">
              <p style="margin:0 0 16px 0;font-size:15px;font-weight:700;">Hello ${params.contactName},</p>
              <p style="margin:0 0 16px 0;font-size:14px;font-weight:600;">Your university <strong>${params.universityName}</strong> registration was not approved at this time.</p>
              <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:16px;padding:18px 20px;margin:20px 0;">
                <p style="margin:0 0 8px 0;font-size:14px;font-weight:700;color:#9f1239;"><strong>Reason:</strong></p>
                <p style="margin:0;font-size:14px;font-weight:600;color:#7f1d1d;">${params.rejectedReason}</p>
              </div>
              <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;">Please review the feedback and resubmit if needed.</p>
              <p style="margin:0;color:#475569;font-size:13px;font-weight:500;">If you have questions, contact the administrator handling the review.</p>
            </div>
          </div>
        </div>
      `,
      attachments: logoPath
        ? [
            {
              filename: 'mint_logo.png',
              path: logoPath,
              cid: 'mint-logo',
            },
          ]
        : [],
    });

    return true;
  }

  /**
   * Generic email sending method
   */
  async send(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, password, fromAddress } = this.getSmtpConfig();

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !password || !fromAddress) {
      this.logger.warn(`SMTP is not configured; skipping email to ${params.to}`);
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: password,
      },
    });

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: params.to,
        subject: params.subject,
        text: params.text || params.html,
        html: params.html,
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${params.to}:`, error);
      return false;
    }
  }
}