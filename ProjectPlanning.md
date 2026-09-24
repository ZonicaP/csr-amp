# Project planning

- Used Grok 4.7 to set up a blank project with this stack: Next.js, Material UI, PostgreSQL, Vercel, Supabase, Prisma models, REST.
- Deciding factors: quick setup, MCP connections with Supabase and Vercel, and Next.js server rendering.
- Set up skill files: the Vercel React best practices skill, and a skill file for the theme built from the AMP Memberships website.
- Set up the needed scripts in package.json: start the local database and apply migrations, create local migrations, reset the local database, stop it, and deploy migrations to the hosted database.
- Prompted CI/CD setup to run migrations and deploy on push to the main branch.
- In principle, pull requests should be submitted and approved before merging into main, with a staging environment and possibly a develop branch. For this project, pushes to main deploy directly.
- Used the Vercel and Supabase MCP connections to set up the projects.

## Core expectations

- Clean code and proper abstractions: keep business logic out of route files and global helpers. Separate services, API routing, and database access.
- Production-ready mentality: add automated unit or integration tests for the primary logic paths.
- Documentation and setup: `README.md` must include exact install steps, environment dependencies, and architectural tradeoffs.
- Commit history: use small, incremental, well-described commits rather than one finished-project upload.
