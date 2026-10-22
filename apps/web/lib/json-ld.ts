/** JSON for a `<script type="application/ld+json">`; escapes `<` so copy can never close the script tag. */
export function jsonLd(data: unknown) {
  return JSON.stringify(data).replaceAll('<', '\\u003c');
}
