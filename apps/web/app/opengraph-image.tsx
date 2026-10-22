import { ImageResponse } from 'next/og';

import appConfig from '~/config/app.config';

export const alt = appConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 80,
        background: '#111',
        color: '#fff',
      }}
    >
      <div style={{ fontSize: 96, fontWeight: 700 }}>{appConfig.name}</div>
      <div style={{ fontSize: 40, marginTop: 24, color: '#aaa' }}>
        {appConfig.description}
      </div>
    </div>,
    size,
  );
}
