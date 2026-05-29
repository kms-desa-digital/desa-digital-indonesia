import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';
import { requireRole } from '@/lib/auth/apiAuth';
import { evaluateVillageBadges } from '@/utils/badges';

type Params = Promise<{ id: string }>;

// =========================================================
// GET /api/villages/[id]/badges
// Mengambil status pencapaian & badge aktif untuk desa
// =========================================================
export async function GET(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const db = await connectToDatabase();

    const evaluation = await evaluateVillageBadges(db, id);

    return NextResponse.json(evaluation, { status: 200 });
  } catch (error) {
    console.error('Error fetching village badges:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// =========================================================
// PATCH /api/villages/[id]/badges
// Mengubah activeBadge untuk desa
// =========================================================
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  try {
    // Autentikasi: Hanya pemilik (desa) atau admin yang boleh mengganti badge
    const auth = await requireRole(request, ["village", "admin"]);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await request.json();
    const { badgeId } = body;

    const db = await connectToDatabase();

    // Cari profil desa berdasarkan id (bisa berupa Firebase UID / userId atau MongoDB _id)
    let query: any;
    try {
      query = { $or: [{ _id: new ObjectId(id) }, { userId: id }] };
    } catch (e) {
      query = { userId: id };
    }

    const village = await db.collection('villages').findOne(query);

    if (!village) {
      return NextResponse.json({ message: 'Profil desa tidak ditemukan' }, { status: 404 });
    }

    // Cek otorisasi
    const isAdmin = auth.role === 'admin';
    if (!isAdmin && village.userId !== auth.uid) {
      return NextResponse.json({ message: 'Anda tidak berwenang mengubah profil ini' }, { status: 403 });
    }

    // Jika badgeId disertakan, pastikan badge tersebut memang unlocked!
    if (badgeId) {
      const evaluation = await evaluateVillageBadges(db, id);
      const targetBadge = evaluation.badges.find(b => b.id === badgeId);
      if (!targetBadge || !targetBadge.isUnlocked) {
        return NextResponse.json({ message: 'Gelar ini belum terbuka' }, { status: 400 });
      }
    }

    // Update activeBadge
    const result = await db.collection('villages').updateOne(
      { _id: village._id },
      { $set: { activeBadge: badgeId || null } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: 'Gagal memperbarui profil desa' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Gelar aktif berhasil diperbarui', activeBadge: badgeId || null }, { status: 200 });

  } catch (error) {
    console.error('Error updating active badge:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
