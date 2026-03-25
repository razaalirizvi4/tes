# Mailjet Email Confirmation Setup Guide

## Overview
This implementation replaces Supabase's default email confirmation with Mailjet for sending confirmation emails. The system generates secure tokens and sends beautifully formatted emails via Mailjet.

## What Was Implemented

1. **Email Service** (`src/services/emailService.ts`)
   - Mailjet integration using REST API
   - Sends HTML email confirmations with branded template
   - Handles email sending errors gracefully

2. **Signup Route Updates** (`src/app/api/signup/route.ts`)
   - Generates secure confirmation tokens using HMAC
   - Disables Supabase's automatic email sending
   - Sends confirmation email via Mailjet after user creation

3. **Email Confirmation API** (`src/app/api/confirm-email/route.ts`)
   - Verifies confirmation tokens
   - Confirms user email in Supabase using Admin API
   - Handles token expiration (24 hours)

4. **Confirmation Page** (`src/app/auth/confirm/page.tsx`)
   - Handles both Mailjet token-based confirmation and Supabase OAuth callbacks
   - Provides user feedback during confirmation process
   - Redirects to login after successful confirmation

5. **Login Route Updates** (`src/app/api/login/route.ts`)
   - Checks if email is confirmed before allowing login
   - Returns appropriate error message if email not confirmed

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Mailjet Configuration
MAILJET_API_KEY=your_mailjet_api_key_here
MAILJET_SECRET_KEY=your_mailjet_secret_key_here
MAILJET_FROM_EMAIL=noreply@yourdomain.com
MAILJET_FROM_NAME=Your App Name

# Optional: Custom secret for token signing (defaults to Supabase key)
EMAIL_CONFIRMATION_SECRET=your_custom_secret_here

# Supabase Admin Key (Required for email confirmation)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# App URL (should already exist)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## How to Get Your Mailjet Credentials

1. **API Key & Secret Key:**
   - Log in to your Mailjet dashboard
   - Go to Account Settings → API Keys
   - Copy your API Key and Secret Key
   - Add them to your `.env.local` file

2. **From Email:**
   - Use a verified sender email in Mailjet
   - This should be an email you've verified in your Mailjet account
   - Example: `noreply@yourdomain.com`

3. **Supabase Service Role Key:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the `service_role` key (keep this secret!)
   - Add it to your `.env.local` file

## How It Works

1. **User Signs Up:**
   - User fills out signup form
   - Account is created in Supabase and Prisma
   - Secure confirmation token is generated
   - Confirmation email is sent via Mailjet

2. **User Clicks Confirmation Link:**
   - Link contains token: `/auth/confirm?token=...`
   - Token is verified (signature + expiration check)
   - Email is confirmed in Supabase via Admin API
   - User is redirected to login page

3. **User Logs In:**
   - System checks if email is confirmed
   - Only confirmed users can log in
   - Unconfirmed users see error message

## Security Features

- **HMAC-signed tokens:** Tokens are cryptographically signed to prevent tampering
- **Token expiration:** Tokens expire after 24 hours
- **Secure token generation:** Uses crypto library for secure token creation
- **Email verification:** Only verified emails can log in

## Testing

1. **Test Signup:**
   ```bash
   # Sign up a new user
   # Check your email inbox for confirmation email
   ```

2. **Test Confirmation:**
   ```bash
   # Click the confirmation link in the email
   # Should redirect to login page with success message
   ```

3. **Test Login:**
   ```bash
   # Try logging in before confirming email (should fail)
   # Confirm email, then try logging in (should succeed)
   ```

## Troubleshooting

### Email Not Sending
- Check Mailjet API credentials are correct
- Verify sender email is verified in Mailjet
- Check server logs for Mailjet API errors

### Confirmation Not Working
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check token hasn't expired (24 hours)
- Verify the confirmation URL is correct

### Login Fails After Confirmation
- Check Supabase user's `email_confirmed_at` field is set
- Verify the confirmation API endpoint completed successfully
- Check server logs for errors

## Customization

### Email Template
Edit the HTML template in `src/services/emailService.ts` in the `sendConfirmationEmail` method to customize the email design.

### Token Expiration
Change the expiration time in `src/app/api/confirm-email/route.ts`:
```typescript
const twentyFourHours = 24 * 60 * 60 * 1000; // Change this value
```

### Email Subject/Content
Modify the email content in `src/services/emailService.ts` in the `sendConfirmationEmail` method.

## Notes

- The system maintains backward compatibility with Supabase OAuth callbacks
- Email confirmation is required for all users (except Google OAuth users)
- Tokens are stateless (no database storage needed)
- The implementation doesn't require schema changes

