import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/apiAuth";
import { evaluateVillageBadges, evaluateInnovatorBadges } from "@/utils/badges";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["admin"]);
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "all"; // "all" | "village" | "innovator"
    const badgeId = searchParams.get("badgeId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const db = await connectToDatabase();
    let usersList: any[] = [];

    // Fetch villages
    if (roleFilter === "all" || roleFilter === "village") {
      const villageQuery: any = { status: "Terverifikasi" };
      if (search) {
        villageQuery.namaDesa = { $regex: search, $options: "i" };
      }
      const villages = await db.collection("villages").find(villageQuery).toArray();
      for (const v of villages) {
        const evalRes = await evaluateVillageBadges(db, v._id.toString());
        usersList.push({
          id: v._id.toString(),
          name: v.namaDesa,
          role: "village",
          activeBadge: evalRes.activeBadge,
          badges: evalRes.badges
        });
      }
    }

    // Fetch innovators
    if (roleFilter === "all" || roleFilter === "innovator") {
      const innovatorQuery: any = { status: "Terverifikasi" };
      if (search) {
        innovatorQuery.namaInovator = { $regex: search, $options: "i" };
      }
      const innovators = await db.collection("innovators").find(innovatorQuery).toArray();
      for (const i of innovators) {
        const evalRes = await evaluateInnovatorBadges(db, i._id.toString());
        usersList.push({
          id: i._id.toString(),
          name: i.namaInovator,
          role: "innovator",
          activeBadge: evalRes.activeBadge,
          badges: evalRes.badges
        });
      }
    }

    // Sort alphabetically by name
    usersList.sort((a, b) => a.name.localeCompare(b.name));

    if (badgeId) {
      usersList = usersList.filter(user => {
        const matchingBadge = user.badges.find((b: any) => b.id === badgeId);
        return matchingBadge && matchingBadge.isUnlocked;
      });
    }

    const total = usersList.length;
    const paginated = usersList.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      users: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });

  } catch (error) {
    console.error("Error monitoring user badges:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
