import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret-change-in-production";
const JWT_EXPIRES_IN = "7d";

export type JWTPayload = {
  userId: string;
  email: string;
  fullName: string;
  department: string;
};

/**
 * Sign a JWT token for a faculty user
 */
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && decoded !== null) {
      return decoded as JWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate middleware - supports both JWT (new) and legacy ADMIN_KEY
 * Returns faculty user data or null if unauthorized
 */
export async function authenticateRequest(prisma: PrismaClient): Promise<JWTPayload | null> {
  const headersList = await headers();

  // Try JWT first (new system)
  const authHeader = headersList.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    if (payload) {
      // Verify user still exists and is active
      const user = await prisma.facultyUser.findUnique({
        where: { id: payload.userId, isActive: true },
      });
      if (user) {
        return payload;
      }
    }
  }

  // Fallback to legacy ADMIN_KEY (for backwards compatibility)
  const legacyKey = headersList.get("x-admin-upload-key");
  const expectedKey = process.env.ADMIN_UPLOAD_KEY;
  if (legacyKey && expectedKey && legacyKey === expectedKey) {
    // Return a synthetic payload for the legacy key
    return {
      userId: "legacy-admin",
      email: "admin@legacy",
      fullName: "Legacy Admin",
      department: "Human Anatomy",
    };
  }

  return null;
}

/**
 * Log an audit event for a faculty action
 */
export async function logAudit(
  prisma: PrismaClient,
  facultyUserId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: string
): Promise<void> {
  // Skip audit logs for legacy admin
  if (facultyUserId === "legacy-admin") {
    return;
  }

  const headersList = await headers();
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || null;
  const userAgent = headersList.get("user-agent") || null;

  await prisma.auditLog.create({
    data: {
      facultyUserId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    },
  });
}
