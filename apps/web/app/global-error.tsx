'use client';

// Replaces the root layout, so no providers, no app CSS and no i18n are available:
// plain markup, a small inline stylesheet with the theme's colours, English copy.
const css = `
  :root { color-scheme: light dark; --bg: #f6f5f3; --ink: #1b1814; --muted: #5f5a55; --accent: #245c41; --accent-ink: #f6f5f3; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #1f1e1c; --ink: #eae8e3; --muted: #a7a49f; --accent: #97c8ac; --accent-ink: #0e1913; }
  }
  body { margin: 0; min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; padding: 16px; box-sizing: border-box; text-align: center; background: var(--bg); color: var(--ink); font: 18px/1.5 system-ui, sans-serif; }
  h1 { font: 400 clamp(2.75rem, 1rem + 4.6vw, 5.5rem)/1 Georgia, 'Times New Roman', serif; letter-spacing: -0.03em; margin: 0 0 20px; }
  p { margin: 0; color: var(--muted); font-size: 20px; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 16px 32px; }
  .primary { display: inline-flex; align-items: center; height: 48px; padding: 0 24px; border-radius: 8px; background: var(--accent); color: var(--accent-ink); text-decoration: none; font-weight: 500; }
  .quiet { font: inherit; font-weight: 500; background: none; border: 0; padding: 0; color: inherit; cursor: pointer; text-decoration: underline; text-underline-offset: 0.25em; }
`;

const GlobalErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  console.error(error);

  return (
    <html lang="en">
      <head>
        <style>{css}</style>
      </head>
      <body>
        <main>
          <h1>Sorry, something went wrong.</h1>
          <p>An unexpected error occurred. Please try again.</p>
        </main>

        <div className="actions">
          <a href="/" className="primary">
            Back to home
          </a>

          <button type="button" onClick={reset} className="quiet">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
};

export default GlobalErrorPage;
