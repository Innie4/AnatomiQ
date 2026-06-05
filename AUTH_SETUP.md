# Authentication Setup Guide

This guide explains how to configure all authentication providers for AcademIQ.

## Features

- ✅ Multi-step user signup (Name → Email → Password → Department & Faculty)
- ✅ Email/Password sign-in
- ✅ Google OAuth sign-in
- ✅ Facebook OAuth sign-in
- ✅ Guest mode (temporary access)
- ✅ Protected routes with automatic redirects
- ✅ JWT-based authentication

## Required Environment Variables

Copy `.env.example` to `.env` and fill in the following credentials:

### 1. Database (Supabase - Free Tier)

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

**Setup:**
1. Go to [https://supabase.com](https://supabase.com)
2. Create a free account
3. Create a new project
4. Go to Settings → Database
5. Copy the connection strings (use the pooler URLs)

### 2. JWT Secret

```env
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-nextauth-secret"
```

**Generate secrets:**
```bash
openssl rand -base64 32
```

Run this command twice to generate both secrets.

### 3. Google OAuth (Free)

```env
GOOGLE_CLIENT_ID="your-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-secret"
```

**Setup:**
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to APIs & Services → Credentials
5. Create OAuth 2.0 Client ID
6. Add authorized redirect URI:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy Client ID and Client Secret

### 4. Facebook OAuth (Free)

```env
FACEBOOK_CLIENT_ID="your-app-id"
FACEBOOK_CLIENT_SECRET="your-app-secret"
```

**Setup:**
1. Go to [https://developers.facebook.com](https://developers.facebook.com)
2. Create a new app (Consumer type)
3. Add Facebook Login product
4. Go to Settings → Basic
5. Copy App ID and App Secret
6. Go to Facebook Login → Settings
7. Add Valid OAuth Redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/facebook`
   - Production: `https://yourdomain.com/api/auth/callback/facebook`

### 5. Application URLs

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

Change these to your production domain when deploying.

## Database Migration

After setting up environment variables, run:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Testing Authentication

### 1. Start the development server

```bash
npm run dev
```

### 2. Test signup flow

1. Navigate to `http://localhost:3000/signup`
2. Complete the 4-step signup process:
   - Step 1: Enter your full name
   - Step 2: Enter your email
   - Step 3: Create a password (min 8 characters)
   - Step 4: Select department and faculty
3. You'll be automatically signed in and redirected to home

### 3. Test sign-in options

1. Navigate to `http://localhost:3000/signin`
2. Try different sign-in methods:
   - Email/Password
   - Continue with Google
   - Continue with Facebook
   - Continue as Guest

### 4. Test protected routes

All routes except `/signin` and `/signup` are protected. Unauthenticated users will be redirected to sign-in.

## User Roles

- **Regular Users**: Students/faculty who sign up normally
- **Guest Users**: Temporary access, limited features
- **Legacy Admin**: Uses `ADMIN_UPLOAD_KEY` for upload features

## Troubleshooting

### OAuth redirect URI mismatch

Make sure the redirect URIs in Google/Facebook match exactly:
- Protocol (http vs https)
- Domain (localhost vs production domain)
- Port (3000 in development)
- Path (`/api/auth/callback/google` or `/api/auth/callback/facebook`)

### Database connection errors

- Check if your Supabase project is active
- Verify connection strings are correct
- Ensure you're using the pooler URLs for serverless

### NextAuth errors

- Verify `NEXTAUTH_URL` matches your app URL
- Generate a new `NEXTAUTH_SECRET` if needed
- Clear browser cookies and try again

## API Routes

- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Email/password sign-in
- `POST /api/auth/guest` - Create guest session
- `GET/POST /api/auth/[...nextauth]` - OAuth callbacks (handled by NextAuth)

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Rate limiting on auth endpoints
- ✅ Protected API routes
- ✅ Secure OAuth flows
- ✅ Guest session isolation
