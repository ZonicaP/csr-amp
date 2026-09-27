# CSR AMP

Customer service portal for AMP car-wash memberships. A CSR looks up a member, handles the call, and changes the account from one place.

Live app: [https://csr-amp-ten.vercel.app/](https://csr-amp-ten.vercel.app/).

Access is invite-only. Email [pietersen.zonica@gmail.com](mailto:pietersen.zonica@gmail.com) for an invite. An invited email can also sign up without the link. The link still fills that email in and locks it. Then sign in and verify the address.

Customer mail goes to the member. That covers a payment link, a discount, cancellation, a refund request, plate documents, a plan change, and an account update. Seeded `@example.com` addresses cannot be delivered, so those messages go to the signed-in CSR and the email says so. Staff invites, verification, and password resets go to the CSR address on the form.

## Stack

Next.js App Router, React, Material UI, REST routes, PostgreSQL on Supabase, Prisma, SMTP, and Groq for Smart debug when `GROQ_API_KEY` is set. A push to `main` deploys on Vercel and applies migrations.

The project was built with Grok 4.7, using Vercel’s React best practices and an AMP theme taken from [ampmemberships.com](https://ampmemberships.com/).

## What you can do

Sign in, reset a forgotten password, and open your profile from the AMP logo. Home and profile are the same page. A CSR can change their own first and last name there.

**Customers.** Search by name, email, phone, or membership id. Results update as you type. **On a call** limits the list to memberships on an open call. Open a customer for Info, Vehicles, Payments, and Logs, for example `/customers/AMP-10033`. Edit their contact details. A phone number needs 10 to 15 digits.

**Vehicles.** Each vehicle has one active plan: Basic Wash, Unlimited Wash, or The Works, each with its own color. A cancelled plan uses the cancelled color. Add a vehicle with a year, a make and model from cars, trucks, and SUVs, and a plate. Open a vehicle to change the plate, replace or remove the plan, or transfer it to another vehicle on the same membership.

**Account.** Review charges, including a failed payment and why it failed. Email a payment link. Paying it records the charge and sets an overdue membership to active, so a wash can start. No card number is entered. A cancelled membership says it has been cancelled and has no Pay button. Offer, update, or remove a discount. Cancel only after a confirmation and a reason, or reactivate a cancelled membership. Request a refund when a second charge of the same amount landed within two days. Email plate documents once for the account.

**Calls.** Start a call from the header. **This is the caller** links the open call to the membership. A membership already on an open call stays with that CSR and cannot be linked to a second call. Undo clears a wrong link. The customer list shows who is on a call, and with which CSR, from a live socket. End the call after confirming the reference was given and the caller had nothing else. That opens the call at `/calls/C-#####`. Transfer keeps the same reference and tells the other CSR, who must not already be on a call. Request a call back from the same dialog. Search calls, filter to callbacks, and mark a callback as called. A customer’s Logs page lists their calls with the account events.

**Smart debug.** On a customer, ask what they are reporting or pick a common issue. Info also shows the most likely standing issue. Answers stay on that membership. Coupons, a single wash, and changing a card happen in the AMP app. If a charge failed, email a payment link.

**Team.** An admin invites CSRs, assigns roles, and can disable an account. An agent can do the customer work above. Discounts stop at 10% for an agent. An admin has no discount limit and is the only role that can invite or change staff.

## Prerequisites

Install these before cloning:

- Node.js 24 or newer, with npm
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

## Local CSR account

On a fresh local database there is no one to sign in as until the first admin is seeded. Add these to `.env`:

```bash
AUTH_SECRET="replace-with-a-long-random-string"
CSR_ADMIN_EMAIL="pietersen.zonica@gmail.com"
CSR_ADMIN_PASSWORD="replace-with-at-least-8-characters"
CSR_ADMIN_NAME="Zonica"
CSR_ADMIN_SURNAME="Pietersen"
```

Then:

```bash
npm run db:seed
```

Sign in with that email and password. Invite another CSR from Team. For the hosted app, ask for an invite at [pietersen.zonica@gmail.com](mailto:pietersen.zonica@gmail.com) instead of seeding.

To send invite, verification, and password-reset emails, add an SMTP mailbox to `.env`:

```bash
APP_URL="http://localhost:3000"
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="mailer@example.com"
SMTP_PASSWORD="replace-with-the-mailbox-password"
EMAIL_FROM="AMP CSR <mailer@example.com>"
```

Without these values, the app reports that email is not configured and does not pretend the message was sent. Smart debug still answers from the account when `GROQ_API_KEY` is absent.
