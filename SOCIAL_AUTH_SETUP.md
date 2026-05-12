# Social Authentication Setup Guide

This guide explains how to set up Google, Facebook, and Apple Sign-In for AnatomiQ.

## Prerequisites

- Next.js application with authentication system
- Database with FacultyUser model supporting OAuth fields (googleId, facebookId)
- Environment variables file (.env.local)

## 1. Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Google+ API" for the project

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services > OAuth consent screen**
2. Choose **External** user type
3. Fill in required fields:
   - App name: AnatomiQ
   - User support email: support@anatomiq.com
   - Developer contact: your-email@example.com
4. Add scopes: `email`, `profile`, `openid`
5. Save and continue

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Application type: **Web application**
4. Name: AnatomiQ Web Client
5. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://anatomiq.com` (production)
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://anatomiq.com/api/auth/callback/google`
7. Click **Create** and save your Client ID and Client Secret

### Step 4: Add to Environment Variables

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 2. Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps > Create App**
3. Choose **Consumer** app type
4. Fill in app details:
   - Display name: AnatomiQ
   - Contact email: support@anatomiq.com

### Step 2: Add Facebook Login Product

1. In your app dashboard, click **Add Product**
2. Find **Facebook Login** and click **Set Up**
3. Choose **Web** platform
4. Enter site URL: `https://anatomiq.com`

### Step 3: Configure OAuth Settings

1. Go to **Facebook Login > Settings**
2. Add Valid OAuth Redirect URIs:
   - `http://localhost:3000/api/auth/callback/facebook`
   - `https://anatomiq.com/api/auth/callback/facebook`
3. Enable **Use Strict Mode for Redirect URIs**
4. Save changes

### Step 4: Get App Credentials

1. Go to **Settings > Basic**
2. Copy **App ID** and **App Secret**

### Step 5: Add to Environment Variables

```bash
FACEBOOK_CLIENT_ID=your-app-id
FACEBOOK_CLIENT_SECRET=your-app-secret
```

---

## 3. Apple Sign In Setup

### Step 1: Register App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** and create new App ID
4. Fill in details:
   - Description: AnatomiQ
   - Bundle ID: com.anatomiq.app
5. Enable **Sign In with Apple** capability
6. Save

### Step 2: Create Services ID

1. Create new **Services ID**
2. Description: AnatomiQ Web
3. Identifier: com.anatomiq.service
4. Enable **Sign In with Apple**
5. Configure:
   - Domains: `anatomiq.com`
   - Return URLs: `https://anatomiq.com/api/auth/callback/apple`

### Step 3: Create Private Key

1. Go to **Keys** section
2. Create new key
3. Name: AnatomiQ Apple Sign In Key
4. Enable **Sign In with Apple**
5. Configure key with your Services ID
6. Download the `.p8` key file (save securely!)
7. Note the Key ID

### Step 4: Get Team ID

1. Go to **Membership** in Apple Developer portal
2. Copy your **Team ID**

### Step 5: Add to Environment Variables

```bash
APPLE_CLIENT_ID=com.anatomiq.service
APPLE_CLIENT_SECRET=generate-jwt-token-see-below
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----"
```

**Note**: Apple requires generating a JWT token for client secret. Use a library or script to generate it from your private key.

---

## 4. Implementation

### Create OAuth API Route

Create `src/app/api/auth/oauth/[provider]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const provider = params.provider;

  if (!code) {
    return NextResponse.redirect("/auth/signin?error=oauth_failed");
  }

  try {
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(provider, code);
    
    // Get user info from provider
    const userInfo = await getUserInfo(provider, tokenResponse.access_token);

    // Find or create user
    const user = await findOrCreateOAuthUser(provider, userInfo);

    // Generate JWT
    const token = generateToken(user.id, user.email);

    // Redirect to dashboard with token
    const response = NextResponse.redirect("/dashboard");
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect("/auth/signin?error=oauth_failed");
  }
}

async function exchangeCodeForToken(provider: string, code: string) {
  // Implementation depends on provider
  // Use provider-specific OAuth endpoints
}

async function getUserInfo(provider: string, accessToken: string) {
  // Fetch user info from provider API
}

async function findOrCreateOAuthUser(provider: string, userInfo: any) {
  const providerField = `${provider}Id`;
  
  let user = await db.facultyUser.findUnique({
    where: { [providerField]: userInfo.id },
  });

  if (!user) {
    user = await db.facultyUser.create({
      data: {
        email: userInfo.email,
        fullName: userInfo.name,
        [providerField]: userInfo.id,
        emailVerified: true,
        avatarUrl: userInfo.picture,
      },
    });
  }

  return user;
}
```

### Add OAuth Buttons to Sign In Page

Update `src/components/auth/signin-form.tsx`:

```typescript
<div className="space-y-3">
  <button
    onClick={() => window.location.href = "/api/auth/oauth/google"}
    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
  >
    <img src="/google-icon.svg" className="h-5 w-5" />
    Continue with Google
  </button>
  
  <button
    onClick={() => window.location.href = "/api/auth/oauth/facebook"}
    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
  >
    <img src="/facebook-icon.svg" className="h-5 w-5" />
    Continue with Facebook
  </button>
  
  <button
    onClick={() => window.location.href = "/api/auth/oauth/apple"}
    className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
  >
    <img src="/apple-icon.svg" className="h-5 w-5" />
    Continue with Apple
  </button>
</div>
```

---

## 5. Security Considerations

1. **HTTPS Required**: OAuth providers require HTTPS in production
2. **State Parameter**: Implement CSRF protection using state parameter
3. **Nonce**: Use nonce for Apple Sign In
4. **Token Storage**: Store refresh tokens securely if needed
5. **Scope Limitation**: Only request necessary permissions
6. **Account Linking**: Handle cases where email already exists with different provider

---

## 6. Testing

### Development Testing

1. Use localhost redirect URIs during development
2. Test each provider separately
3. Verify user creation and login flow
4. Test account linking scenarios

### Production Checklist

- [ ] All OAuth credentials configured in production environment
- [ ] HTTPS enabled
- [ ] Production redirect URIs added to all providers
- [ ] Privacy policy and terms of service URLs added to OAuth consent screens
- [ ] App verification completed for Google (if required)
- [ ] Facebook app reviewed and approved (if required)
- [ ] Apple Services ID configured with production domain

---

## 7. Common Issues

### Issue: "Redirect URI mismatch"
- Ensure redirect URIs match exactly (including trailing slashes)
- Check protocol (http vs https)

### Issue: "Invalid client"
- Verify client ID and secret are correct
- Check environment variables are loaded

### Issue: "Access denied"
- User cancelled OAuth flow
- App not approved/verified by provider

### Issue: "Email already exists"
- Implement account linking logic
- Prompt user to sign in with existing method

---

## Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
