---
name: add-email-template
description: Use when adding or changing a transactional email (React Email template sent via Resend) in studio-template.
---

# E-Mail-Template hinzufügen

Versand: `sendEmail({ to, subject, react, idempotencyKey? })` aus `apps/web/lib/email/send-email.ts` (Resend).
Ohne `RESEND_API_KEY` wird lokal nur geloggt, in Produktion wirft es. Auth-Mails (Login, Magic Link) kommen
von Supabase über Resend-SMTP, nicht von hier – deren Templates liegen in `apps/web/supabase/templates/`.

1. **Template** `apps/web/lib/email/templates/<name>.tsx`, Komponenten aus `react-email`
   (nicht `@react-email/components`, veraltet). Vorbild `welcome.tsx` / `digest.tsx`. Texte Englisch,
   Produktname aus `process.env.NEXT_PUBLIC_PRODUCT_NAME`. Links immer absolut
   (`process.env.NEXT_PUBLIC_SITE_URL`).
2. **Versenden nie direkt im Request**, sondern aus einem Job-Handler (Skill `add-cron-job`), damit Fehler
   per Retry wiederholt werden:
   ```ts
   await sendEmail({ to, subject: '…', react: createElement(MyEmail, props), idempotencyKey: `<typ>:<id>` });
   ```
   `idempotencyKey` eindeutig pro fachlichem Ereignis – Resend verwirft Duplikate (24 h).
   Empfänger über `handlers/load-user-email.ts` laden (gelöschter Nutzer → `null` → nichts senden).
3. **Test** `<name>.test.tsx` mit `render` aus `react-email` (Vorbild `digest.test.tsx`): wichtige Inhalte und
   Links im HTML. Der Handler-Test mockt `~/lib/email/send-email` und prüft `idempotencyKey`.
4. Vorschau lokal: Mail im Dev-Modus wird geloggt; Auth-Mails landen in Mailpit (http://localhost:55324).
5. `pnpm check` → Commit `feat(email): …`.
