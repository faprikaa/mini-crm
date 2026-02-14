# Kopi Kita — Mini CRM

Aplikasi Mini CRM untuk kedai kopi **Kopi Kita**. Dibangun sebagai submission untuk posisi Fullstack Engineer di PlabsID.

Fitur utama: Login, Dashboard, Customer/User/Tag/Product/Penjualan Management dengan UI neobrutalism.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, Turbopack)
- **Database**: PostgreSQL + Prisma 7
- **Auth**: NextAuth v5 (Credentials, JWT)
- **UI**: Tailwind CSS v4 + [Neobrutalism Components](https://neobrutalism.dev)
- **Package Manager**: bun

## Fitur

| Modul | Deskripsi |
|-------|-----------|
| Login | Autentikasi email/password, session JWT, redirect otomatis |
| Dashboard | Statistik utama + desain section time-based analytics (harian/mingguan/bulanan) |
| Customers | CRUD customer, filter by tag, relasi favorite product (select + creatable) |
| User Management | CRUD user admin, search by nama/email, role (Admin / Super Admin) |
| Tags Management | CRUD interest tag, quick-add inline, search, warna tag unik per nama |
| Products Management | CRUD produk (nama, harga, kategori, deskripsi), sortable + pagination table |
| Sales Management | CRUD sales (produk, customer opsional, qty, total, soldAt), sortable + pagination table |

## Struktur Folder

```
src/
├── app/
│   ├── api/auth/[...nextauth]/   # NextAuth route handler
│   ├── customers/                # Customers management (CRUD + filter)
│   ├── dashboard/
│   │   ├── layout.tsx            # Sidebar + navigation
│   │   └── page.tsx              # Dashboard home (stats + analytics design)
│   ├── products/                 # Products management (CRUD)
│   ├── sales/                    # Sales management (CRUD)
│   ├── tags/                     # Tags management (CRUD)
│   ├── users/                    # User management (CRUD)
│   └── login/                    # Login page + server action
├── components/ui/                # Neobrutalism shadcn components
├── generated/prisma/             # Prisma generated client
├── lib/
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma singleton
│   └── utils.ts                  # cn() utility
├── types/
│   └── next-auth.d.ts            # Session type augmentation
└── middleware.ts                  # Route protection
prisma/
├── schema.prisma                 # Data model (User, Customer, Tag, Product, Sale, Role)
└── seed.ts                       # Seed: admin, tags, products, customers, sales
```

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` — isi `DATABASE_URL` dengan connection string PostgreSQL kamu (bisa pakai [Neon](https://neon.tech) gratis) dan generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Setup database

```bash
bun prisma generate
bun prisma db push
```

### 4. Seed data

```bash
bun prisma db seed
```

Akan membuat:
- 1 akun Super Admin: `admin@kopikita.com` / `password123`
- 14 sample tags
- 6 sample products
- 6 sample customers (dengan relasi favorite product)
- 8 sample sales records (soldAt tersebar untuk kebutuhan analytics)

### 5. Jalankan dev server

```bash
bun dev
```

Buka [http://localhost:3000](http://localhost:3000) — akan redirect ke halaman login.

## Login Default

| Email | Password | Role |
|-------|----------|------|
| admin@kopikita.com | password123 | Super Admin |

## Scripts

| Command | Deskripsi |
|---------|-----------|
| `bun dev` | Development server (Turbopack) |
| `bun run build` | Production build |
| `bun start` | Start production server |
| `bun lint` | ESLint |
| `bun prisma generate` | Generate Prisma client |
| `bun prisma db push` | Push schema ke database |
| `bun prisma db seed` | Seed database |
| `bunx tsc --noEmit` | Typecheck project |
| `bun prisma studio` | Buka Prisma Studio (GUI) |

## Deploy

Deploy ke [Vercel](https://vercel.com) — pastikan set environment variables (`DATABASE_URL`, `AUTH_SECRET`) di dashboard Vercel.
