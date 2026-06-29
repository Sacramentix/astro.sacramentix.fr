import QRCode from "qrcode";

/**
 * Generate a QR code as an inline base64 PNG data URI at build time.
 * Uses lowest error correction (L), no margin, and 1px per module
 * for the smallest possible PNG. Scale up in CSS with image-rendering: pixelated.
 */
export async function generateQrPng(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "L",
    margin: 0,
    scale: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}