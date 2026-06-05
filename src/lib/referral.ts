import { db } from "./db";

/**
 * Generate a unique referral code for a user
 * Format: First 3 letters of name + random 5 characters
 */
export function generateReferralCode(fullName: string): string {
  const prefix = fullName
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `${prefix}${randomPart}`;
}

/**
 * Generate a unique referral code and ensure it doesn't exist
 */
export async function generateUniqueReferralCode(
  fullName: string
): Promise<string> {
  let code = generateReferralCode(fullName);
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const existing = await db.facultyUser.findUnique({
      where: { referralCode: code },
    });

    if (!existing) {
      return code;
    }

    code = generateReferralCode(fullName);
    attempts++;
  }

  throw new Error("Failed to generate unique referral code");
}

/**
 * Validate a referral code and return the referrer's ID
 */
export async function validateReferralCode(
  code: string
): Promise<string | null> {
  const referrer = await db.facultyUser.findUnique({
    where: { referralCode: code.trim().toUpperCase() },
    select: { id: true, isActive: true },
  });

  if (!referrer || !referrer.isActive) {
    return null;
  }

  return referrer.id;
}

/**
 * Process a referral - create referral record and update counts
 */
export async function processReferral(
  referredUserId: string,
  referralCode: string
): Promise<boolean> {
  try {
    const normalizedCode = referralCode.trim().toUpperCase();
    const referrerId = await validateReferralCode(normalizedCode);

    if (!referrerId || referrerId === referredUserId) {
      return false;
    }

    const existingReferral = await db.referral.findUnique({
      where: { referredUserId },
    });

    if (existingReferral) {
      return true;
    }

    const referredUser = await db.facultyUser.findUnique({
      where: { id: referredUserId },
      select: { fullName: true },
    });
    const referrer = await db.facultyUser.findUnique({
      where: { id: referrerId },
      select: { referralNotifications: true },
    });

    // Create referral record and increment count in a transaction
    await db.$transaction([
      db.referral.create({
        data: {
          referrerId,
          referredUserId,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      }),
      db.facultyUser.update({
        where: { id: referrerId },
        data: {
          referralCount: {
            increment: 1,
          },
        },
      }),
      db.facultyUser.update({
        where: { id: referredUserId },
        data: {
          referredBy: normalizedCode,
        },
      }),
      ...(referrer?.referralNotifications
        ? [
            db.notification.create({
              data: {
                userId: referrerId,
                type: "REFERRAL_SUCCESS",
                title: "Referral completed",
                message: `${referredUser?.fullName || "A new user"} joined AcademIQ with your referral code.`,
                link: "/referrals",
              },
            }),
          ]
        : []),
    ]);

    return true;
  } catch (error) {
    console.error("Error processing referral:", error);
    return false;
  }
}

/**
 * Mark a referral as completed (e.g., when referred user completes onboarding)
 */
export async function completeReferral(referredUserId: string): Promise<void> {
  await db.referral.updateMany({
    where: {
      referredUserId,
      status: "PENDING",
    },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
  });
}

/**
 * Get referral stats for a user
 */
export async function getReferralStats(userId: string) {
  const [user, referrals] = await Promise.all([
    db.facultyUser.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralCount: true,
      },
    }),
    db.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: {
            fullName: true,
            email: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    referralCode: user?.referralCode,
    totalReferrals: user?.referralCount || 0,
    referrals,
  };
}
