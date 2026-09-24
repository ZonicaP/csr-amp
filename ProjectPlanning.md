# Project planning

- Used Grok 4.7 to set up a blank project with this stack: Next.js, Material UI, PostgreSQL, Vercel, Supabase, Prisma models, REST.
- Deciding factors: quick setup, MCP connections with Supabase and Vercel, and Next.js server rendering.
- Set up skill files: the Vercel React best practices skill, and a skill file for the theme built from the AMP Memberships website.
- Set up the needed scripts in package.json: start the local database and apply migrations, create local migrations, reset the local database, stop it, and deploy migrations to the hosted database.
- Prompted CI/CD setup to run migrations and deploy on push to the main branch.
- In principle, pull requests should be submitted and approved before merging into main, with a staging environment and possibly a develop branch. For this project, pushes to main deploy directly.
- Used the Vercel and Supabase MCP connections to set up the projects.
- CSR accounts are invite-only. An admin assigns roles on the invite, the CSR sets a password to activate the account, and access is the combined permissions of those roles.
- Planned the CSR model separately from customer users: name, surname, email, display name, and roles (ADMIN, SUPERVISOR, AGENT). Roles are assigned bundles, permissions are checked in code, a CSR can hold more than one role, and ADMIN has every permission.
- Implemented registration and sign-in: login, invite signup, forgot password, and reset password, mobile-first and using the AMP theme.
- Added React error boundaries so a page crash and a root layout crash both show a fallback instead of breaking the app.

## Train of thought

- Started with a blank Next.js app, Material UI, Prisma, and a hosted Postgres database, and deployed that shell before building features. The point was a real stack a reviewer can run, not a UI mock.
- CSR staff are a separate model from customers. Sign-up is invite-only: an admin invites, the CSR sets a password, and roles (ADMIN, SUPERVISOR, AGENT) grant permissions. There is no open signup.
- Built the sign-in, invite signup, forgot password, and reset password screens mobile-first with the AMP theme before any customer tools.
- Email is our own SMTP service, not a hosted email product. One base layout, then invite, verify-account, and reset-password messages. A CSR who has not verified their email is sent to the verification page after sign-in.
- Signed-in layout: a left sidebar on desktop, and a top bar plus a Customers tab on mobile. Error boundaries sit at the root and inside the shell so a broken page keeps the navigation.
- Customers list is a real query, 20 rows per page from the server. Search waits until typing pauses, then filters on the server. The list is a table on desktop and compact cards on a phone.
- `EXPLAIN ANALYZE` on the search showed a sequential scan, which is fine for a few dozen rows. Added trigram indexes for case-insensitive contains, a sort index for last name and first name, and a digits-only phone column so `555010` matches `555-010-…`.
- Search treats each word on its own, so `amelia ng` finds Amelia Nguyen. Membership ids such as `AMP-10021` are searchable with or without the dash.
- Recent search pages are kept in a small client store. Coming back to Customers shows the last rows immediately, then refreshes them. Typing `brooks` then `brooks@` filters the rows already on screen before the server answers, so the list does not flash a loading state.
- If the exact search finds nobody, a close match runs on first name, last name, and email only. `brooks@exaple` returns the Brooks customers and the page says they are close matches. Phone numbers and membership ids stay exact. If the close match is also empty, the list stays empty.
- The exact search and the close-match search each use one query that returns the page and the total together.
- Clicking a customer opens their page: account, vehicles, the wash plan on each vehicle, and purchases. The plan on the vehicle is the membership. Account status and plan status were seeded separately, so a cancelled account can still show an active plan. That mismatch is mock data, not a product rule.
- Customer URLs use the membership id, such as `/customers/AMP-10041`, not the database id. Payment history includes failed charges and the decline reason. The log leaves those payment lines out so it stays an account timeline.
- Any email that should go to the customer goes to the signed-in CSR instead. The payment link, the 10% offer, the plate request, the refund notice, and the cancellation confirmation all follow that rule.
- Smart debug sits on the customer page. The CSR types what the customer is reporting, or picks a common issue. A standing “most likely” bar comes from the account itself and does not wait on the model. Groq only writes the answer.
- On a phone the debug dialog is two steps: the report, then the result. The standing bar stays on both, and Back returns to the report. The trigger is a bug icon, next to a menu icon for the same actions.
- Actions show only when they apply. An outstanding payment offers the payment link. A cancellation report offers cancel and 10% off together. A cancelled membership offers reactivate. A wrong plate emails the documents needed. A refund appears only when two successful charges of the same amount landed within two days. The standing bar keeps one action. The written answer gets the actions for that report. The vehicle card and the actions menu get the ones that fit the account.
- Cancel membership asks for a reason, then cancels the plans and the account and writes the reason on the log. Opened from Smart debug, that dialog hides Smart debug. Back brings it back. After it succeeds, the dialog says the membership was cancelled and the button becomes Close.
- The plate email lists the photo, the registration, and proof of ownership as bullets, and asks for them by email with the subject `Plate update` plus the membership id. It does not link back into the portal.
- Smart debug refuses questions that are not about this membership, including attempts to override its instructions. Each CSR can send 8 questions every 10 minutes. That count lives in the running server, so a restart starts a fresh window.
- Sign out moved off the navbar and the sidebar onto `/profile`. The signed-in name opens that page.

## Core expectations

- Clean code and proper abstractions: keep business logic out of route files and global helpers. Separate services, API routing, and database access.
- Production-ready mentality: add automated unit or integration tests for the primary logic paths.
- Documentation and setup: `README.md` must include exact install steps, environment dependencies, and architectural tradeoffs.
- Commit history: use small, incremental, well-described commits rather than one finished-project upload.
