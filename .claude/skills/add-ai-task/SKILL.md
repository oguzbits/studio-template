---
name: add-ai-task
description: Use when adding an LLM/AI feature (classification, extraction, summarization, generation with structured output) to studio-template.
---

# KI-Aufgabe hinzufügen

Einstieg: `generateStructured({ schema, prompt, model?, system? })` aus `apps/web/lib/ai/generate-structured.ts`.
Liefert typsicher `z.infer<schema>`, cached nach Hash (Modell + Schema + System + Prompt) in `ai_cache`,
loggt jeden Aufruf mit Tokens und Kosten in `ai_calls` (sichtbar auf `/admin`), wiederholt einmal bei
Schemafehler. Provider per Env (`AI_PROVIDER=anthropic|openai-compatible`, `AI_MODEL`, `AI_BASE_URL`), eigene
fetch-Adapter in `lib/ai/providers/` – kein SDK hinzufügen.

1. **Modul** `apps/web/lib/<feature>/<task>.ts` mit `import 'server-only';`:
   ```ts
   const Schema = z.object({ category: z.enum(['bug', 'feature', 'question']), confidence: z.number() });

   export function classifyTicket(text: string) {
     return generateStructured({
       schema: Schema,
       system: 'Classify the support ticket.',
       prompt: text,
     });
   }
   ```
   Schema so eng wie möglich (Enums statt freier Strings), Feldbeschreibungen mit `.describe()`.
   Nutzereingaben gehören in `prompt`, nie in `system`.
2. **Wo aufrufen**: Länger als ein paar Sekunden oder viele Aufrufe → als Job (Skill `add-cron-job`).
   Direkt in Server Actions nur für kurze, nutzerausgelöste Aufrufe; dann Zugang prüfen
   (`requireEntitlement`) und Missbrauch begrenzen.
3. **Fehler**: `AiProviderError` (HTTP/Netz) und `AiSchemaError` (auch nach Retry ungültig) – im Job einfach
   werfen lassen (Retry), in Actions in eine verständliche Fehlermeldung übersetzen.
4. **Neues Modell**: Preis in `config/studio.config.ts` → `ai.prices` (EUR pro Mio. Tokens) eintragen, sonst
   zählt `/admin` den Aufruf als „ohne Preis“.
5. **Test**: `vi.mock('~/lib/ai/generate-structured', …)` im Aufrufer-Test; Prompt und Ergebnisverarbeitung
   prüfen. Nie echte API in Tests.
6. `pnpm check` → Commit `feat(ai): …`.
