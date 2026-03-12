import { NextResponse } from 'next/server';
import crypto from 'crypto'
import { connectToDatabase } from "@/lib/db/mongodb"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    const db = await connectToDatabase()

    // Cek apakah email terdaftar
    const user = await db.collection("users").findOne({ email })
    if (!user) {
      return NextResponse.json(
        { message: "Email tidak ditemukan" },
        { status: 404 }
      )
    } else {
      // Generate token reset password
      const resetToken = crypto.randomBytes(32).toString('hex')
      const resetTokenExpiry = new Date(Date.now() + 3600000) // Token berlaku selama 1 jam 
        // Simpan token dan expiry ke database
        await db.collection("users").updateOne( 
            { email },
            { $set: { resetToken, resetTokenExpiry } }
        )

        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`

        // Kirim resetLink via nodemailer ke email user
        // Implement nodemailer logic here
        return NextResponse.json(   
            { message: "Link reset password telah dikirim ke email Anda" },
            { status: 200 }
        )
    }   
    } catch (error) {
        console.error("Error during password reset request:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }   
}