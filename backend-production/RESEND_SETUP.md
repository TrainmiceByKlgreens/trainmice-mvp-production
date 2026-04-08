# Resend Email Integration Setup

## Overview

The backend has been refactored to use **Resend API** instead of SMTP for sending emails. This provides better reliability, deliverability, and easier configuration.

## Environment Variables

Add these environment variables to your Railway deployment (or `.env` for local development):

### Required
- `RESEND_API_KEY` - Your Resend API key (starts with `re_`)
  - Example: `re_aApyA5zQ_F4eENvfkLkvWoLkxMvGnkUPA`

### Optional
- `RESEND_FROM_EMAIL` - The verified sender email address in Resend
  - Default: `noreply@trainmice.com`
  - **Important**: This email domain must be verified in your Resend dashboard
  - Format: `name@yourdomain.com` or `yourdomain.com` (if domain is verified)

## Setup Steps

1. **Get your Resend API Key**
   - Sign up at https://resend.com
   - Go to API Keys section
   - Create a new API key
   - Copy the key (starts with `re_`)

2. **Verify your domain** (for production)
   - In Resend dashboard, go to Domains
   - Add your domain (e.g., `trainmice.com`)
   - Add the DNS records provided by Resend to your domain's DNS settings
   - Wait for verification (usually takes a few minutes)

3. **Set environment variables in Railway**
   - Go to your Railway project → Variables
   - Add `RESEND_API_KEY` with your API key
   - Add `RESEND_FROM_EMAIL` with your verified email (e.g., `noreply@trainmice.com`)

## Email Functionality

The following email functionality is now powered by Resend:

- ✅ **Email Verification** - Sent when users sign up (CLIENT and TRAINER roles)
- ✅ **Resend Verification** - Users can request a new verification email

## Testing

After setting up the environment variables:

1. **Test signup flow:**
   - Sign up as a CLIENT or TRAINER
   - Check your email inbox for the verification email
   - Click the verification link
   - Verify that you're redirected to the success page

2. **Test resend verification:**
   - Try to login with an unverified account
   - Use the resend verification endpoint
   - Check email for the new verification link

## Troubleshooting

### Emails not sending
- Check that `RESEND_API_KEY` is set correctly
- Verify the API key is active in Resend dashboard
- Check Railway logs for error messages

### "Domain not verified" errors
- Make sure `RESEND_FROM_EMAIL` uses a verified domain
- For testing, you can use Resend's test domain: `onboarding@resend.dev`
- For production, verify your domain in Resend dashboard

### Email delivery issues
- Check Resend dashboard → Logs for delivery status
- Verify recipient email address is valid
- Check spam folder

## Migration Notes

- **Old SMTP variables** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) are deprecated but kept for backward compatibility
- The system will use Resend if `RESEND_API_KEY` is set
- If `RESEND_API_KEY` is not set, email sending will be disabled (logs warning)

## API Limits

Resend free tier includes:
- 3,000 emails/month
- 100 emails/day

For higher limits, upgrade your Resend plan.

