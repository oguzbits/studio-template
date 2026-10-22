# Qualitätsziele (Maßstab der Verbesserungsschleife)

Gemessen mit `pnpm studio:audit <url>` gegen ein Live-Projekt (`--no-lighthouse` für einen schnellen Lauf).
Grenzwerte maschinenlesbar in [`tooling/scripts/src/quality-bar.json`](../tooling/scripts/src/quality-bar.json),
Prüflogik in `tooling/scripts/src/studio-audit-lib.mjs`. Ergebnis als JSON in `.studio/audits/`.
Exit-Code 1 bei einem harten Fehler; `!` = Warnung.

| Bereich | Prüfung | Grenzwert |
| --- | --- | --- |
| Lighthouse mobil (`/`, `/pricing`, `/auth/sign-in`) | Performance / A11y / Best Practices / SEO | ≥ 90 / 100 / ≥ 95 / 100 |
| | LCP, Script-Transfer | < 2500 ms, < 350 KB |
| Lighthouse desktop | Performance / A11y / Best Practices / SEO | ≥ 98 / 100 / ≥ 95 / 100 |
| | LCP, Script-Transfer | < 1200 ms, < 350 KB |
| Header (`/`) | CSP mit `frame-ancestors 'none'` und `object-src 'none'`, `nosniff`, Referrer-, Permissions-, COOP-Policy, HSTS | vorhanden |
| | `access-control-allow-origin: *` | Warnung (setzt Vercel auf gecachten Seiten, ohne Credentials harmlos) |
| SEO (`/`, `/pricing`, `/faq`, `/auth/sign-in`) | Title, Description, Canonical = Seiten-URL, `og:url` = Seiten-URL, Manifest | vorhanden/korrekt |
| | Sitemap | nur URLs der eigenen Origin |
| Inhalt | „Makerkit“, „Lorem ipsum“, Platzhaltertext in ausgelieferten Seiten | 0 Treffer |
| Robustheit | unbekannte Seite → 404, Webhook ohne Signatur → 400, Worker ohne Token → 401, `/api/health` mit Version | exakt |

Abbruch der Schleife: alle harten Ziele erfüllt und zwei externe Reviews in Folge ohne Befund „hoch“/„mittel“
([Evaluation](evaluation-2026-10-22.md#vorschlag-verbesserungsschleife)).

## Verlauf

| Datum | Projekt | Bestanden | Notiz |
| --- | --- | --- | --- |
| 2026-10-22 | test-dummy (vor Runde 1) | 35/75 | Header fehlen, Makerkit-Meta, kein Canonical/Manifest, Mobil-LCP ~4 s, JS ~505–530 KB |
| 2026-10-22 | test-dummy (nach Runde 1) | 60/75 | Header, SEO, Branding, Robustheit grün; CSP scharf ohne Verstöße. Offen: Mobil-Perf 85–87, Mobil-LCP 2,7–4,4 s, JS 508–534 KB, a11y 96 auf `/` und Sign-in |
