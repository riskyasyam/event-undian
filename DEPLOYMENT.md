# Deployment Guide - MU Travel Milad Event System

## Prerequisites

Before deploying, ensure you have:
- A Supabase account and project set up
- A Vercel account
- Your code pushed to GitHub

## Step 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for project to finish provisioning

### 1.2 Get Database Credentials

1. In your Supabase project dashboard, go to **Settings > Database**
2. Copy the following connection strings:
   - **Connection Pooling** (port 6543) - for runtime queries
   - **Direct Connection** (port 5432) - for migrations only

Example:
```
# Connection Pooling (Runtime)
postgresql://postgres.xxxxx:password@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true

# Direct Connection (Migrations)
postgresql://postgres.xxxxx:password@aws-0-region.supabase.com:5432/postgres
```

### 1.3 Get API Keys

1. Go to **Settings > API**
2. Copy:
   - Project URL
   - Project API keys > `anon` `public` key

## Step 2: Run Database Migrations

### 2.1 Set Up Environment Variables Locally

Create `.env` file:

```env
DATABASE_URL="[your-connection-pooling-url]"
DIRECT_URL="[your-direct-connection-url]"
NEXT_PUBLIC_SUPABASE_URL="[your-project-url]"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SESSION_SECRET="[generate-random-32-char-string]"
BASE_URL="http://localhost:3000"
```

### 2.2 Generate Session Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | %{ Get-Random -Maximum 256 }))
```

### 2.3 Run Migrations

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Create initial admin user
npm run seed
```

You should see:
```
✅ Created admin user: { username: 'admin', password: 'admin123' }
```

## Step 3: Deploy to Vercel

### 3.1 Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/mu-travel-undian.git
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Click **Add New > Project**
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3.3 Add Environment Variables

In Vercel project settings > Environment Variables, add:

```
DATABASE_URL=[your-connection-pooling-url-with-pgbouncer=true]
DIRECT_URL=[your-direct-connection-url]
NEXT_PUBLIC_SUPABASE_URL=[your-project-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SESSION_SECRET=[your-generated-secret]
BASE_URL=[your-vercel-url]
```

**Important:**
- For `BASE_URL`, use your Vercel deployment URL (e.g., `https://your-project.vercel.app`)
- Make sure `DATABASE_URL` includes `?pgbouncer=true`
- Make sure `DIRECT_URL` does NOT include `?pgbouncer=true`

### 3.4 Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. Your app will be available at `https://your-project.vercel.app`

## Step 4: Verify Deployment

### 4.1 Test Admin Login

1. Go to `https://your-project.vercel.app/admin/login`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. **IMPORTANT**: Change password immediately after first login

### 4.2 Test QR Scan Flow

1. Create an event in dashboard
2. Upload test participants
3. Download a QR code
4. Scan it to test the attendance system

## Step 5: Production Checklist

- [ ] Database migrations completed successfully
- [ ] Admin user created and password changed
- [ ] All environment variables set correctly in Vercel
- [ ] BASE_URL points to production domain
- [ ] SESSION_SECRET is a strong random string
- [ ] Test admin login works
- [ ] Test QR scan works
- [ ] Test lottery draw works
- [ ] Test Excel upload works

## Common Issues

### Issue: "Can't reach database server"

**Solution:**
- Verify DATABASE_URL uses connection pooling (port 6543)
- Check `?pgbouncer=true` is in DATABASE_URL
- Ensure Supabase project is not paused

### Issue: "Migration failed"

**Solution:**
- Make sure DIRECT_URL is set for migrations
- Run migrations from local machine first
- Check database credentials are correct

### Issue: "Admin login not working"

**Solution:**
- Verify SESSION_SECRET is set
- Check that seed script ran successfully
- Try clearing browser cookies

### Issue: "QR codes not generating"

**Solution:**
- Ensure BASE_URL is set to your domain
- Check that participants were uploaded successfully
- Verify qrcode package is installed

## Updating Production

### Deploy New Changes

```bash
# Commit changes
git add .
git commit -m "Update: [description]"
git push origin main
```

Vercel will automatically deploy the new version.

### Run New Migrations

If you added new database migrations:

```bash
# From local machine with DIRECT_URL set
npx prisma migrate deploy
```

Or use Vercel CLI:

```bash
vercel env pull .env.production
npx prisma migrate deploy
```

## Monitoring

- Check Vercel Analytics for traffic and performance
- Monitor Supabase Dashboard for database usage
- Set up error tracking (e.g., Sentry) for production errors

## Support

For issues:
1. Check Vercel deployment logs
2. Check Supabase database logs
3. Review error messages in browser console
4. Contact development team

---

**Last Updated**: February 2026
