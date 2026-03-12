import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { connectToDatabase } from "@/lib/db/mongodb"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    const db = await connectToDatabase()

    // Cek apakah email terdaftar
    const user = await db.collection("users").findOne({ email })
    if (!user) {
      return NextResponse.json(
        { message: "Email tidak ditemukan" },
        { status: 404 }
      )
    }

    // Cek apakah password benar
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json(
        { message: "Password salah" },
        { status: 401 }
      )
    }

    // Buat token JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    )

    return NextResponse.json(
      { message: "Login berhasil", token, role: user.role },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}