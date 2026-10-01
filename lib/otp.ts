import crypto from "crypto";

const OTP_SECRET = process.env.OTP_SECRET || "reconnect-phase4-super-secret-otp-signing-key-2026";

/**
 * Generate a 6-digit numeric OTP string.
 */
export function generateOtp(): string {
  // Cryptographically secure random 6-digit number between 100000 and 999999
  const randomBuffer = crypto.randomBytes(4);
  const randomNumber = randomBuffer.readUInt32BE(0);
  const code = 100000 + (randomNumber % 900000);
  return code.toString();
}

/**
 * Hash an OTP with a salt for secure token inclusion.
 */
function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac("sha256", OTP_SECRET)
    .update(`${email.toLowerCase().trim()}::${otp}`)
    .digest("hex");
}

/**
 * Create a signed, stateless verification token with an expiration time.
 */
export function createOtpToken(email: string, otp: string, expiresInMs = 10 * 60 * 1000): {
  token: string;
  expiresAt: number;
} {
  const normalizedEmail = email.toLowerCase().trim();
  const expiresAt = Date.now() + expiresInMs;
  const otpHash = hashOtp(normalizedEmail, otp);

  const payload = `${normalizedEmail}|${expiresAt}|${otpHash}`;
  const signature = crypto
    .createHmac("sha256", OTP_SECRET)
    .update(payload)
    .digest("hex");

  // token format: <base64url_payload>.<signature>
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const token = `${encodedPayload}.${signature}`;

  return { token, expiresAt };
}

/**
 * Verify a user's submitted OTP code against the signed token.
 */
export function verifyOtpToken(
  email: string,
  userOtp: string,
  token: string
): { valid: boolean; reason?: string } {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, reason: "Malformed verification token." };
    }

    const [encodedPayload, signature] = parts;
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf-8");

    // Verify token signature
    const expectedSignature = crypto
      .createHmac("sha256", OTP_SECRET)
      .update(payload)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      )
    ) {
      return { valid: false, reason: "Invalid verification token signature." };
    }

    const [tokenEmail, expiresAtStr, storedOtpHash] = payload.split("|");
    const expiresAt = Number(expiresAtStr);

    if (tokenEmail !== normalizedEmail) {
      return { valid: false, reason: "Email address does not match this token." };
    }

    if (Date.now() > expiresAt) {
      return { valid: false, reason: "Verification code has expired. Please request a new one." };
    }

    const computedOtpHash = hashOtp(normalizedEmail, userOtp.trim());
    if (
      !crypto.timingSafeEqual(
        Buffer.from(computedOtpHash, "hex"),
        Buffer.from(storedOtpHash, "hex")
      )
    ) {
      return { valid: false, reason: "Incorrect verification code. Please check and try again." };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, reason: "Verification processing failed." };
  }
}
