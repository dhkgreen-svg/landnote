import QRCode from 'qrcode';

/**
 * Generate a real, 100% scannable QR code PNG Data URL from any link or text
 */
export async function generateQrCodeDataUrl(text: string): Promise<string> {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      width: 320,
      margin: 2,
      color: {
        dark: '#064E3B', // Deep Emerald for ParkOn brand & high contrast
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR Code:', err);
    return '';
  }
}
