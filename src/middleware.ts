import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware untuk membatasi akses ke /api agar hanya bisa diakses oleh 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    // 1. Cek IP Whitelist
    const allowedIps = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : []
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      ''

    if (allowedIps.length > 0 && allowedIps.includes(clientIP)) {
      return NextResponse.next()
    }

    // 2. Verifikasi Identitas Internal
    const isInternalRequest = request.headers.get('x-internal-request') === 'true'

    // 3. Verifikasi Same-Origin
    const isSameOrigin =
      (origin && origin.includes(host || '')) ||
      (referer && referer.includes(host || ''))

    // 4. Deteksi Tool External
    const userAgent = request.headers.get('user-agent') || ''
    const isExternalTool = /Postman|Insomnia|curl|wget|python-requests/i.test(userAgent)

    if ((!isSameOrigin && !isInternalRequest) || (isExternalTool && !isInternalRequest)) {
      console.warn(`[Blocked Access] Unauthorized attempt to access ${pathname}. IP: ${clientIP}, UA: ${userAgent}`)

      return new NextResponse(
        JSON.stringify({ message: 'Not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
