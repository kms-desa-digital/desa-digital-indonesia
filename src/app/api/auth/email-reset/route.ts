import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email tidak valid" },
        { status: 400 }
      );
    }

    const db = await connectToDatabase();

    const user = await db.collection("users").findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Email tidak ditemukan" },
        { status: 404 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000);

    await db.collection("users").updateOne(
      { email },
      { $set: { resetToken, resetTokenExpiry } }
    );

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetLink = `${frontendUrl}/auth/reset-password/new-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    const mailFrom = process.env.MAIL_FROM;
    const canSendEmail = Boolean(resendApiKey && mailFrom);

    if (canSendEmail) {
      const resend = new Resend(resendApiKey as string);
      const sender = mailFrom as string;

      await resend.emails.send({
        from: sender,
        to: email,
        subject: "Reset Password Desa Digital",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <h2>Reset Password</h2>
            <p>Halo,</p>
            <p>Kami menerima permintaan untuk mereset password akun Anda.</p>
            <p>Silakan klik tombol berikut untuk membuat password baru:</p>
            <p>
              <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">
                Reset Password
              </a>
            </p>
            <p>Atau buka link berikut secara manual:</p>
            <p><a href="${resetLink}">KLIK DI SINI</a></p>
            <p>Link ini berlaku selama 1 jam.</p>
            <p>Jika Anda tidak merasa meminta reset password, abaikan email ini.</p>
          </div>
        `,
      });
    }

    return NextResponse.json(
      {
        message: canSendEmail
          ? "Link reset password telah dikirim ke email Anda."
          : "Link reset password telah dibuat.",
        resetLink: process.env.NODE_ENV === "development" ? resetLink : undefined,
        emailSent: canSendEmail,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error during password reset request:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}