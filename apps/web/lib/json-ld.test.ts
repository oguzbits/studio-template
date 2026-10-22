import { describe, expect, it } from 'vitest';

import { jsonLd } from './json-ld';

describe('jsonLd', () => {
  it('cannot close the surrounding script tag', () => {
    const html = jsonLd({ text: '</script><script>alert(1)</script>' });

    expect(html).not.toContain('<');
    expect(JSON.parse(html)).toEqual({
      text: '</script><script>alert(1)</script>',
    });
  });
});
