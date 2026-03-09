import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient, type RedisClientType } from "redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COUNT_PREFIX = "cadviewer:daily:visitors";
const VISITOR_DAY_COOKIE = "cadviewer_visit_day";
const BLUEPRINT_CHECK_COUNT_KEY = "cadviewer:blueprints:checks";

let redisClient: RedisClientType | null = null;
let redisConnectPromise: Promise<void> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error("REDIS_URL is not configured.");
    }

    redisClient = createClient({
      url: redisUrl,
    });
    redisConnectPromise = redisClient.connect().then(() => {});
  }

  if (redisConnectPromise) {
    await redisConnectPromise;
    redisConnectPromise = null;
  }

  return redisClient;
}

function getTodayKey(date: Date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const today = getTodayKey();
    const counterKey = `${VISITOR_COUNT_PREFIX}:${today}`;
    const cookieStore = await cookies();
    const lastVisitedDay = cookieStore.get(VISITOR_DAY_COOKIE)?.value;

    const redis = await getRedisClient();
    const raw = await redis.get(counterKey);
    const parsed = typeof raw === "string" ? Number.parseInt(raw, 10) : Number.NaN;
    let count = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

    const isNewVisitor = lastVisitedDay !== today;
    if (isNewVisitor) {
      count += 1;
      await redis.set(counterKey, String(count));
      await redis.expire(counterKey, 60 * 60 * 24 * 2);
    }

    const totalBlueprintChecksRaw = await redis.get(BLUEPRINT_CHECK_COUNT_KEY);
    const totalBlueprintChecks = Number.parseInt(
      typeof totalBlueprintChecksRaw === "string" ? totalBlueprintChecksRaw : "0",
      10,
    );
    const safeBlueprintChecks = Number.isFinite(totalBlueprintChecks) ? totalBlueprintChecks : 0;

    const response = NextResponse.json({
      date: today,
      visitors: count,
      isNewVisitor,
      blueprintsChecked: safeBlueprintChecks,
      redisConnected: true,
    });

    response.cookies.set({
      name: VISITOR_DAY_COOKIE,
      value: today,
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: message,
      redisConnected: false,
      visitors: null,
      blueprintsChecked: null,
      isNewVisitor: false,
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const redis = await getRedisClient();
    const totalBlueprintChecks = await redis.incr(BLUEPRINT_CHECK_COUNT_KEY);

    return NextResponse.json({
      blueprintsChecked: totalBlueprintChecks,
      redisConnected: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: message,
      redisConnected: false,
      blueprintsChecked: null,
    }, { status: 500 });
  }
}
