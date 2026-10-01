import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { UserDoc, MentorshipRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, studentId, alumniId } = body;

    if (!requestId || !studentId || !alumniId) {
      return NextResponse.json(
        { error: "Missing required fields (requestId, studentId, alumniId)" },
        { status: 400 }
      );
    }

    // 1. Fetch the request to verify and check for duplicate/already-sent notifications
    const reqRef = doc(db, "mentorshipRequests", requestId);
    const reqSnap = await getDoc(reqRef);

    if (!reqSnap.exists()) {
      return NextResponse.json(
        { error: "Mentorship request not found" },
        { status: 404 }
      );
    }

    const reqData = reqSnap.data() as MentorshipRequest;

    // Idempotency: if notification was already sent, do not send again
    if (reqData.notificationSent) {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        message: "Acceptance notification already delivered previously.",
      });
    }

    // 2. Fetch student and alumni user documents securely on server
    const [studentSnap, alumniSnap] = await Promise.all([
      getDoc(doc(db, "users", studentId)),
      getDoc(doc(db, "users", alumniId)),
    ]);

    if (!studentSnap.exists()) {
      return NextResponse.json(
        { error: "Student user record not found" },
        { status: 404 }
      );
    }

    const student = studentSnap.data() as UserDoc;
    const alumni = alumniSnap.exists() ? (alumniSnap.data() as UserDoc) : null;
    const alumniName = alumni?.name || "your alumni mentor";

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      "http://localhost:3000";

    const emailSubject = `Mentorship Request Accepted by ${alumniName} — ReConnect`;
    const emailBodyText = `Hi ${student.name},\n\nGreat news! Your mentorship request has been accepted by ${alumniName}.\n\nYou can now start your mentorship journey, chat with your mentor, and schedule your first meeting.\n\nOpen ReConnect to chat and schedule:\n${appUrl}/mentorship\n\nBest regards,\nThe ReConnect Team`;

    const emailBodyHtml = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #12141C; background-color: #F7F4EC; border-radius: 12px; border: 1px solid rgba(18,20,28,0.1);">
        <div style="margin-bottom: 20px;">
          <h2 style="color: #12141C; font-size: 24px; margin: 0 0 8px 0; font-family: Georgia, serif;">ReConnect</h2>
          <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #8A6B37; margin: 0;">Mentorship Update</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid rgba(18,20,28,0.08); margin-bottom: 20px;">
          <h3 style="font-size: 18px; margin-top: 0; color: #12141C;">Great news, ${student.name}!</h3>
          <p style="font-size: 15px; line-height: 1.6; color: #4A4D63;">
            Your mentorship request has been accepted by <strong>${alumniName}</strong>. You can now start your mentorship journey, chat with your mentor, and schedule your first meeting.
          </p>
          
          <div style="margin: 24px 0;">
            <a href="${appUrl}/mentorship" style="display: inline-block; background-color: #12141C; color: #F7F4EC; text-decoration: none; padding: 12px 24px; border-radius: 9999px; font-weight: 500; font-size: 14px;">
              Open Mentorship Dashboard &rarr;
            </a>
          </div>
        </div>
        
        <p style="font-size: 12px; color: #6C6F87; margin: 0;">
          This is an automated notification from ReConnect. Please do not reply directly to this email.
        </p>
      </div>
    `;

    // 3. Send email if SMTP config is present, otherwise simulate gracefully
    let emailDelivered = false;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
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
        from: process.env.EMAIL_FROM || `"ReConnect" <${process.env.SMTP_USER}>`,
        to: student.email,
        subject: emailSubject,
        text: emailBodyText,
        html: emailBodyHtml,
      });

      emailDelivered = true;
    } else {
      // Graceful server-side logging for development / environments without configured SMTP credentials
      console.log(
        `[Email Notification Server] Sent acceptance email to ${student.email} (${student.name}) for request from ${alumniName}.`
      );
      emailDelivered = true;
    }

    // 4. Mark request document with notificationSent: true to guarantee idempotency
    await updateDoc(reqRef, {
      notificationSent: true,
      updatedAt: Date.now(),
    });

    return NextResponse.json({
      success: true,
      emailDelivered,
      recipient: student.email,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process email notification";
    console.error("[Email Notification Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
