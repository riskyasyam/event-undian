# JWT Structure (Admin Session)

Dokumen ini menjelaskan struktur JWT yang sedang dipakai pada aplikasi ini berdasarkan implementasi saat ini.

## Ringkasan

- Tipe auth: session berbasis JWT
- Lokasi token: HTTP-only cookie bernama admin_session
- Algoritma tanda tangan: HS256
- Secret: SESSION_SECRET (environment variable)
- Durasi session: 7 hari

Referensi implementasi:
- [lib/auth.ts](lib/auth.ts)
- [app/api/auth/login/route.ts](app/api/auth/login/route.ts)
- [app/api/auth/session/route.ts](app/api/auth/session/route.ts)
- [app/api/auth/logout/route.ts](app/api/auth/logout/route.ts)
- [middleware.ts](middleware.ts)

## Struktur JWT

JWT terdiri dari 3 bagian:

1. Header
2. Payload
3. Signature

Secara konsep:

HEADER.PAYLOAD.SIGNATURE

### 1) Header

Header yang dipakai:

- alg: HS256
- typ: JWT

### 2) Payload

Claim payload yang dibuat saat login:

- adminId: ID admin
- username: username admin
- iat: issued at (dibuat otomatis)
- exp: expiration time (iat + 7 hari)

Contoh bentuk payload:

{
	"adminId": "clx123...",
	"username": "admin",
	"iat": 1760000000,
	"exp": 1760604800
}

Catatan: claim iat dan exp dibuat oleh jose melalui setIssuedAt() dan setExpirationTime().

### 3) Signature

Signature dibuat dengan:

- Algoritma: HS256
- Key: SESSION_SECRET

Jika token diubah, verifikasi akan gagal dan session dianggap tidak valid.

## Cookie Session

Token disimpan ke cookie dengan konfigurasi:

- name: admin_session
- httpOnly: true
- secure: true saat production, false saat development
- sameSite: lax
- maxAge: 7 hari
- path: /

Implikasi keamanan:

- httpOnly melindungi token dari akses JavaScript browser (mengurangi risiko XSS token theft).
- sameSite lax membantu mengurangi risiko CSRF pada request lintas situs.

## Alur Auth

### Login

1. Client kirim username + password ke endpoint login.
2. Server validasi kredensial.
3. Jika valid, server membuat JWT berisi adminId dan username.
4. JWT disimpan ke cookie admin_session.

Endpoint: POST /api/auth/login

### Session Check

1. Endpoint membaca cookie admin_session.
2. Token diverifikasi menggunakan SESSION_SECRET.
3. Jika valid, response berisi data session admin.

Endpoint: GET /api/auth/session

### Middleware Protection

- Semua route admin dilindungi, kecuali halaman login.
- Jika token tidak ada / invalid, user diarahkan ke /admin/login.
- Jika user sudah valid dan membuka /admin/login, user diarahkan ke /admin/dashboard.

### Logout

- Cookie admin_session dihapus.

Endpoint: POST /api/auth/logout

## Environment Variable Wajib

Pastikan SESSION_SECRET sudah terisi di environment:

SESSION_SECRET="isi-dengan-random-secret-kuat"

Rekomendasi: gunakan random secret panjang (minimal 32 byte entropy).
