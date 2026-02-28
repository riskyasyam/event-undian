# Quick Start Guide

## Setup in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database

Get your Supabase credentials from [supabase.com](https://supabase.com):
- Create new project
- Go to Settings > Database
- Copy connection strings

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:[password]@[project].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@[project].supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SESSION_SECRET="run: openssl rand -base64 32"
BASE_URL="http://localhost:3000"
```

### 3. Setup Database
```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`

**⚠️ Change immediately after first login!**

## First Steps

1. Login at `/admin/login`
2. Create an event
3. Upload participants (Excel: columns `nama`, `email`, `nomor_telepon`)
4. Download QR codes
5. Add prizes
6. Draw lottery!

## Need Help?

See [README.md](README.md) for full documentation
See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
