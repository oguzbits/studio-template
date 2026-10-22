import appConfig from '~/config/app.config';

// Monogram of the product name; replace with app/icon.svg once a logo exists.
export function Monogram({ px }: { px: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: px / 5,
        background: '#111',
        color: '#fff',
        fontSize: px * 0.6,
        fontWeight: 700,
      }}
    >
      {appConfig.name.charAt(0).toUpperCase()}
    </div>
  );
}
