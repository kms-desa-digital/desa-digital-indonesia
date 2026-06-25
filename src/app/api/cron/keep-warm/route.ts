import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { getRedisClient } from '@/lib/db/redis';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    // Verifikasi token keamanan
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const urlToken = request.nextUrl.searchParams.get('token');
      if (urlToken !== cronSecret) {
        console.warn('[Keep-Warm Cron] Unauthorized access attempt');
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Keep-Warm Cron] Running connection warm-up...');

    // Ping MongoDB
    const db = await connectToDatabase();
    await db.command({ ping: 1 });
    console.log('[Keep-Warm Cron] MongoDB connection is warm');

    // Ping Redis
    const redis = getRedisClient();
    if (redis) {
      await redis.ping();
      console.log('[Keep-Warm Cron] Redis connection is warm');
    } else {
      console.log('[Keep-Warm Cron] Redis is not configured or disabled');
    }

    // Ping FastAPI Recommendation Engine (mengatasi cold start server eksternal)
    const fastApiUrl = process.env.RECOMMENDATION_API_URL || "https://ddi-recommendation.vercel.app/api/v1";
    try {
      await axios.get(fastApiUrl, { timeout: 8000 });
      console.log('[Keep-Warm Cron] FastAPI Recommendation Engine is warm');
    } catch (err: any) {
      // 404/405 tetap men-spin up container Serverless di Vercel, jadi target keep-warm tercapai
      console.log('[Keep-Warm Cron] FastAPI Recommendation Engine pinged');
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Connections are warm',
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error('[Keep-Warm Cron] Warm-up failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error?.message || 'Internal server error'
    }, { status: 500 });
  }
}
