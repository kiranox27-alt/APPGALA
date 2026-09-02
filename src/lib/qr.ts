export function buildQrImageUrl(id: number, size = 240): string {
  const payload = String(id);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    payload,
  )}&color=000000&bgcolor=ffffff&margin=8&qzone=2`;
}

export function escapeXmlAttr(value: string): string {
  return value.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] ?? c));
}
