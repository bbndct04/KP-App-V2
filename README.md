# KP App — Katarungang Pambarangay

A Progressive Web App for **Barangay New Kababae** that digitizes the Katarungang Pambarangay (RA 7160, Secs. 399–422) process: residents file and track complaints online, and barangay officials review, mediate, and close cases with the official KP forms.

## Features

**Residents**
- 5-step registration with OCR ID scanning (17 accepted Philippine government IDs) and live face capture
- File complaints with evidence attachments
- Track case status by reference number
- Real-time notifications and hearing reminders the day before

**Barangay officials (admin)**
- Intake review: accept or decline new complaints with a reason
- Case pipeline: Filed → Summoned → Mediation → Pangkat → Settled / CFA / Dismissed, with transitions enforced by the database
- Printable KP Forms 7–27
- Identity verification, user management, analytics
- Daily alerts for stalled cases and KP deadlines (15-day mediation, 15+15-day Pangkat)

## Tech stack

React 19 · Vite · Tailwind CSS v4 · React Router 7 · Supabase (Postgres, Auth, Storage, Realtime, Edge Functions, pg_cron) · vite-plugin-pwa · Vercel

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project values
npm run dev
```

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |

## Database

Run the files in `supabase/migrations/` in filename order in the Supabase SQL Editor (or `supabase db push`).

After creating your first account, promote it to admin from the SQL Editor:

```sql
update profiles set role = 'admin' where id = (select id from auth.users where email = 'you@example.com');
```

Roles can only be changed by an admin or from the SQL Editor; every new sign-up starts as a resident.

## Edge function: `verify-id`

Proxies ID photos to OCR.space so the API key never reaches the browser.

```bash
supabase secrets set OCR_SPACE_KEY=your-key ALLOWED_ORIGIN=https://your-app.vercel.app
supabase functions deploy verify-id
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build (includes service worker) |
| `npm run preview` | Test the production build and PWA locally |
| `npm run lint` | ESLint |

## Team

CODE SLAYER — Gordon College, BS Computer Science
