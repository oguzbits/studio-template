# Bootstrap research (2026-10-22, researcher agent; verify unverified items against real CLI)

Supabase CLI: `supabase projects create <name> --db-password <pw> --org-id <id> --region eu-central-1` (non-interactive behaviour unverified)
`supabase link --project-ref <ref> -p <pw>` (or SUPABASE_DB_PASSWORD), `supabase db push --linked --include-all --yes` (-p?)
`supabase projects api-keys --project-ref <ref> -o json` (format unverified)
Mgmt API base https://api.supabase.com, Bearer SUPABASE_ACCESS_TOKEN
- GET /v1/projects/{ref} -> status (INACTIVE/COMING_UP/ACTIVE_HEALTHY, unverified); /v1/projects/{ref}/health
- PATCH /v1/projects/{ref}/config/auth: site_url, uri_allow_list (comma string), smtp_host, smtp_port (string), smtp_user, smtp_pass, smtp_admin_email, smtp_sender_name, external_email_enabled, mailer_autoconfirm
- POST /v1/projects/{ref}/database/query {"query": "...", "read_only": false} (experimental)
pg_cron: create extension pg_cron with schema pg_catalog; pg_net: create extension pg_net with schema extensions; net.http_post
Vault: select vault.create_secret(value, name, description); read vault.decrypted_secrets (decrypted_secret)
Resend SMTP: smtp.resend.com:465, user `resend`, pass = API key
Vercel: `vercel link --yes --project <n> [--scope s]` (VERCEL_TOKEN env); `printf %s "$V" | vercel env add NAME production --force` (+ --no-sensitive optional); preview branch optional;
`URL=$(vercel deploy --prod --yes)` stdout = URL; prod alias via GET https://api.vercel.com/v9/projects/{name} alias[] target PRODUCTION
Hobby cron: min once/day, any time within the hour; GET with Authorization: Bearer $CRON_SECRET; may duplicate
Stripe CLI: brew install stripe; `stripe listen --forward-to URL --api-key sk_test_...`; `--print-secret`
