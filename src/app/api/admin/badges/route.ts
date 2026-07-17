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
    
    for (const v of villages) {
      const evaluation = await evaluateVillageBadges(db, v._id.toString());
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
    
    for (const i of innovators) {
      const evaluation = await evaluateInnovatorBadges(db, i._id.toString());
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
