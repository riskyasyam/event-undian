# MU Travel Milad Event - QR Attendance & Lottery System

A production-ready QR attendance tracking and lottery system built for MU Travel Milad Event.

## Features

- ✅ **QR Code Check-in**: Generate unique QR codes for each participant
- 📊 **Real-time Attendance Tracking**: Monitor who has checked in
- 🎲 **Fair Lottery System**: Server-side randomization with transaction safety
- 📁 **Excel Upload**: Bulk upload participants via Excel files
- 🔒 **Secure Admin Panel**: Protected admin routes with session-based authentication
- ☁️ **Serverless-ready**: Optimized for Vercel deployment with Supabase

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma
- **Deployment**: Vercel

## Getting Started

### 1. Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- A code editor (VS Code recommended)

### 2. Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` and fill in your Supabase credentials:

```env
# Database URLs
DATABASE_URL="postgresql://postgres:[password]@[project-ref].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@[project-ref].supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# App Configuration
BASE_URL="http://localhost:3000"

# Admin Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET="your-random-secret-key-here"
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### 5. Create Initial Admin User

```bash
# Run the seed script
npm run seed
```

Default admin credentials:
- Username: `admin`
- Password: `admin123`

**⚠️ IMPORTANT: Change these credentials after first login!**

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Admin Workflow

1. **Login**: Navigate to `/admin/login`
2. **Create Event**: From dashboard, create a new event
3. **Upload Participants**:
   - Go to Participants page
   - Upload Excel file with columns: `nama`, `email` (optional), `nomor_telepon` (optional)
   - Download QR codes for each participant
4. **Add Prizes**:
   - Go to Prizes page
   - Add prizes with number of winners
5. **Draw Lottery**:
   - Go to Lottery Draw page
   - Click "Draw" button for each prize
   - Winners are selected randomly from attended participants

### Participant Experience

1. Receive QR code via email/WhatsApp
2. Scan QR code at event entrance
3. System records attendance automatically
4. Eligible for lottery draw

## Excel Template

Create an Excel file with these columns:

| nama          | email              | nomor_telepon |
|---------------|--------------------|---------------|
| John Doe      | john@example.com   | 081234567890  |
| Jane Smith    | jane@example.com   | 081234567891  |

- `nama` (required): Participant name
- `email` (optional): Email address
- `nomor_telepon` (optional): Phone number

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
# Build for production
npm run build

# Start production server locally
npm start
```

### Database Migrations in Production

```bash
# Run migrations against DIRECT_URL
npx prisma migrate deploy
```

**⚠️ Important**: Always use `DATABASE_URL` (pooled) for runtime queries and `DIRECT_URL` only for migrations.

## Security Features

- Session-based authentication with JWT
- HTTP-only cookies
- Protected admin routes via middleware
- Server-side lottery logic (no client manipulation)
- Prisma transactions for data consistency
- Password hashing with bcrypt

## License

© 2026 MU Travel. All rights reserved.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
