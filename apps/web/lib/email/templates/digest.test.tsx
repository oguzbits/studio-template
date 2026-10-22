import { render } from 'react-email';
import { describe, expect, it } from 'vitest';

import { DigestEmail } from './digest';

describe('DigestEmail', () => {
  it('renders every item as a link with its title', async () => {
    const items = [
      { title: 'First', url: 'https://example.com/a', summary: 'sum' },
      { title: 'Second', url: 'https://example.com/b' },
    ];
    const html = await render(<DigestEmail items={items} date="2026-10-22" />);

    for (const item of items) {
      expect(html).toContain(`href="${item.url}"`);
      expect(html).toContain(item.title);
    }
  });
});
