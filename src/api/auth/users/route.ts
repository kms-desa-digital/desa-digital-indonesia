import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/db/mongodb"

export async function GET(request: Request) {
    try {
        const db = await connectToDatabase()
        const users = await db.collection("users")
            .find({}, { projection: { password: 0, resetToken: 0, resetTokenExpiry: 0 } })
            .toArray()
        return NextResponse.json(
            { users },
            { status: 200 }
        )
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }   
}