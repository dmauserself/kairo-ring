import { ImageResponse } from 'next/og';

export const alt = 'KAIRO — smart ring';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          backgroundColor: '#ECEBE7',
          color: '#060606',
        }}
      >
        <div style={{ fontSize: 28, display: 'flex' }}>Smart ring for sleep, HRV and recovery</div>
        <div style={{ fontSize: 250, letterSpacing: -6, lineHeight: 1, display: 'flex', transform: 'scaleX(1.35)', transformOrigin: 'left' }}>
          KAIRO
        </div>
      </div>
    ),
    size,
  );
}
