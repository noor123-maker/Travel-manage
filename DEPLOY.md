Deployment guide — start here
=================================

This guide walks you step-by-step from zero to a live deployment on Vercel (recommended for Next.js). It also covers the required environment variables and quick notes for MongoDB Atlas (fallback APIs) and Supabase (recommended DB + auth).

1) Choose hosting (we recommend Vercel)
- Create a Vercel account and connect your GitHub repository.
- Vercel auto-detects Next.js apps. Use the default Next.js settings.

2) Prepare environment variables
- In your Vercel project settings -> Environment Variables, add the values from the list below.

Required environment variables (set these in Vercel for Production and Preview):
- SIGNUP_CODE — invite/signup code used for server-side validation (e.g. Noru007)
- JWT_SECRET — secret used to sign JWTs for the fallback auth (keep private)
- MONGO_URI — MongoDB Atlas connection string (if you use the fallback Mongo APIs)
- NEXT_PUBLIC_SUPABASE_URL — Supabase project URL (if using Supabase)
- NEXT_PUBLIC_SUPABASE_ANON_KEY — Supabase anon key (client-side)
- SUPABASE_SERVICE_KEY — Supabase service role key (server-side only — mark as secret)
- NEXT_PUBLIC_BASE_URL — your production base URL (optional, helpful for absolute links)

3) Provision a database / auth
- Option A (recommended): Supabase
  - Create a Supabase project.
  - Add a `companies` table and `trips` table (or use the app's existing schema). You can store `allowed_trips` on the companies table.
  - Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.
  - Use SUPABASE_SERVICE_KEY for server-side calls where needed.

- Option B (fallback / existing APIs): MongoDB Atlas
  - Create a free Atlas cluster and database.
  - Obtain the connection string and set `MONGO_URI` in Vercel.
  - Ensure `JWT_SECRET` is set (match what's used by the server routes).

4) Connect repository & deploy
- In Vercel: Import Project → select your GitHub repo.
- Build command: `npm run build` (default)
- Output directory: default (Next.js)
- Add the environment variables (see step 2) to the Vercel project.
- Deploy. Vercel will provide a URL like `https://your-app.vercel.app`.

5) Domain & HTTPS
- Add your custom domain in the Vercel project settings and follow the DNS instructions.
- Vercel provisions HTTPS automatically.

6) Local production run (test before deploying)
- Install deps: `npm ci`
- Build: `npm run build`
- Start production server: `npm run start`

7) Notes and small checks
- Ensure server routes that require secrets (MONGO_URI, JWT_SECRET, SUPABASE_SERVICE_KEY) are only available server-side and those secrets are stored in Vercel as Environment Variables.
- If you use Supabase, prefer storing `allowed_trips` in a `companies` table; then update the signup and update routes to write there.

8) Optional: Mobile (Capacitor)
- Use the hosted web URL (the Vercel URL) as the web asset for Capacitor builds.
- For Android: `npx cap sync android` then open in Android Studio and build signed AAB.

If you'd like, I can:
- prepare a `.env.example` file in the repo with the exact keys to set in Vercel,
- add a short `vercel.json` (optional) with minimal settings,
- or walk step-by-step while you provision Supabase and add env vars in Vercel.

End of guide.
