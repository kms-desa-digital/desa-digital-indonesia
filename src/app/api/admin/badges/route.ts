import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/apiAuth";
import { evaluateVillageBadges, evaluateInnovatorBadges } from "@/utils/badges";

// GET /api/admin/badges -> Summary stats of all badges
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const db = await connectToDatabase();
    
    // Evaluate villages
    const villages = await db.collection("villages").find({ status: "Terverifikasi" }).toArray();
    const villageCounts: Record<string, number> = {
      penggerak_inovasi: 0,
      penggiat_digital: 0,
      adopter_spesialis: 0,
      adopter_giat: 0,
      sahabat_inovator: 0
    };
    
    const villageEvaluations = await Promise.all(
      villages.map(v => evaluateVillageBadges(db, v._id.toString()))
    );
    for (const evaluation of villageEvaluations) {
      for (const badge of evaluation.badges) {
        if (badge.isUnlocked) {
          villageCounts[badge.id] = (villageCounts[badge.id] || 0) + 1;
        }
      }
    }

    // Evaluate innovators
    const innovators = await db.collection("innovators").find({ status: "Terverifikasi" }).toArray();
    const innovatorCounts: Record<string, number> = {
      terus_berkembang: 0,
      si_inovatif: 0,
      kolaborator_handal: 0,
      sahabat_desa: 0,
      pemimpin_pasar: 0
    };
    
    const innovatorEvaluations = await Promise.all(
      innovators.map(i => evaluateInnovatorBadges(db, i._id.toString()))
    );
    for (const evaluation of innovatorEvaluations) {
      for (const badge of evaluation.badges) {
        if (badge.isUnlocked) {
          innovatorCounts[badge.id] = (innovatorCounts[badge.id] || 0) + 1;
        }
      }
    }

    return NextResponse.json({
      villageBadgeCounts: villageCounts,
      innovatorBadgeCounts: innovatorCounts,
      totalVillages: villages.length,
      totalInnovators: innovators.length
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching badges summary:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
