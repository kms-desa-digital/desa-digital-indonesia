// ==================================================================
// API Route Auth Guards
// ==================================================================
// Helper functions to protect API routes with Firebase token verification.
// Returns 404 (bukan 401/403) untuk menyembunyikan keberadaan endpoint
// dari pengguna yang tidak berwenang.

import { NextResponse } from "next/server";
import { verifyRoleFromToken, type ValidRole } from "./verifyRole";

// 404 response yang konsisten tidak membocorkan info tentang endpoint
const NOT_FOUND = () =>
  NextResponse.json({ message: "Not found" }, { status: 404 });

export interface AuthResult {
  uid: string;
  role: ValidRole;
}

/**
 * Memverifikasi bahwa request memiliki Firebase ID Token yang valid.
 * Jika tidak valid, return 404 response.
 *
 * Contoh penggunaan:
 * ```ts
 * export async function POST(req: Request) {
 *   const auth = await requireAuth(req);
 *   if (auth instanceof NextResponse) return auth; // 404
 *   // auth.uid dan auth.role sudah terverifikasi
 * }
 * ```
 */
export async function requireAuth(
  req: Request
): Promise<AuthResult | NextResponse> {
  const authHeader = req.headers.get("Authorization");
  const { uid, role } = await verifyRoleFromToken(authHeader);

  if (!uid) {
    return NOT_FOUND();
  }

  return { uid, role };
}

/**
 * Memverifikasi bahwa request memiliki token valid DAN role yang sesuai.
 * Jika tidak berwenang, return 404 response.
 *
 * Contoh penggunaan:
 * ```ts
 * // Hanya admin yang bisa akses
 * export async function POST(req: Request) {
 *   const auth = await requireRole(req, ["admin"]);
 *   if (auth instanceof NextResponse) return auth; // 404
 * }
 *
 * // Admin atau kementerian
 * export async function GET(req: Request) {
 *   const auth = await requireRole(req, ["admin", "kementerian"]);
 *   if (auth instanceof NextResponse) return auth; // 404
 * }
 * ```
 */
export async function requireRole(
  req: Request,
  allowedRoles: ValidRole[]
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(req);

  // Jika sudah 404 dari requireAuth
  if (result instanceof NextResponse) return result;

  // Cek apakah role user ada di daftar yang diizinkan
  if (!allowedRoles.includes(result.role)) {
    return NOT_FOUND();
  }

  return result;
}

// Type guard: cek apakah result adalah AuthResult (bukan NextResponse 404)
export function isAuthorized(
  result: AuthResult | NextResponse
): result is AuthResult {
  return !(result instanceof NextResponse);
}
