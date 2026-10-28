import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeGenProps {
  value: string;
  size?: number;
  fgColor?: string;
  bgColor?: string;
}

export default function QRCodeGen({
  value,
  size = 90,
  fgColor = '#000000',
  bgColor = '#ffffff',
}: QRCodeGenProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  useEffect(() => {
    if (!value) {
      setQrImageUrl('');
      return;
    }

    QRCode.toDataURL(
      value,
      {
        width: size,
        margin: 1,
        color: {
          dark: fgColor,
          light: bgColor,
        },
      },
      (err, url) => {
        if (err) {
          console.error('QR Code generation error:', err);
          return;
        }
        setQrImageUrl(url);
      }
    );
  }, [value, size, fgColor, bgColor]);

  if (!value) return null;

  return (
    <div className="flex flex-col items-center justify-center p-1 bg-white rounded-lg shadow-sm border border-slate-100 shrink-0">
      {qrImageUrl ? (
        <img
          src={qrImageUrl}
          alt="Portfolio QR"
          width={size}
          height={size}
          className="object-contain block"
          style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }}
          referrerPolicy="no-referrer"
          id="cv-generated-qrcode"
        />
      ) : (
        <div
          className="animate-pulse bg-slate-200 rounded animate-infinite"
          style={{ width: `${size}px`, height: `${size}px` }}
        />
      )}
    </div>
  );
}
