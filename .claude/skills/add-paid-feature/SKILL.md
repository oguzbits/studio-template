---
name: add-paid-feature
description: Use when adding a feature, page or product that only paying users (Stripe subscription or one-time purchase) may access in studio-template.
---

# Bezahltes Feature hinzufügen

Alle Pfade relativ zu `apps/web`.

1. **Produkt** (nur wenn ein neues Produkt nötig ist, sonst bestehenden Key nutzen) in
   `config/billing.json` → `products`:
   ```json
   "reports": { "name": "Reports", "mode": "payment", "priceEur": 29 }
   ```
   Abos stattdessen `"mode": "subscription"` mit `priceMonthlyEur` (fließt in die MRR auf `/admin`). `priceId` kommt
   automatisch aus `STRIPE_PRICE_REPORTS`; die Variable mit Kommentar `[local]` in die Stripe-Sektion von
   `/.env.example`. Neue Projekte: `studio:new` legt Produkt und Preis in Stripe an. Bestehendes Projekt: Preis im
   Stripe-Dashboard anlegen und `STRIPE_PRICE_REPORTS` in Vercel setzen (der Produktions-Build prüft das).
   Pricing- und Billing-Seite zeigen das Produkt automatisch.
2. **Seite** `app/home/<feature>/page.tsx` nach dem Muster `app/home/pro/page.tsx`: im async Server Component
   `const entitlement = await requireEntitlement('<key>');` – leitet selbst auf Login, `/home/billing` oder
   `/pricing` um. Nie im Client prüfen.
3. **Server Actions / Route Handler** des Features: ebenfalls zuerst `requireEntitlement('<key>')` bzw. für
   Actions den Zugang serverseitig prüfen – die Seite allein schützt keine Action.
4. **Navigation**: Eintrag in `config/navigation.config.tsx` und Pfad in `config/paths.config.ts`.
5. **Daten**: Migration (`pnpm --filter web exec supabase migration new <feature>`) mit
   `enable row level security`, `revoke all on table … from anon, authenticated`, Policies nur mit
   `(select auth.uid()) = user_id`. Danach `pnpm --filter web supabase:typegen` und pgTAP-Test in
   `supabase/tests/database/` (Nutzer A sieht Daten von B nicht; anon sieht nichts).
6. **Tests**: Unit-Test für die Feature-Logik. Den Zugangsschutz nicht neu testen (`requireEntitlement` ist getestet),
   aber für eigene Actions prüfen, dass ohne Berechtigung nichts passiert.
7. `pnpm check` → Commit `feat(<feature>): …`.

Lokal kaufen: `stripe listen --forward-to localhost:3000/api/billing/webhook`, Karte `4242 4242 4242 4242`.
