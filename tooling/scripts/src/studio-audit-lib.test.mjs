import { describe, expect, it } from 'vitest';

import {
  checkBranding,
  checkHeaders,
  checkLighthouse,
  checkSeo,
  failures,
} from './studio-audit-lib.mjs';

const goodHeaders = {
  'content-security-policy':
    "default-src 'self'; object-src 'none'; frame-ancestors 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=()',
  'cross-origin-opener-policy': 'same-origin',
  'strict-transport-security': 'max-age=63072000',
};

describe('checkHeaders', () => {
  it('akzeptiert vollständige Header', () => {
    expect(failures(checkHeaders(goodHeaders))).toEqual([]);
  });
  it('meldet fehlendes frame-ancestors und nosniff', () => {
    const headers = {
      ...goodHeaders,
      'content-security-policy': "default-src 'self'",
    };
    delete headers['x-content-type-options'];
    const ids = failures(checkHeaders(headers)).map((r) => r.id);
    expect(ids).toEqual(
      expect.arrayContaining(['header:frame-ancestors', 'header:nosniff']),
    );
  });
  it('ACAO * ist nur eine Warnung', () => {
    const results = checkHeaders({
      ...goodHeaders,
      'access-control-allow-origin': '*',
    });
    const acao = results.find((r) => r.id === 'header:acao');
    expect(acao).toMatchObject({ ok: false, hard: false });
    expect(failures(results)).toEqual([]);
  });
});

const page = (head) => `<html><head>${head}</head><body></body></html>`;
const url = 'https://x.vercel.app/pricing';
const goodHead = `<title>Pricing</title><meta name="description" content="d"/><link rel="canonical" href="${url}"/><meta property="og:url" content="${url}"/><link rel="manifest" href="/manifest.webmanifest"/>`;

describe('checkSeo', () => {
  it('akzeptiert korrekte Metadaten', () => {
    expect(failures(checkSeo(page(goodHead), url))).toEqual([]);
  });
  it('meldet fehlendes canonical und falsches og:url', () => {
    const head = goodHead
      .replace(/<link rel="canonical"[^>]*>/, '')
      .replace(
        `property="og:url" content="${url}"`,
        'content="https://x.vercel.app" property="og:url"',
      );
    const ids = failures(checkSeo(page(head), url)).map((r) => r.id);
    expect(ids).toEqual(['seo:canonical /pricing', 'seo:og:url /pricing']);
  });
});

describe('checkBranding', () => {
  it('findet Makerkit unabhängig von Groß-/Kleinschreibung', () => {
    expect(checkBranding('<p>Built with MAKERKIT</p>', '/').ok).toBe(false);
    expect(checkBranding('<p>Placeholder copy</p>', '/').ok).toBe(false);
  });
  it('ignoriert placeholder-Attribute und Tailwind-Varianten', () => {
    const html =
      '<input placeholder="you@example.com" class="placeholder:text-x"/><script>{\\"placeholder\\":\\"a\\"}</script>';
    expect(checkBranding(html, '/').ok).toBe(true);
  });
});

describe('checkLighthouse', () => {
  const bar = {
    performance: 90,
    accessibility: 100,
    'best-practices': 95,
    seo: 100,
    lcpMs: 2500,
    scriptKb: 350,
  };
  const lhr = (lcp, scriptBytes) => ({
    categories: {
      performance: { score: 0.93 },
      accessibility: { score: 1 },
      'best-practices': { score: 1 },
      seo: { score: 1 },
    },
    audits: {
      'largest-contentful-paint': { numericValue: lcp },
      'resource-summary': {
        details: {
          items: [{ resourceType: 'script', transferSize: scriptBytes }],
        },
      },
    },
  });
  it('besteht innerhalb der Grenzwerte', () => {
    expect(
      failures(checkLighthouse(lhr(2400, 300_000), '/ mobile', bar)),
    ).toEqual([]);
  });
  it('fällt bei LCP 2600 ms und 400 KB Script durch', () => {
    const ids = failures(
      checkLighthouse(lhr(2600, 400 * 1024), '/ mobile', bar),
    ).map((r) => r.id);
    expect(ids).toEqual(['lh:lcp / mobile', 'lh:script / mobile']);
  });
});
