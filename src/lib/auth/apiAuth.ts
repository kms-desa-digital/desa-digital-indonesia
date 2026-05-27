// ==================================================================
// API Route Auth Guards
// ==================================================================
// Helper functions to protect API routes with Firebase token verification.
// Returns 401/403 for unauthorized access attempts.

import { NextResponse } from "next/server";
import { verifyRoleFromToken, type ValidRole } from "./verifyRole";

// Responses for auth/permission failures
const UNAUTHORIZED = (message = "Sesi habis atau token tidak valid. Silakan login kembali.") =>
  NextResponse.json({ message }, { status: 401 });

const FORBIDDEN = (message = "Anda tidak memiliki izin untuk mengakses resource ini.") =>
  NextResponse.json({ message }, { status: 403 });

export interface AuthResult {
  uid: string;
  role: ValidRole;
  email?: string | null;
}

export async function requireAuth(
  req: Request
): Promise<AuthResult | NextResponse> {
  const authHeader = req.headers.get("Authorization");
  const { uid, role, email } = await verifyRoleFromToken(authHeader);

  if (!uid) {
    return UNAUTHORIZED();
  }

  return { uid, role, email };
}

export async function requireRole(
  req: Request,
  allowedRoles: ValidRole[]
): Promise<AuthResult | NextResponse> {
  const result = await requireAuth(req);

  // Jika sudah 401 dari requireAuth
  if (result instanceof NextResponse) return result;

  // Cek apakah role user ada di daftar yang diizinkan
  if (!allowedRoles.includes(result.role)) {
    return FORBIDDEN();
  }

  return result;
}

// Type guard: cek apakah result adalah AuthResult (bukan NextResponse)
export function isAuthorized(
  result: AuthResult | NextResponse
): result is AuthResult {
  return !(result instanceof NextResponse);
}
