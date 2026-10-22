# Runde 2b (UI-Look) – Design

Stand 2026-10-23. Grundlage: [Evaluation](../../evaluation-2026-10-22.md) Punkt 6 und Backlog 2b,
[UI-Analyse](../../ui-analyse.md) §4 (Lücken) und §5 (Tokens). Vom Nutzer freigegeben (Entwurf im Chat).

## Zuschnitt (Entscheidungen des Nutzers)

- **2b** (diese Runde): Theme/Typo, Header/Footer, Landing, Pricing, Auth, App-Shell (leicht), 404/Fehler,
  Mobil-LCP und JS-Budget, a11y.
- **2c** (eigene Spec): Onboarding-Schritt, Kontaktformular mit `rateLimit`, Admin-Nutzerliste.
- Farbmodus: **System** als Default, Hell und Dunkel gleichwertig.
- Hero-Visual: **UI-Mock in Code** (Server-Komponente, kein Bild).
- Kein Monats/Jahres-Toggle (Backlog; ändert den Billing-Vertrag).
- `lh:script` zählt weiter alle Scripts inkl. Next-Prefetch; das Budget wird durch weniger Prefetch erreicht,
  nicht durch eine weichere Regel.

## Messbares Ergebnis

| # | Ziel | Messung |
| --- | --- | --- |
| 1 | LCP mobil < 2500 ms auf `/`, `/pricing`, `/auth/sign-in` | `pnpm studio:audit` gegen test-dummy |
| 2 | Script-Transfer < 350 KB auf denselben Seiten (mobil und desktop) | dto. |
| 3 | Lighthouse a11y 100, Perf mobil ≥ 90 | dto. |
| 4 | Lücken „Hoch“ und „Mittel“ aus ui-analyse §4 geschlossen (außer App-Shell-Sidebar-Umbau) | Screenshots hell/dunkel/mobil, externer Design-Review |
| 5 | `pnpm check` und `pnpm test:e2e` (Auth-Flows) grün | lokal |

## 1. Theme und Typografie

- ~~`apps/web/styles/shadcn-ui.css`: Tokens aus ui-analyse §5 (OKLCH, Hue 260, Teal-Akzent) für hell und dunkel.
  Primärbutton invertiert (`--primary` = Vordergrund), Teal als eigenes Token `--accent-brand` (Text-Variante
  L 0.53 für Kontrast ≥ 4,5:1 auf Hell) für Links, Häkchen, Fokus, Badge, H1-Highlight.
  `--secondary`, `--muted`, `--accent` unterscheidbar (Surface-Stufen background / card / muted).~~
  **Ersetzt** durch die Revision unten (warm-neutrale Tokens, grüner Akzent nur auf der Primäraktion).
- `--radius: 0.5rem`; Karten/Dialoge 12 px; Controls 40 px Standard, 48 px Hero-CTA/Auth.
- `lib/fonts.ts`: Geist (next/font/google, Variable Font) statt Inter; Headings 600, H1 −0,035 em.
- Regel: Statisches mit 1 px Border ohne Schatten; Schwebendes Border + weicher Schatten; Dunkel ohne Schatten.
  Fokus: 2 px Ring mit 2 px Offset in `--ring`. Hover-Transition 150 ms.
- Theme-Default `system` (next-themes `defaultTheme`), Toggle bleibt.

## 2. Header, Navigation, Footer

- Ziel: kein Base-UI/floating-ui im Marketing-Erstbundle.
- Desktop-Navigation: einfache `<Link>`s statt `NavigationMenu`. Mobil: `<details>`/`<summary>`-Menü (CSS,
  Tastatur und Screenreader nativ) statt `DropdownMenu`.
- ~~Header sticky, `backdrop-blur`, 1 px Unterkante; Logo aus `AppLogo`.~~ **Ersetzt**: schlichte Leiste,
  Serifen-Wortmarke (siehe Revision).
- Links auf `/auth/*` (Header, Hero-CTA, Pricing) mit `prefetch={false}`: der Supabase-Client der Auth-Seiten
  (~93 KB) wird nicht mehr auf Marketing-Seiten vorgeladen.
