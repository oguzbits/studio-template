import appConfig from '~/config/app.config';
import siteConfig from '~/config/site.config';
import { buildLlmsTxt } from '~/lib/llms-txt';

export function GET() {
  return new Response(buildLlmsTxt(appConfig.name, appConfig.url, siteConfig), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
