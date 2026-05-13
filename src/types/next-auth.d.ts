import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      department?: string;
      faculty?: string;
      requiresProfileCompletion?: boolean;
    };
  }

  interface User {
    requiresProfileCompletion?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: string;
    fullName?: string;
    department?: string;
    faculty?: string;
    requiresProfileCompletion?: boolean;
  }
}
