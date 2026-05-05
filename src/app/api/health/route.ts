import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'unhealthy'; latency?: number; error?: string }> = {};

  // Check database connectivity
  try {
    const prisma = new PrismaClient();
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    checks.database = {
      status: 'healthy',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // Check Supabase Storage (if configured)
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabaseStart = Date.now();
      const response = await fetch(`${process.env.SUPABASE_URL}/storage/v1/bucket`, {
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      checks.storage = {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - supabaseStart,
      };
    } catch (error) {
      checks.storage = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Storage connectivity check failed',
      };
    }
  }

  // Overall health determination
  const allHealthy = Object.values(checks).every((check) => check.status === 'healthy');
  const status = allHealthy ? 'healthy' : 'degraded';

  const response = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    version: process.env.npm_package_version || '0.1.0',
    latency: Date.now() - startTime,
  };

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
