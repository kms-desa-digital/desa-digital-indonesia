import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { requireRole } from '@/lib/auth/apiAuth';
import { evaluateInnovatorBadges } from '@/utils/badges';

type Params = Promise<{ id: string }>;

// =========================================================
// GET /api/innovator/[id]/badges
// Mengambil status pencapaian & badge aktif untuk innovator
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    const evaluation = await evaluateInnovatorBadges(db, id);

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error) {
    console.error('Error fetching innovator badges:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// =========================================================
// PATCH /api/innovator/[id]/badges
// Mengubah activeBadge untuk innovator
// =========================================================
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    // Autentikasi: Hanya pemilik (innovator) atau admin yang boleh mengganti badge
    const auth = await requireRole(request, ["innovator", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();
    const { badgeId } = body;

    const db = await connectToDatabase();

    // Cari profil innovator berdasarkan id (bisa berupa Firebase UID / userId atau MongoDB _id)
    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { userId: id }] };
    } catch (e) {
      query = { userId: id };
    }

    const innovator = await db.collection('innovators').findOne(query);

    if (!innovator) {
      return NextResponse.json({ message: 'Profil inovator tidak ditemukan' }, { status: 404 });
    }

    // Cek otorisasi
    const isAdmin = auth.role === 'admin';
    if (!isAdmin && innovator.userId !== auth.uid) {
      return NextResponse.json({ message: 'Anda tidak berwenang mengubah profil ini' }, { status: 403 });
    }

    // Jika badgeId disertakan, pastikan badge tersebut memang unlocked!
    if (badgeId) {
      const evaluation = await evaluateInnovatorBadges(db, id);
      const targetBadge = evaluation.badges.find(b => b.id === badgeId);
      if (!targetBadge || !targetBadge.isUnlocked) {
        return NextResponse.json({ message: 'Gelar ini belum terbuka' }, { status: 400 });
      }
    }

    // Update activeBadge
    const result = await db.collection('innovators').updateOne(
      { _id: innovator._id },
      { $set: { activeBadge: badgeId || null } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Gagal memperbarui profil inovator' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Gelar aktif berhasil diperbarui', activeBadge: badgeId || null }, { status: 200 });

  } catch (error) {
    console.error('Error updating active badge:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
