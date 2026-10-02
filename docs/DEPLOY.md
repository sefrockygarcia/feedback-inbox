# Deploying: the steps that need your accounts

Everything runs locally already. These steps need your own accounts and passwords, so do them in
this order. The free plan is enough for each service.

## 1. GitHub repo (personal account, sefrockygarcia)

Your `gh` CLI is logged in as the work account (frockynator). Add your personal account next to it:

```bash
gh auth login                 # choose GitHub.com, HTTPS, log in as sefrockygarcia in the browser
gh auth status                # both accounts listed; the new one is active
cd ~/Projects/feedback-inbox
gh repo create sefrockygarcia/feedback-inbox --public --source . --push
gh auth switch                # switch back to frockynator for work afterwards
```

Then check the **Actions** tab on GitHub: the CI run should go green.

## 2. Supabase cloud project

1. Go to https://supabase.com, sign in with GitHub (sefrockygarcia), and click **New project**.
   - Name: `feedback-inbox`
   - Region: **Southeast Asia (Singapore)**
   - Save the database password in your password manager.
2. Link the local project and push the schema:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>   # the ref is in the dashboard URL
   npx supabase db push                                 # runs supabase/migrations on the cloud database
   ```
3. Create the demo staff user. The seed file is **not** run on the cloud database.
   - Go to **Authentication → Users → Add user → Create new user**.
   - Use `staff@feedback-inbox.test` / `inbox-demo-2026` (as listed in the README), and tick
     **Auto Confirm User**.
4. **Optional sample data:** run the `insert into public.feedback …` part of `supabase/seed.sql`
   in **SQL Editor**.
5. Copy the cloud keys from **Project Settings → API Keys**: the Project URL, the publishable key and
   the secret key.

## 3. Discord webhook

1. In your Discord server, open the channel's settings: **Integrations → Webhooks → New Webhook**,
   then **Copy Webhook URL**.
2. Test it locally first. Put it in `.env.local` as `DISCORD_WEBHOOK_URL=…`, restart `npm run dev`,
   and submit a 1-star rating. The alert should appear in the channel.

## 4. Inngest

1. Sign up at https://www.inngest.com with GitHub.
2. Go to **Integrations → Vercel** and connect it. It adds the Inngest keys to Vercel for you.
   Alternatively, copy the **Event Key** and **Signing Key** from the Inngest dashboard and add them
   by hand in the next step.

## 5. Vercel

1. Sign up at https://vercel.com with GitHub (sefrockygarcia), click **Add New → Project**, and
   import `feedback-inbox`.
2. Add these environment variables before deploying:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
   | `SUPABASE_SECRET_KEY` | Supabase secret key |
   | `APP_URL` | `https://<your-project>.vercel.app` (fill in after the first deploy, then redeploy) |
   | `DISCORD_WEBHOOK_URL` | Discord webhook URL |
   | `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY` | From Inngest, unless the integration added them |

   **Do not** set `INNGEST_DEV` on Vercel.
3. Deploy. Then in **Inngest → Apps**, check that `feedback-inbox` is synced with its 2 functions.
   If it isn't, click **Sync app** and enter `https://<your-project>.vercel.app/api/inngest`.
4. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to the Vercel URL.

## 6. Finish

- Test the live site:
  1. Submit a 1-star feedback. The Discord alert should arrive.
  2. Log in as the demo staff user.
  3. Resolve an item.
- In the Inngest dashboard, **Invoke** `daily-digest` once to see the digest message.
- Put the live URL in the README ("Live demo"), on your portfolio site, and in the job application
  message.
