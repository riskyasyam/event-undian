# MU Travel Milad Event System - Architecture Overview

## System Architecture

### Tech Stack
- **Frontend**: Next.js 14 App Router + React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase PostgreSQL
- **ORM**: Prisma 5.22.0
- **Authentication**: JWT with jose library
- **Deployment**: Vercel (serverless)

### Project Structure

```
mu-travel-undian/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin UI (protected)
│   ├── api/               # API endpoints
│   ├── scan/              # Public QR scan page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── lib/                   # Core utilities
│   ├── auth.ts           # JWT authentication
│   ├── prisma.ts         # Prisma singleton
│   └── utils.ts          # Helper functions
├── services/              # Business logic layer
│   ├── admin.service.ts
│   ├── event.service.ts
│   ├── peserta.service.ts
│   ├── hadiah.service.ts
│   ├── lottery.service.ts
│   └── scan.service.ts
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Initial data seeder
└── middleware.ts          # Route protection
```

## Key Design Patterns

### 1. Clean Architecture / Layered Architecture

```
┌─────────────────────────────────────┐
│         UI Layer (App Router)       │
│   - Admin pages                     │
│   - Public scan page                │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│      API Layer (API Routes)         │
│   - Authentication                  │
│   - Request validation              │
│   - Response formatting             │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│   Service Layer (Business Logic)    │
│   - Event management                │
│   - Participant management          │
│   - Lottery logic (with transactions)│
│   - Scan processing                 │
└───────────┬─────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│    Data Layer (Prisma ORM)          │
│   - Database queries                │
│   - Transactions                    │
│   - Type safety                     │
└─────────────────────────────────────┘
            │
            ▼
    [Supabase PostgreSQL]
```

### 2. Singleton Pattern - Prisma Client

```typescript
// lib/prisma.ts
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Why?** Prevents creating multiple Prisma Client instances in serverless environment.

### 3. Transaction Pattern - Lottery Logic

```typescript
// services/lottery.service.ts
export async function draw Lottery(input: DrawLotteryInput) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get prize details
    // 2. Get eligible participants
    // 3. Randomize selection
    // 4. Create winner records
    // 5. Update participant flags
    return winners;
  });
}
```

**Why?** Ensures atomicity, prevents race conditions, no duplicate winners.

## Database Design

### Entity Relationship Diagram

```
┌─────────────┐
│   Event     │
│─────────────│
│ id (PK)     │
│ nama_event  │
│ tanggal     │
│ lokasi      │
│ aktif       │
└─────┬───────┘
      │ 1
      │
      │ N
┌─────▼───────┐         ┌─────────────┐
│  Peserta    │         │   Hadiah    │
│─────────────│         │─────────────│
│ id (PK)     │         │ id (PK)     │
│ event_id FK │         │ event_id FK │
│ nama        │         │ nama_hadiah │
│ token       │         │ jumlah_win  │
│ status_hadir│         └─────┬───────┘
│ sudah_menang│               │ 1
└─────┬───────┘               │
      │ 1                     │ N
      │                       │
      │ 1                     │
      └───────────┬───────────┘
                  │
                  │
          ┌───────▼───────┐
          │   Pemenang    │
          │───────────────│
          │ id (PK)       │
          │ peserta_id FK │
          │ hadiah_id FK  │
          │ drawn_at      │
          └───────────────┘
```

### Key Indexes

```prisma
@@index([event_id])                          // Fast event lookups
@@index([token])                             // Fast QR scans
@@index([status_hadir, sudah_menang])        // Lottery eligibility
```

## Critical Features

### 1. Serverless-Safe Database Access

```typescript
// ✅ CORRECT - Use pooled connection
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"

// ❌ WRONG - Direct connection in runtime
DATABASE_URL="postgresql://...supabase.com:5432/postgres"
```

### 2. Server-Side Lottery Randomization

```typescript
// ✅ CORRECT - Server-side
export async function drawLottery() {
  const eligible = await getPeserta();
  const shuffled = shuffleArray(eligible);  // Server function
  const winners = shuffled.slice(0, count);
  // Save to database
}

// ❌ WRONG - Client-side (manipulable)
const handleDraw = () => {
  const shuffled = Math.random()...  // Client code!
}
```

### 3. Transaction-Based Winner Selection

```typescript
await prisma.$transaction(async (tx) => {
  // All or nothing:
  // - Create Pemenang records
  // - Update Peserta.sudah_menang
  // - If any fails, all rollback
});
```

**Prevents:**
- Duplicate winners
- Partial database updates
- Race conditions in concurrent draws

### 4. Authentication & Authorization

```typescript
// middleware.ts - Protects admin routes
export async function middleware(request: NextRequest) {
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const session = await verifySession(token);
    if (!session) {
      return NextResponse.redirect('/admin/login');
    }
  }
}
```

## Security Features

1. **Session Management**
   - HTTP-only cookies
   - JWT with short expiration
   - Secure flag in production

2. **Password Security**
   - Bcrypt hashing with salt rounds
   - No plain passwords in database

3. **Server-Side Validation**
   - All critical operations on server
   - No client-side lottery logic

4. **Database Security**
   - Connection pooling
   - Prepared statements (Prisma)
   - No SQL injection possible

## Performance Optimizations

1. **Connection Pooling**
   - Supabase pooler (pgbouncer)
   - Prevents connection exhaustion

2. **Composite Indexes**
   - Fast eligibility queries
   - Optimized for lottery selection

3. **Prisma Client Singleton**
   - No multiple instances
   - Efficient in serverless

4. **Selective Data Loading**
   - Only fetch needed fields
   - Use Prisma `select` and `include`

## Deployment Checklist

- [ ] Supabase project created
- [ ] Environment variables configured
- [ ] Prisma migrations run
- [ ] Initial admin user created
- [ ] Vercel project set up
- [ ] Production URLs updated
- [ ] SSL/HTTPS enabled
- [ ] Database backups enabled

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/session` - Check session

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create event
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Participants
- `GET /api/peserta/event/[eventId]` - Get participants
- `POST /api/peserta/upload` - Upload Excel

### Prizes
- `GET /api/hadiah/event/[eventId]` - Get prizes
- `POST /api/hadiah` - Create prize
- `DELETE /api/hadiah/[id]` - Delete prize

### Lottery
- `POST /api/lottery/draw` - Draw winners (server-side)
- `GET /api/lottery/winners/[eventId]` - Get winners

### Public
- `POST /api/scan` - Process QR scan

## Common Patterns

### Error Handling
```typescript
try {
  const result = await service.method();
  return NextResponse.json(successResponse(result));
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json(
    errorResponse('Operation failed', error),
    { status: 500 }
  );
}
```

### Authentication Check
```typescript
export async function GET() {
  try {
    await requireAuth();  // Throws if not authenticated
    // ... protected code
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }
  }
}
```

## Testing Checklist

- [ ] Admin login/logout
- [ ] Event create/edit/delete
- [ ] Participant upload (Excel)
- [ ] QR code generation
- [ ] QR code scanning
- [ ] Prize management
- [ ] Lottery draw
- [ ] Winner selection (no duplicates)
- [ ] Multiple events support

## Monitoring & Maintenance

### Logging
- All critical operations logged to console
- Errors include stack traces in development

### Database Maintenance
- Regular backups via Supabase
- Monitor connection pool usage
- Check slow queries in Supabase dashboard

### Performance Monitoring
- Vercel Analytics for page load times
- Supabase Dashboard for database metrics

---

**Last Updated**: February 2026
**Version**: 1.0.0
