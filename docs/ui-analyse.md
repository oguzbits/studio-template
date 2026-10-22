# UI-Analyse: Referenzen vs. studio-template

Stand: 2026-10-22. Methode: nur öffentlich sichtbare Seiten, Screenshots und per DevTools gelesene Computed Styles / CSS-Variablen (1440x900, Landing zusätzlich 390x844). Kein Login, keine Formulareingaben, kein Quellcode-, Asset- oder Textabzug; Muster und Messwerte in eigenen Worten. Screenshots liegen nicht im Repo (das Screenshot-Tool durfte den vorgesehenen Scratchpad-Ordner nicht beschreiben und hat sie in seinem Tool-Ergebnis-Cache abgelegt).

## 1. Kurzfazit

- **Ruhige Neutralflächen statt Farbe**: Alle Referenzen sind fast monochrom; Farbe kommt nur über einen einzigen Akzent (Primärbutton, Highlights).
- **Dunkel zuerst**: 4 von 4 Marketing-Seiten (supastarter, Linear, Vercel, Resend) sind standardmäßig dunkel (Hintergrund nicht reines Schwarz außer Vercel/Resend; Linear #08090a). Die supastarter-Demo-App ist hell mit Dark-Toggle.
- **Typografie trägt das Design**: große H1 (64–96 px) mit starkem negativem Letter-Spacing (ca. -0,02 bis -0,06 em), Gewicht 400–600, nie fett-schwer. Body 16 px, Fließtext gedämpft grau.
- **Haarfeine Ränder statt Schatten**: 1 px Border mit niedrigem Kontrast (Alpha-Weiß 8–19 % oder Neutral-800); Schatten nur bei schwebenden Elementen. Vercel nutzt `box-shadow: 0 0 0 1px` als Border.
- **Wenige, konsistente Radien**: Buttons/Inputs 6–8 px (Vercel, supastarter-App) oder Pill (Linear, supastarter-Marketing); Karten 16 px.
- **Dichte, klare Struktur**: Container 1152–1280 px, großzügige vertikale Abstände, Sektionen mit immer gleichem Muster (Überschrift, ein Satz, Visual).
- **Produkt-Screenshot im Hero** (Linear, supastarter-Demo): echte UI im Browser-Rahmen schlägt jede Illustration.
- **Auth schlicht**: zentrierte Spalte (~320–450 px), Logo, kurze Überschrift, OAuth gleichwertig zu E-Mail, Rechtslinks klein darunter.

## 2. Referenzen

### 2.1 supastarter (supastarter.dev + demo.supastarter.dev + app-demo.supastarter.dev)

Öffentliche Demo vorhanden: Marketing-Demo (`demo.supastarter.dev`, Seite "Acme") und App-Login/Signup (`app-demo.supastarter.dev/login`); Dashboard nur mit Account (nicht gesehen, nur Hero-Mockup).

| Merkmal | Messwert |
| --- | --- |
| Modus | Marketing dunkel (bg #111010, Text #fff); Demo hell (bg ~#fafaf9, `--primary` fast schwarz), Dark-Toggle vorhanden |
| Akzent | Marketing: warmer Pfirsich (#e8c4a0) auf Buttons, Highlights im H1; Demo: dunkles Grün für Links/Tabs |
| Fonts | DM Sans (Marketing-Body und -Headings), Demo: DM Sans Headings + Inter Body, App-Login Inter |
| H1 | 72 px / 72 px, Gewicht 600 (Demo 500), Spacing -1,44 px (-0,02 em; Demo -1,8 px) |
| H3 / Body | 36 px Gewicht 600; Body 16 px, Gewicht 350, Spacing -0,4 px |
| Border | 1 px #272626 (dunkel), Karten 16 px Radius, Fläche weiß 5 % Alpha |
| Schatten | Karten `0 8px 32px rgba(0,0,0,.1)` + `0 0 1px` (fast unsichtbar) |
| Buttons | Marketing: 36 px hoch, 8 px Radius; Pill-Badge "New …" 34 px; Demo: Pills, 36 px; Input 36 px, Radius 14 px, Border 1 px |
| Container | max 1280 px (Sektionen 1152 px) |
| Header | Logo + Framework-Switcher links, Links rechts, CTA "Get access" als gefüllter Pill im Scroll-Zustand, 68 px mit Unterkante |

Muster: Hero = Announcement-Pill, H1 mit farbig hervorgehobenem Teil, 4 Häkchen-Claims, Primär-/Sekundär-CTA (Outline), Social Proof (Avatare, 5 Sterne). Darunter Tab-Leiste (Codebase, Auth, Payments, Orgs, i18n, ...) mit Icon + Label und Screenshot pro Tab. Weitere Sektionen: Showcase "Real products", Preise (3 Karten Solo/Startup/Agency, Preis groß in Akzentfarbe, Häkchen-Liste in Kreisen, Framework-Umschalter), Trust-Zeile, Footer mit Newsletter. Kein Monats/Jahres-Toggle (Einmalkauf). Karten sind gleichwertig, kein hervorgehobenes Highlight gesehen.
Docs: 3 Spalten (Sidebar mit Suche + `⌘K`-Hinweis, Inhalt, "On this page"), Breadcrumb, Callout-Box. Changelog: Zentrierter Titel, Filter-Chips, vertikale gestrichelte Timeline mit Datum links.
Auth (App-Demo): zentrierte Spalte 448 px, kein Card-Rahmen, Logo nur oben links; H1 24 px/700; Tabs "Password | Magic link" (Unterstrich-Tabs); Email, Passwort mit Auge, Primärbutton (schwarz, Pill), Divider "Or continue with", Google/GitHub nebeneinander + Passkey (graue Pills), "Create an account →"; Theme-/Sprach-Switcher oben rechts.
Mobil: Hero einspaltig, CTAs gestapelt, Burger-Menü; wirkt unverändert hochwertig.
Premium-Details: Cookie-Banner als Karte, Theme-Switcher als Segment-Toggle, Icon-Tabs, gestrichelte Timeline, Gradient-Glow im Hintergrund.

### 2.2 Linear (linear.app)

| Merkmal | Messwert |
| --- | --- |
| Modus | dunkel (bg #08090a, Text #f7f8f8, Sekundär #d0d6e0, Tertiär #8a8f98); Hell-Modus nicht geprüft |
| Fläche/Border | Sekundär #1c1c1f, Border #23252a, Header-Unterkante 1 px weiß 8 % |
| Akzent | Indigo (#5e6ad2 Marke, #7170ff Link-Akzent), nur sparsam (Google-Button im Login) |
| Fonts | Inter Variable (Gewichte 510/590 statt 500/600), Mono: Berkeley Mono (proprietär) |
| H1 / H2 / H3 | 64/64 px, 510, -1,41 px (-0,022 em) / 48/48, 510, -1,06 px, Farbe grau #8a8f98 / 20/26,6, 590, -0,24 px |
| Body | 16/24, 400; UI-Text 13–14 px |
| Buttons | Pill (9999 px), 32 px hoch (Header), 13 px Text, Primär hellgrau #e5e5e6 mit dunklem Text; mehrlagiger Mikroschatten |
| Header | fixed, 73 px, transparent + `backdrop-filter: blur(20px)`, 1 px Unterkante |

Muster: Hero linksbündig (nicht zentriert), H1 zweizeilig, ein Satz, rechts unten "New: Loops →"; darunter riesiger echter Produkt-Screenshot (Rahmen 1 px, Radius ~8 px, gedämpft). Sektionen mit zweizeiligen H2 in Grau, in denen der erste Halbsatz heller ist. Pricing: **keine Karten**, 4 Spalten nur durch 1 px vertikale Trenner und horizontale Linien getrennt; Billed-yearly-Toggle (Indigo) pro Spalte; Häkchen-Icons gefüllt; Empfehlung nur durch hellen Button (Business) markiert. Login: Logo, 18 px Titel, 4 gestapelte Pills (44 px, 288 px breit): Google (Akzent gefüllt), E-Mail, SAML, Passkey; Hintergrund dunkel mit leichtem Grünstich-Verlauf; kein Karten-Rahmen. Mobil: H1 viermal umbrochen, Screenshot angeschnitten, Burger.
Premium-Details: Gewicht 510 statt 500 (Variable Font fein getuned), Dunkelgrau abgestuft statt Schwarz, Layer aus Alpha-Weiß.

### 2.3 Vercel (vercel.com)

| Merkmal | Messwert |
| --- | --- |
| Modus | dunkel (bg #000, Text #ededed), Tokens `--ds-gray-100` #1a1a1a, `-400` #2e2e2e, Border Alpha-Weiß #ffffff24 |
| Font | Geist Sans (+ Geist Mono für Untertitel), frei lizenziert (OFL) |
| H1 | 64/64 px, Gewicht 400/450, Spacing -3,84 px (-0,06 em), H2 56 px, -3,36 px |
| Body | 16/24, Buttons 14 px/500 |
| Radius | `--geist-radius` 6 px (Header-Buttons), 8 px (Auth-Buttons), Pills im Hero |
| Border | Schatten-Border `0 0 0 1px #2e2e2e` statt echter Border |
| Header | sticky 64 px, transparent, ohne Unterkante; Rechts: Get a Demo (Outline), Log In (Outline), Sign Up (hell gefüllt) |

Muster: Hero = zentrales Glow-Dreieck (Grafik), links H1 und 2 CTAs (Pill), rechts 3 Kurzzeilen; darunter Kundenlogo-Laufband. Pricing: 3 Spalten in **einem** umlaufenden Rahmen mit vertikalen Trennlinien (Tabelle statt Karten), "Popular"-Badge neben "Pro", Preis sehr groß (+ `/mo` in Mono), Feature-Liste mit Outline-Icons pro Zeile, Hell-gefüllter Button nur bei Pro. Login: zentriert, 32 px/600-Titel, E-Mail-Input + heller Primärbutton, Divider, 5 gestapelte Outline-Buttons mit Marken-Icons, "Show other options", Terms/Privacy ganz unten. Signup: derselbe Aufbau, aber in einer Karte (Radius ~12 px, bg #0a0a0a, Border), zweizeilige Headline, E-Mail-Link nachrangig, Rechtstext in der Karte.
Mobil: Hero stapelt Grafik, H1 einzeilig 40 px-Klasse, Logo-Band läuft weiter.
Premium-Details: sehr enge Headline-Laufweite, Fokus-Ring `0 0 0 4px` Blau (52a8ff) sichtbar bei Tastaturfokus, einheitliche 32/40 px Control-Höhen.

### 2.4 Resend (resend.com)

| Merkmal | Messwert |
| --- | --- |
| Modus | dunkel (bg #000, Text #f0f0f0), Fläche #141517; Rand/Fläche als Alpha-Blau-Weiß `rgba(214,235,253,.19)` |
| Fonts | Display-Serif "Domaine" für H1 (proprietär, nicht übernehmen), aBCFavorit für H2/H3 (proprietär), Inter Body, CommitMono Mono |
| H1 / H2 | 96/96 px, 400, -0,96 px / 56/67 px, 400, -2,8 px (-0,05 em) |
| Radius | Karten 16 px, Auth-Inputs/Buttons 16 px mit 2 px Rand, Pills 9999 px, Primär-CTA Header 12–16 px |
| Akzent | kaum vorhanden (Blau #00a3ff nur in einem Nebenbutton); Häkchen grün |
| Header | sticky 58 px, mittig Navigation mit Dropdowns, rechts Log in + "Get started" (dunkler Button mit Rand) |

Muster: Hero linksbündig mit 3D-Objekt rechts (Bildmaterial, Atmosphäre) und Serif-H1 mit Verlauf (hell nach grau). Viele Feature-Sektionen mit Code-Snippets und UI-Ausschnitten ("Test mode", "Modular webhooks", "Develop emails using React"). Pricing: Titel zentriert in Serif, Segment-Toggle "Transactional | Marketing", Volumen-Slider mit Stufen, 4 Karten (16 px Radius, 1 px Alpha-Rand, Padding 24 px), Preis groß, Trennlinien, grüne Häkchen. Auth: Bild-Hintergrund (Stoff-/Licht-Foto), zentrierte Spalte 512 px, Logo-Kachel, Titel 28 px, Google + GitHub nebeneinander, Divider "or", Email-Label + Input (48 px), deaktivierter Primärbutton bis valide, Rechtstext klein mit Unterstreichung; Signup ergänzt Passwort + Opt-in-Checkbox. Mobil: Objekt oben, H1 zentriert, volle Breite Button.
Premium-Details: Primärbutton deaktiviert bis Eingabe gültig, Atmosphäre durch Bild statt UI-Ornament.

### 2.5 Wir (test-dummy-beta.vercel.app, Stand heute)

Tokens aus `apps/web/styles/shadcn-ui.css`: `--background` weiß / dunkel neutral-900, `--primary` neutral-950 (dunkel: weiß), `--border` gray-100 (hell) / neutral-800, `--input` gray-200, `--radius` 0,5 rem, `--secondary/--muted/--accent` jeweils fast identisches Hellgrau (oklch ~96,7 %). Font Inter via `lib/fonts.ts` (`--font-sans`). Hell als Default, Dark-Toggle vorhanden (Sonne-Icon im Header).

| Merkmal | Messwert |
| --- | --- |
| H1 | 72/72 px, Gewicht 500, Spacing -3,6 px (-0,05 em) |
| Body | Inter 16/24; Buttons 14 px/500, 32 px (Header) / 40 px (CTA), Radius 8 px |
| Karten | Hintergrund hellgrau ohne Rand (Landing); Preiskarte mit sehr hellem Rand |
| Auth | zentriert 368 px ohne Karte, Passwort- und Magic-Link-Formular **untereinander** (zwei E-Mail-Felder), Google-Button weiß, Inputs 32 px; "Password forgotten?" und "Do not have an account yet?" als schlichter kleiner Text ohne Link-Stil |
| Header | 56 px, Logo (Makerkit-Platzhalter!), Theme-Toggle, Sign In (Text), Sign Up (schwarz) |
| Landing | Hero nur Text + 1 Button, 3 graue Feature-Kacheln mit Platzhaltertext, Waitlist-Formular, Footer |
| Pricing | 1 Karte (Pro, 9 EUR / month), linksbündig, leer wirkend |

## 3. Querschnitt

| Merkmal | supastarter | Linear | Vercel | Resend | Wir |
| --- | --- | --- | --- | --- | --- |
| Default-Modus | dunkel (Demo hell) | dunkel | dunkel | dunkel | hell |
| Hintergrund | #111010 | #08090a | #000 | #000 | #fff |
| Akzent | Pfirsich | Indigo | keiner (Blau nur Links/Fokus) | keiner | keiner (Schwarz) |
| Sans | DM Sans / Inter | Inter Variable | Geist | Inter | Inter |
| Heading-Besonderheit | DM Sans 600 | Inter 510 | Geist 400–450 | Serif (proprietär) | Inter 500 |
| H1-Größe / Spacing | 72 / -0,02 em | 64 / -0,022 em | 64 / -0,06 em | 96 / -0,01 em | 72 / -0,05 em |
| Radius Button | 8 px / Pill | Pill | 6–8 px | 12–16 px | 8 px |
| Radius Karte | 16 px | ~8 px (Screenshot) | ~12 px | 16 px | ~6 px |
| Border | 1 px dunkel | 1 px Alpha-Weiß 8 % | 1 px Schatten-Border | 1 px Alpha 19 % | 1 px sehr hell |
| Container | 1280 | ~1320 (full) | full | ~1232 | ~1216 |
| Header | 68 px, Pill-CTA | 73 px, Blur | 64 px sticky | 58 px sticky | 56 px |
| Hero-Visual | Produkt-Mockup + Tabs | Produkt-Screenshot | Grafik + Logos | 3D-Bild | keines |
| Pricing-Form | 3 Karten | Spalten ohne Karte | Tabelle 1 Rahmen | 4 Karten + Slider | 1 Karte |
| Toggle | Framework | Yearly pro Spalte | nein | Segment + Slider | nein |
| Auth-Layout | zentriert, Tabs | zentriert, Pills | zentriert/Karte | zentriert + Bild | zentriert, ungeordnet |
| Icons | Lucide-artig, Outline | eigene | eigene Outline | eigene | Lucide |
| Footer | Newsletter + Links | mehrspaltig | mehrspaltig | mehrspaltig | 2 Spalten |

Nicht verifiziert: Hover-/Focus-Zustände (nur Vercel-Fokus-Ring zufällig sichtbar), Animationen, Linear/Vercel/Resend Hell-Modus, supastarter-Dashboard (Account nötig), unsere Mobilansicht, Footer-Aufbau außer Texten.

## 4. Lückenanalyse (wir vs. Referenzen)

| Prio | Bereich | Lücke | Maßnahme |
| --- | --- | --- | --- |
| Hoch | Theme | `--secondary/--muted/--accent` identisch, kein Akzent, 3 Grautöne wirken flach; Header/Karten ohne Tiefe | Eigene Palette (Abschnitt 5), Akzent einführen, Surface-Stufen (background / card / muted) |
| Hoch | Landing | Hero nur Text, kein Produktbild; Features als Platzhalterkacheln ohne Icons | Hero mit Announcement-Pill, H1 mit Akzent-Teil, 2 CTAs, Screenshot im Browser-Rahmen; Feature-Grid 3x2 mit Icon, Titel, Satz |
| Hoch | Auth | zwei E-Mail-Felder untereinander, Links ohne Link-Stil, Inputs 32 px, kein Divider, Rechtslinks fehlen | Tabs (Passwort / Magic Link) oder OAuth oben + Divider, Input 40 px, Link-Stil, AGB/Datenschutz-Zeile, Logo zentriert |
| Hoch | Pricing | 1 Karte linksbündig wirkt leer; keine Hervorhebung, kein Jahres-Toggle, keine Feature-Liste | Zentriertes Raster, "Popular"-Badge, Feature-Liste mit Häkchen, Toggle monatlich/jährlich, FAQ darunter |
| Mittel | Theme | Dark-Mode nicht Default und neutral-900 flach | Dark-Variante fein abstufen (Abschnitt 5); Default: system oder hell beibehalten, Dark gleichwertig |
| Mittel | Typografie | H1 -0,05 em wirkt für Inter zu eng, kein Heading-Gewichtskonzept | Geist Sans, H1 -0,035 em, Gewicht 600 für Headings, 400 Body |
| Mittel | App-Shell | Nicht geprüft (Account nötig); Referenz supastarter nutzt Sidebar + Org-Switcher | Prüfen: Sidebar-Dichte, Page-Header, leere Zustände |
| Mittel | Landing | Header ohne Blur/Unterkante-Verhalten, Logo-Platzhalter "makerkit" | Sticky Header mit `backdrop-blur`, 1 px Rand erst beim Scrollen, Logo aus `studioConfig` |
| Mittel | Landing | Keine Social-Proof-/FAQ-/CTA-Abschlusssektion | Logo-Zeile oder Zahlen, FAQ-Akkordeon, End-CTA-Band |
| Niedrig | Alle | Fokus-Ringe, Hover-Übergänge, Toasts, Tastaturhinweise (`⌘K`) | Einheitlicher `ring`, 150 ms Transition, Sonner-Toasts |
| Niedrig | Footer | 2 Spalten, Rechtslinks vorhanden (gut, DE-Pflicht) | Spalten: Produkt / Rechtliches / Konto |

## 5. Vorschlag Design-Tokens (eigene Werte, keine Markenkopie)

Begründung: neutrale, leicht kühle Graustufen (Hue 260, Chroma <= 0,01) wie bei Linear/Vercel, ein ruhiger Teal-Akzent als eigenständige Farbe (weder Indigo wie Linear noch Pfirsich wie supastarter), Border-first, Schatten nur für schwebende Layer.

**Farben (OKLCH)**

| Token | Hell | Dunkel |
| --- | --- | --- |
| `--background` | `oklch(0.985 0.002 260)` | `oklch(0.145 0.005 260)` (~#0b0c0e) |
| `--foreground` | `oklch(0.17 0.01 260)` | `oklch(0.97 0.003 260)` |
| `--card` | `oklch(1 0 0)` | `oklch(0.185 0.006 260)` |
| `--muted` | `oklch(0.96 0.004 260)` | `oklch(0.22 0.006 260)` |
| `--muted-foreground` | `oklch(0.50 0.015 260)` | `oklch(0.70 0.012 260)` |
| `--border` | `oklch(0.92 0.004 260)` | `oklch(1 0 0 / 0.09)` |
| `--input` | `oklch(0.90 0.005 260)` | `oklch(1 0 0 / 0.13)` |
| `--primary` (Akzent) | `oklch(0.56 0.11 190)` (Teal, ~#1d8a86) | `oklch(0.76 0.12 188)` |
| `--primary-foreground` | `oklch(0.985 0.002 260)` | `oklch(0.16 0.01 260)` |
| `--ring` | `oklch(0.56 0.11 190 / 0.5)` | `oklch(0.76 0.12 188 / 0.5)` |
| `--destructive` | `oklch(0.58 0.2 25)` | `oklch(0.7 0.19 22)` |

Primärbutton: Variante A (Standard) = `--foreground` auf `--background` invertiert (wie Vercel/Linear, hohe Eleganz); Akzent nur für Links, Highlights im H1, Häkchen, Fokus, Badge. Kontrast gemessen (WCAG): Teal L 0.56 auf Weiß nur 4,32:1 → für Text L 0.53 verwenden (4,86:1 auf Weiß, 4,65:1 auf `--background`); Dark-Teal 9,7:1, Muted-Text 5,7:1 (hell) und 7,4:1 (dunkel).

**Radius**: `--radius: 0.5rem` (Buttons, Inputs 8 px), Karten/Dialoge `calc(var(--radius) + 4px)` = 12 px, Badges/Pills 9999 px. Control-Höhe 40 px (Standard), 32 px (klein), 48 px (Auth/Hero-CTA).

**Fonts**: Sans `Geist` (next/font/google, OFL), Mono `Geist Mono`; Fallback `ui-sans-serif, system-ui`. Heading = Sans, Gewicht 600, Body 400, UI-Labels 500.

**Skala (Desktop / Mobil)**

| Rolle | Größe | Line-Height | Spacing | Gewicht |
| --- | --- | --- | --- | --- |
| Display/H1 | 64 / 40 px | 1,05 | -0,035 em | 600 |
| H2 | 40 / 28 px | 1,1 | -0,03 em | 600 |
| H3 | 20 px | 1,3 | -0,01 em | 600 |
| Body groß | 18 px | 1,6 | 0 | 400 |
| Body | 16 px (App: 14–15) | 1,5 | 0 | 400 |
| Small / Label | 14 px | 1,4 | 0 | 500 |
| Caption | 12 px | 1,3 | 0,01 em | 500 |

**Abstände/Layout**: Container max 1200 px, 24 px Gutter; Sektions-Padding 96 px (Mobil 64 px); Grid-Gap 24 px; Karten-Padding 24 px.

**Schatten/Border-Regel**: Alles Statische (Karten, Inputs, Tabellen) = 1 px `--border`, kein Schatten. Schwebendes (Popover, Dropdown, Dialog, Toast) = Border + `0 8px 32px oklch(0 0 0 / 0.12)`. Hover auf Karten: Border zu `--input` heben, Transition 150 ms. Dark: kein Schatten, nur Border + leichte Fläche (`--card`). Hintergrund-Glow (radialer Teal-Verlauf, Alpha <= 0.12) nur im Landing-Hero.

**Weitere Regeln**: Fokus = 2 px Ring mit 2 px Offset in `--ring`; Header sticky, `backdrop-blur-md`, Unterkante erst nach 8 px Scroll; Icons Lucide (1,5 px Stroke, 16/20 px); Auth-Seiten ohne Karte, 400 px Spalte, OAuth gleichwertig zu E-Mail.

## 6. Quellen (angesehen am 2026-10-22)

- https://supastarter.dev/, `/changelog`, `/docs/nextjs`, Pricing-Sektion auf `/` (Mobil 390 px geprüft)
- https://demo.supastarter.dev/ (Marketing-Demo), https://app-demo.supastarter.dev/login (Login; Signup nicht separat geöffnet, Dashboard nicht ohne Account erreichbar)
- https://linear.app/, `/pricing`, `/login` (Mobil geprüft)
- https://vercel.com/, `/pricing`, `/login`, `/signup` (Mobil geprüft)
- https://resend.com/, `/pricing`, `/login`, `/signup` (Mobil geprüft)
- https://test-dummy-beta.vercel.app/, `/pricing`, `/auth/sign-in`, `/auth/sign-up` (Mobil nicht geprüft; sign-up nur geladen, nicht separat bewertet)
- Lokal: `apps/web/styles/shadcn-ui.css`, `apps/web/lib/fonts.ts`
