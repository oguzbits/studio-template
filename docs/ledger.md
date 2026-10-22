# Ledger – Plan 2026-10-22-studio-template

| Meilenstein | Ausführung | Dauer | Subagent-Tokens | Notiz |
|---|---|---|---|---|
| M0 Basis + Hooks | selbst | ~70 min | – | ~40 min davon Docker-Image-Pull + Port-Konflikt |
| M1 DB-Fundament | selbst | ~15 min | – | pgTAP-Red-Check gemacht |
| M2 Billing | Subagent opus | ~15 min | 152k | inkl. Fix-Runde; + Research-Agent (haiku) 61k, 2 min |
| M2 Review | Subagent sonnet | ~1.5 min | 68k | nichts Kritisches; 3 Fixes + Testlücken |
| M3+M6 E-Mail, Marketing | Subagent sonnet | ~7 min | 113k | react-email statt deprecated @react-email/components |
| M2 Review-Fixes | Subagent opus (fortgesetzt) | ~3 min | 173k (kumulierter Kontext) | 5 Fixes, 11 Tests |
| M4 Jobs | Subagent opus | ~10 min | 133k | pg_cron/pg_net/dblink lokal ok; 4 Guard-Checks rot |
| M4 Review | Subagent sonnet | ~1 min | 59k | 1 bestätigter Endlos-Reclaim-Bug + 5 weitere |
| M5 KI-Schicht | Subagent sonnet | ~2 min | 118k | claude-haiku-5-5 Default; gpt-4o-mini-Preis ungeprüft |
| M4 Review-Fixes | Subagent opus (fortgesetzt) | ~4 min | 161k (kumulierter Kontext) | 7 Fixes, pgTAP 41, Vitest 93; leere Digest-Liste schreibt keinen Marker |
| M8 Bootstrap, AGENTS.md, Skills | Hauptsession | ~25 min | – | studio:new nur Dry-Run geprüft; echte Läufe in M9 |
