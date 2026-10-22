// Reine Prüffunktionen für `pnpm studio:audit` (testbar, ohne I/O).
// Jede Prüfung liefert { id, ok, actual, expected, hard }; nur harte Fehler lassen das Audit scheitern.

const result = (id, ok, actual, expected, hard = true) => ({
  id,
  ok: Boolean(ok),
  actual: String(actual ?? '–'),
  expected,
  hard,
});

export const failures = (results) => results.filter((r) => r.hard && !r.ok);

export function checkHeaders(headers) {
  const h = (name) => headers[name] ?? '';
  const csp = h('content-security-policy');
  return [
    result('header:csp', csp, csp ? 'gesetzt' : 'fehlt', 'gesetzt'),
    result(
      'header:frame-ancestors',
      /frame-ancestors 'none'/.test(csp),
      csp.match(/frame-ancestors [^;]*/)?.[0] ?? 'fehlt',
      "frame-ancestors 'none'",
    ),
    result(
      'header:object-src',
      /object-src 'none'/.test(csp),
      csp.match(/object-src [^;]*/)?.[0] ?? 'fehlt',
      "object-src 'none'",
    ),
    result(
      'header:nosniff',
      h('x-content-type-options') === 'nosniff',
      h('x-content-type-options'),
      'nosniff',
    ),
    result(
      'header:referrer-policy',
      h('referrer-policy'),
      h('referrer-policy'),
      'gesetzt',
    ),
    result(
      'header:permissions-policy',
      h('permissions-policy'),
      h('permissions-policy') ? 'gesetzt' : 'fehlt',
      'gesetzt',
    ),
    result(
      'header:coop',
      h('cross-origin-opener-policy'),
      h('cross-origin-opener-policy'),
      'gesetzt',
    ),
    result(
      'header:hsts',
      h('strict-transport-security'),
      h('strict-transport-security') ? 'gesetzt' : 'fehlt',
      'gesetzt',
    ),
    // Vercel setzt ACAO * auf gecachten öffentlichen Seiten; ohne Credentials harmlos
    result(
      'header:acao',
      h('access-control-allow-origin') !== '*',
      h('access-control-allow-origin'),
      'nicht *',
      false,
    ),
  ];
}

function tags(html, name) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(
    ([tag]) =>
      Object.fromEntries(
        [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, k, v]) => [
          k.toLowerCase(),
          v,
        ]),
      ),
  );
}

export function checkSeo(html, pageUrl) {
  const path = new URL(pageUrl).pathname;
  const meta = tags(html, 'meta');
  const links = tags(html, 'link');
  const metaContent = (attr, value) =>
    meta.find((m) => m[attr] === value)?.content;
  const canonical = links.find((l) => l.rel === 'canonical')?.href;
  const ogUrl = metaContent('property', 'og:url');
  // Next normalisiert die Root-URL mit oder ohne Slash
  const same = (a) => a && a.replace(/\/$/, '') === pageUrl.replace(/\/$/, '');
  return [
    result(
      `seo:title ${path}`,
      /<title>[^<]+<\/title>/.test(html),
      '',
      'gesetzt',
    ),
    result(
      `seo:description ${path}`,
      metaContent('name', 'description'),
      metaContent('name', 'description') ? 'gesetzt' : 'fehlt',
      'gesetzt',
    ),
    result(`seo:canonical ${path}`, same(canonical), canonical, pageUrl),
    result(`seo:og:url ${path}`, same(ogUrl), ogUrl, pageUrl),
    result(
      `seo:manifest ${path}`,
      links.some((l) => l.rel === 'manifest'),
      '',
      'verlinkt',
    ),
  ];
}

// `placeholder` als Attribut, JSON-Key oder Tailwind-Variante ist kein Platzhaltertext
const BRANDING = /makerkit|lorem ipsum|\bplaceholder\b(?![\\"'=:-])/gi;

export function checkBranding(html, path) {
  const hits = [...new Set(html.match(BRANDING) ?? [])];
  return result(
    `content:branding ${path}`,
    hits.length === 0,
    hits.join(', ') || 'keine',
    'keine Treffer',
  );
}

export function checkLighthouse(lhr, label, bar) {
  const score = (id) => Math.round((lhr.categories[id]?.score ?? 0) * 100);
  const lcp = Math.round(
    lhr.audits['largest-contentful-paint']?.numericValue ?? Infinity,
  );
  const scriptKb = Math.round(
    (lhr.audits['resource-summary']?.details?.items ?? []).find(
      (i) => i.resourceType === 'script',
    )?.transferSize / 1024 || 0,
  );
  return [
    ...['performance', 'accessibility', 'best-practices', 'seo'].map((id) =>
      result(
        `lh:${id} ${label}`,
        score(id) >= bar[id],
        score(id),
        `≥ ${bar[id]}`,
      ),
    ),
    result(
      `lh:lcp ${label}`,
      lcp < bar.lcpMs,
      `${lcp} ms`,
      `< ${bar.lcpMs} ms`,
    ),
    result(
      `lh:script ${label}`,
      scriptKb < bar.scriptKb,
      `${scriptKb} KB`,
      `< ${bar.scriptKb} KB`,
    ),
  ];
}
