import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateOtp, createOtpToken } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otp = generateOtp();
    const { token, expiresAt } = createOtpToken(normalizedEmail, otp);

    const emailSubject = `${otp} is your ReConnect verification code`;
    const emailBodyText = `Hi,\n\nYour ReConnect verification code is:\n\n${otp}\n\nThis code will expire in 10 minutes. If you did not request this verification, you can safely ignore this email.\n\n— The ReConnect Team`;

    const emailBodyHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #12141C; background-color: #F7F4EC; border-radius: 12px; border: 1px solid rgba(18,20,28,0.1);">
        <div style="margin-bottom: 24px; text-align: center;">
          <h2 style="color: #12141C; font-size: 26px; margin: 0 0 6px 0; font-family: Georgia, serif; letter-spacing: -0.5px;">ReConnect</h2>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #8A6B37; margin: 0; font-weight: 600;">Identity Verification</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 28px 24px; border-radius: 10px; border: 1px solid rgba(18,20,28,0.08); text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
          <p style="font-size: 15px; line-height: 1.5; color: #4A4D63; margin-top: 0; margin-bottom: 20px;">
            Please use the following single-use verification code to complete your verification for <strong>${normalizedEmail}</strong>:
          </p>
          
          <div style="margin: 24px 0;">
            <span style="display: inline-block; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #12141C; background: #F7F4EC; border: 1px solid rgba(18,20,28,0.15); padding: 12px 28px; border-radius: 8px;">
              ${otp}
            </span>
          </div>

          <p style="font-size: 13px; color: #6C6F87; margin-bottom: 0;">
            This code expires in <strong>10 minutes</strong>. Never share this code with anyone.
          </p>
        </div>
        
        <div style="margin-top: 24px; text-align: center;">
          <p style="font-size: 11px; color: #8A8D9F; margin: 0;">
            If you did not request this code, no action is needed. Your account remains secure.
          </p>
        </div>
      </div>
    `;

    const hasSmtpConfig = Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    );

    if (hasSmtpConfig) {
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const isGmail = process.env.SMTP_HOST?.includes("gmail");
      
      const transporter = nodemailer.createTransport({
        ...(isGmail
          ? { service: "gmail" }
          : {
              host: process.env.SMTP_HOST,
              port: smtpPort,
              secure: smtpPort === 465,
            }),
        auth: {
          user: process.env.SMTP_USER?.trim(),
          pass: process.env.SMTP_PASS?.replace(/\s+/g, "").trim(),
        },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"ReConnect Security" <${process.env.SMTP_USER}>`,
        to: normalizedEmail,
        subject: emailSubject,
        text: emailBodyText,
        html: emailBodyHtml,
      });

      console.log(`[ReConnect OTP] Sent email code to ${normalizedEmail}`);
    } else {
      console.log("\n==================================================");
      console.log(`[ReConnect OTP Dev Simulation]`);
      console.log(`Recipient: ${normalizedEmail}`);
      console.log(`Code:      ${otp}`);
      console.log(`Expires:   10 minutes`);
      console.log("==================================================\n");
    }

    return NextResponse.json({
      success: true,
      token,
      expiresAt,
      message: `Verification code sent to ${normalizedEmail}`,
      // Expose devCode if in development or if SMTP is not configured, enabling easy local testing
      ...(!hasSmtpConfig || process.env.NODE_ENV !== "production"
        ? { devCode: otp }
        : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send OTP code.";
    console.error("[Send OTP Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
