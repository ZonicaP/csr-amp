# CSR AMP

Customer service portal for AMP memberships. Next.js, Material UI, Prisma, and Postgres.

## Prerequisites

Install these before cloning:

- Node.js 20 or newer, with npm
- Docker Desktop, running
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)

Check them:

```bash
node -v
npm -v
docker info
supabase --version
```

## First-time setup

```bash
git clone https://github.com/ZonicaP/csr-amp.git
cd csr-amp
npm install
```

`npm install` runs `prisma generate`.

Create `.env` in the project root with the local database. The database scripts talk to this Postgres directly, and the Next.js app reads the same file:

```bash
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

Start the local database and apply migrations:

```bash
npm run db:local
```

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The health check is [http://localhost:3000/api/health](http://localhost:3000/api/health) and should return `{"status":"ok"}`.

Supabase Studio for the local database is [http://127.0.0.1:54323](http://127.0.0.1:54323).

## Day to day

Stop the local database when you are done:

```bash
npm run db:stop
```

After the database is already running, create a migration from schema changes with:

```bash
npm run db:migrate:local
```

Wipe the local database and reapply migrations with:

```bash
npm run db:reset:local
```

## Hosted database

To point the app at the hosted Supabase project instead of the local one, replace `.env` with that project's pooled and direct connection strings. `.env.example` shows the shape. Then apply migrations with:

```bash
npm run db:deploy
```

Do not commit `.env`.
