import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getCachedData, setCachedData } from "@/lib/utils/cache";

export const dynamic = "force-dynamic";

const FASTAPI_URL = process.env.RECOMMENDATION_API_URL || "https://ddi-recommendation.vercel.app/api/v1";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { innovation_id, top_n } = body;

    if (!innovation_id) {
      return NextResponse.json(
        { message: "innovation_id is required" },
        { status: 400 }
      );
    }

    const cacheKey = `cache:recommendations:id=${innovation_id}:top_n=${top_n || 4}`;
    const cached = await getCachedData<any>(cacheKey);
    if (cached) {
      console.log(`[Cache] Serving recommendations from cache for: ${innovation_id}`);
      return NextResponse.json(cached, { status: 200 });
    }

    // Call external FastAPI recommendation engine
    console.log(`Forwarding recommendation request to: ${FASTAPI_URL}/recommendations`);
    const response = await axios.post(`${FASTAPI_URL}/recommendations`, {
      innovation_id,
      top_n: top_n || 4,
    });

    await setCachedData(cacheKey, response.data, 3600); // Cache selama 1 jam

    return NextResponse.json(response.data, { status: 200 });
  } catch (error: any) {
    console.error("Error in proxy recommendations API:", error.response?.data || error.message);
    return NextResponse.json(
      {
        message: "Failed to fetch recommendations from external engine",
        error: error.response?.data?.detail || error.message,
        data: [],
      },
      { status: 500 }
    );
  }
}
