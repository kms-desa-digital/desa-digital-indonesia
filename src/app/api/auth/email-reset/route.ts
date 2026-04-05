import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { message: "Email tidak valid" },
        { status: 400 }
      );
    }

    const adminAuth = getFirebaseAdminAuth();
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
    const redirectUrl = `${frontendUrl}/auth/reset-password/new-password`;

    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: redirectUrl,
      handleCodeInApp: true,
    });

    const parsedResetLink = new URL(resetLink);
    const oobCode = parsedResetLink.searchParams.get("oobCode");

    if (!oobCode) {
      throw new Error("Generated reset link does not contain oobCode");
    }

    const appResetLink = `${frontendUrl}/auth/reset-password/new-password?oobCode=${encodeURIComponent(oobCode)}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    const mailFrom = process.env.MAIL_FROM;
    const canSendEmail = Boolean(resendApiKey && mailFrom);

    if (canSendEmail) {
      const resend = new Resend(resendApiKey as string);

      await resend.emails.send({
        from: mailFrom as string,
        to: email,
        subject: "Reset Password Desa Digital",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
            <h2>Reset Password</h2>
            <p>Halo,</p>
            <p>Kami menerima permintaan reset password akun Anda.</p>
            <p>Klik tombol berikut untuk membuat password baru:</p>
            <p>
              <a href="${appResetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">
                Reset Password
              </a>
            </p>
            <p>Atau <a href="${appResetLink}" style="color:#2563eb;text-decoration:underline;">klik di sini</a>.</p>
            <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
          </div>
        `,
      });
    }

    return NextResponse.json(
      {
        message: canSendEmail
          ? "Link reset password telah dikirim ke email Anda."
          : "Link reset password berhasil dibuat (email provider belum dikonfigurasi).",
        resetLink: process.env.NODE_ENV === "development" ? appResetLink : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating custom reset link:", error);
    return NextResponse.json(
      { message: "Gagal membuat link reset password" },
      { status: 500 }
    );
  }
}