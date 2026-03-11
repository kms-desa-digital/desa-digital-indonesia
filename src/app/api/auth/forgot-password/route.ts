import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from "@/lib/db/mongodb"

export async function POST(request: Request) {
    try {
        const { email, newPassword, token } = await request.json()
        const db = await connectToDatabase()

        // Cek apakah email terdaftar
        const user = await db.collection("users").findOne({ email })
        if (!user) {
            return NextResponse.json(
                { message: "Email tidak ditemukan" },
                { status: 404 }
            )
        }

        // Cek apakah token valid dan belum expired
        if (user.resetToken !== token || user.resetTokenExpiry < new Date()) {
            return NextResponse.json(
                { message: "Token reset password tidak valid atau sudah expired" },
                { status: 400 }
            )
        }
        
        // Hash password baru sebelum disimpan
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        // Update password dan hapus token reset
        await db.collection("users").updateOne(
            { email },
            { $set: { password: hashedPassword }, $unset: { resetToken: "", resetTokenExpiry: "" } }
        )
        return NextResponse.json(
            { message: "Password berhasil direset" },
            { status: 200 }
        )
    } catch (error) {
        console.error("Error during password reset:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }  
}