import type { SiteConfig } from '~/config/site.config';

// llms.txt (llmstxt.org): a short Markdown summary for language models.
export function buildLlmsTxt(
  name: string,
  url: string,
  site: Pick<SiteConfig, 'tagline' | 'description' | 'faq'>,
) {
  const pages = [
    `- [Pricing](${url}/pricing)`,
    ...(site.faq.length > 0 ? [`- [FAQ](${url}/faq)`] : []),
    `- [Contact](${url}/contact)`,
  ];

  return `# ${name}\n\n> ${site.tagline}. ${site.description}\n\n## Pages\n\n${pages.join('\n')}\n`;
}