- Konto-Bereich im Header (eingeloggt: Nutzer-Menü) darf Base-UI behalten, wird aber erst nach Auth-Prüfung
  geladen (wie heute über `AuthGate`); Theme-Toggle ohne Dropdown (ein Button, zyklisch hell/dunkel/system).
- Footer: drei Spalten Produkt / Rechtliches / Konto, Rechtslinks unverändert.

## 3. zod raus aus dem Client

- `config/site.config.ts` (und weitere Configs, die von Client-Komponenten importiert werden) werden reine,
  typisierte Objekte (`satisfies`-Typ). Die Schema-Prüfung wandert in `config/*.test.ts`: kaputte Config →
  `pnpm check` rot.
- Server-only-Configs (`studio.config.ts`, Env-gebundene Prüfungen) dürfen zod behalten.

## 4. Landing (`app/(marketing)/page.tsx`)

- ~~Hero: Announcement-Pill (optional, `siteConfig.hero.announcement`), H1 mit Akzent-Teil
  (`siteConfig.hero.highlight`, optional, Teilstring des Titels), Untertitel, zwei CTAs (Primär + Outline auf
  `/pricing`), dezenter radialer Teal-Glow (Alpha ≤ 0,12). LCP bleibt die H1 (kein Fade, keine Webfont-Blockade).
- `HeroMock` (`app/(marketing)/_components/hero-mock.tsx`, Server-Komponente): Browser-Rahmen mit kleinem
  App-Mock aus `@kit/ui`-Primitiven (Sidebar-Leiste, Karten, Liste); `aria-hidden`, pro Produkt austauschbar.
- Feature-Grid 3×2: Icon, Titel, Satz. `siteConfig.features[].icon` optional aus einer festen Lucide-Auswahl
  (Map in der Komponente, kein dynamischer Import).
- FAQ-Akkordeon (`<details>`), nur wenn `faq` gefüllt; End-CTA-Band mit Warteliste.~~
  **Ersetzt** (Pill, Akzent-H1, Glow, HeroMock, Icon-Karten, FAQ-Akkordeon) durch die Revision unten.
- Eigene Komponenten statt `@kit/ui/marketing`, wo dessen Markup im Weg ist.

## 5. Pricing (`app/(marketing)/pricing/page.tsx`)

- Zentriertes Raster aller Produkte aus `studioConfig.products`; Preis groß, `/ month` bzw. `one-time`
  (heute fehlt der Preis bei `mode: 'payment'` – mitbeheben).
- Hervorhebung: erstes Abo-Produkt bekommt „Popular“-Badge und gefüllten Button, alle anderen Outline.
  Logik als reine Funktion `highlightedProduct(products)` mit Unit-Test.
- `billing.json` → Produkte bekommen optional `features: string[]`; Liste mit Häkchen.
  `studio.config.ts`-Schema und `studio:new` (ignoriert das Feld) entsprechend.
- FAQ darunter (gleiche Komponente wie Landing).

## 6. Auth

- Logik in `packages/features/auth` bleibt (Container, Hooks, Server Actions). Nur Layout und Markup ändern:
  - `AuthLayoutShell`: Spalte 400 px, Logo zentriert, ohne Karte.
  - `SignInMethodsContainer` / `SignUpMethodsContainer`: OAuth oben, Divider „or“, darunter Tabs
    „Password | Magic link“ (nur wenn beide aktiv; sonst nur das aktive Formular). Kein zweites E-Mail-Feld.
  - Inputs 40 px, „Forgot password?“ und „Create an account“ im Link-Stil, Zeile „By continuing you agree to …“
    mit Links auf `/datenschutz` (und AGB, falls vorhanden) unter dem Formular.
- `data-test`-Attribute bleiben, damit E2E unverändert läuft.

## 7. App-Shell (`app/home/*`)

- Nur Tokens, Sidebar-Dichte, einheitlicher Page-Header; leere Zustände auf Billing (kein Abo → Hinweis + Link
  `/pricing`) und Pro. Kein Struktur-Umbau (keine Org-Switcher, keine neue Navigation).

