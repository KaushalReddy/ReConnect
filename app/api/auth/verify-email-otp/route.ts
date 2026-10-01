import { NextResponse } from "next/server";
import { verifyOtpToken } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp, token } = body;

    if (!email || !otp || !token) {
      return NextResponse.json(
        { error: "Email, OTP code, and verification token are required." },
        { status: 400 }
      );
    }

    const verificationResult = verifyOtpToken(email, otp, token);

    if (!verificationResult.valid) {
      return NextResponse.json(
        { error: verificationResult.reason || "Invalid verification code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      email: email.toLowerCase().trim(),
      message: "Email successfully verified.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to verify OTP code.";
    console.error("[Verify OTP Error]:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
