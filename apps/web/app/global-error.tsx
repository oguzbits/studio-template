'use client';

// Replaces the root layout, so no providers, no CSS and no i18n are available:
// plain markup with inline styles and English copy.
const GlobalErrorPage = ({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  console.error(error);

  const button = {
    font: 'inherit',
    padding: '0 16px',
    height: 40,
    borderRadius: 8,
    border: '1px solid #8883',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  } as const;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 16,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          colorScheme: 'light dark',
        }}
      >
        <div style={{ maxWidth: 440 }}>
          <h1 style={{ fontSize: 30, margin: '0 0 8px', fontWeight: 600 }}>
            Sorry, something went wrong.
          </h1>

          <p style={{ margin: 0, opacity: 0.7 }}>
            An unexpected error occurred. Please try again.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/" style={{ ...button, background: '#111', color: '#fff' }}>
            Back to home
          </a>

          <button
            type="button"
            onClick={reset}
            style={{ ...button, background: 'transparent', color: 'inherit' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
};

export default GlobalErrorPage;