## 8. 404 und Fehlerseiten

- `not-found.tsx`, `error.tsx`, `global-error.tsx`: ruhig, zentriert, neue Typo, ein Primär- und ein
  Sekundär-Button. Der tote `/contact`-Link entfällt (kommt mit 2c).

## 9. a11y

- Ursachen der 96 auf `/` und Sign-in per lokalem Lighthouse ermitteln und beheben (vermutlich Kontrast,
  Link-/Button-Namen). Ziel 100 auf allen drei Seiten.

## Tests

- `config/site.config.test.ts`: Schema-Prüfung; muss rot werden, wenn ein Pflichtfeld leer ist.
- `highlightedProduct`-Test: erstes Abo-Produkt, Fallback erstes Produkt, leere Liste.
- `studio.config`-Test für optionales `features`.
- Bestehende Unit-, pgTAP- und E2E-Tests bleiben grün; E2E Auth (Sign-up, Sign-in, Magic Link) nach Schritt 6.
- Kein Snapshot-Test für Markup.

## Nicht in 2b

Onboarding, Kontaktformular, Admin-Nutzerliste (→ 2c), Jahres-Toggle, Kundenlogos/Social Proof,
Cookie-Banner, `⌘K`, Org-Switcher, neue Sprachen.

## Revision (2026-10-23, nach Nutzerfeedback)

Feedback: das Ergebnis von 2b wirkte wie „AI slop“. Neue Richtung: ruhig, ehrlich, neutral für viele Produkte,
redaktionell (Prinzip à la Claude/Anthropic, aber ohne deren Palette, Schrift oder Logo).

- **Palette** (`shadcn-ui.css`): warm-neutraler Grund `#f6f5f3`, Tinte `#1b1814`, gedämpft `#5f5a55`; dunkel
  Dunkelgrau `#1f1e1c` statt Schwarz, Tinte `#eae8e3`. Genau ein Akzent, tiefes Grün `#245c41` (dunkel
  `#97c8ac`), nur auf der Primäraktion und im Fokusring. Kein Creme+Terrakotta, kein `--accent-brand`.
  Kontraste ≥ 4,5:1 hell und dunkel (gedämpft auf Fläche 5,65 bzw. 6,0).
- **Schrift**: Newsreader (next/font/google, statischer 400-Schnitt statt Variable Font: 22 statt 58 KB, swap, latin, preload) nur für H1/H2 auf Marketing,
  Auth und Fehlerseiten (`font-display`, `section-heading`, `page-title`); Geist bleibt für Text und UI, die
  App (`/home`) bleibt serifenlos.
- **Landing**: linksbündiger Hero mit Serifen-H1 (max. 2 Zeilen), ein Satz, eine Primäraktion und ein
  ruhiger Link; drei Feature-Aussagen als Text; FAQ als schlichtes Frage/Antwort; Warteliste auf flacher
  Tonfläche. Config ohne `hero.announcement`, `hero.highlight` und `features[].icon`.
- **Pricing**: Spalten ohne Kartenrahmen, großer Serifenpreis; der empfohlene Plan liegt auf einer flachen
  Tonfläche; „Popular“ nur als Text und nur bei mehr als einem Produkt. `highlightedProduct` unverändert.
- **Header/Footer**: nicht sticky, kein Blur, keine Pill-Navigation; Wortmarke als Serifentext.
- **Auth**: zentrierter kurzer Titel mit einem grauen Satz, Formular auf einer Fläche (Radius 28 px,
  Tonstufe statt Rahmen), OAuth zuerst, „or“, dann E-Mail; Passwort/Magic Link als leiser Text-Umschalter
  statt Tabs (ersetzt §6 „Tabs“). `data-test`-Attribute bleiben.
- **404/Fehler**: zentrierte Serifenaussage, ein Satz, eine Primäraktion.
- Geprüft mit dem taste-skill-Inspektor (0 FAIL auf `/`, `/pricing`, `/auth/sign-in`, 404) und Lighthouse.
