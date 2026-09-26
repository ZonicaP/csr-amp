# CSR AMP

Customer service portal for AMP car-wash memberships. CSRs look up a member, handle the call, and change the account from one place.

The app is hosted at [https://csr-amp-ten.vercel.app/](https://csr-amp-ten.vercel.app/).

Access is invite-only. Email [pietersen.zonica@gmail.com](mailto:pietersen.zonica@gmail.com) to be invited as a CSR. The invite email has a link to set a password. After that, sign in and verify the email address.

For testing, every email about a customer is sent to the CSR who is signed in. It is not sent to the customer. That includes a payment link, a discount offer, cancellation, a refund request, plate documents, a plan change, and an account update. Invite, verification, and password-reset messages are for staff, so those go to the CSR address on that form.

## Stack

- Next.js (App Router) and React
- Material UI
- REST API routes
- PostgreSQL, hosted on Supabase
- Prisma
- Vercel, with a deploy on push to `main` that applies migrations
- SMTP email
- Groq, for Smart debug answers when an API key is configured

The project was built with Grok 4.7. Two local skill files guide that work: Vercel’s React best practices, and an AMP theme skill taken from the [AMP Memberships](https://ampmemberships.com/) site for color, type, and buttons.

## What you can do

Sign in, reset a forgotten password, and open your profile from the AMP logo. Home and profile are the same page.

**Customers.** Search by name, email, phone, or membership id. Results update as you type. Open a customer for Info, Vehicles, Payments, and Logs. Edit their contact details. The address looks like `/customers/AMP-10033`.

**Vehicles.** See each vehicle and its plan. Basic Wash, Unlimited Wash, and The Works are color-coded. A cancelled plan uses a cancelled color. Add a vehicle with a year, a make and model suggested from cars, trucks, and SUVs, and a plate. Open a vehicle to change the plate, add or replace the plan, remove a plan, or transfer a plan to another vehicle. One vehicle has one active plan.

**Payments and account actions.** Review charges, including a failed payment and why it failed. Email a payment link. Offer a discount. Cancel a membership only after a confirmation and a reason. Reactivate a cancelled membership. Request a refund when a second charge of the same amount landed within two days. Email plate documents once for the whole account. Those messages arrive in the signed-in CSR’s inbox.

**Calls.** Start a call from the header. On the customer page, **This is the caller** links that membership to the open call. Undo clears a wrong link. End the call after confirming the reference was given and the caller had nothing else. Request a call back from the same dialog. An agent can escalate that callback to an admin. Search calls the same way as customers, filter to callbacks, and mark a callback as called. A customer’s Logs page lists their calls under the account events.

**Smart debug.** On a customer, ask what they are reporting or pick a common issue. A most likely note sits on the Info page. Answers stay on that membership, including coupons, a single wash, a card update, and previous calls. Coupon codes and expiry dates are not invented. The customer redeems coupons, buys a single wash, and changes their card in the AMP app. If a charge failed, the action in this portal is to email a payment link.

**Team.** An admin sees the team, invites CSRs, assigns roles, and can disable an account.

An agent can look up customers, edit contact details, add or remove a plan, transfer a plan, cancel a membership, and resolve an overdue payment. Discounts stop at 10%. An admin can do the same with no discount limit, and is the only role that can invite or change staff.

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
