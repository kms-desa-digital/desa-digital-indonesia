import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectToDatabase } from "@/lib/db/mongodb"

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json()
    const db = await connectToDatabase()

    // Cek apakah email sudah terdaftar
    const existingUser = await db.collection("users").findOne({ email })
    if (existingUser) {
        return NextResponse.json(
            { message: "Email sudah terdaftar" },
            { status: 400 }
        )
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10)

    // Simpan user baru ke database
    const newUser = {
        email,
        password: hashedPassword,
        role: role,
        createdAt: new Date(),
    }
    await db.collection("users").insertOne(newUser)

    return NextResponse.json(
        { message: "User berhasil didaftarkan" },
        { status: 201 }
    )
    } catch (error) {
        console.error("Error during registration:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}