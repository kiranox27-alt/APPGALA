import type { Evento, EventType, Invitado } from '@/types/guest';
import { EVENTO_TITULO } from '@/types/guest';
import { buildQrImageUrl, escapeXmlAttr } from '@/lib/qr';

export interface InvitationConfig {
  // Colors
  bgColor: string;
  titleColor: string;
  textColor: string;
  dataColor: string;
  borderColor: string;
  borderWidth: number;
  qrBgColor: string;
  // Background image
  bgImage: string | null;
  bgOpacity: number;
  // Frame
  frameShape: 'rounded' | 'soft' | 'square';
  // Font
  fontIdx: number;
  titleSize: number; // 0=small, 1=medium, 2=large, 3=xlarge
  textSize: number;
  letterSpacing: number;
  bold: boolean;
  italic: boolean;
  // QR position
  qrPosition: 'bottom' | 'right' | 'center';
  // Footer message
  footerMessage: string;
}

export const DEFAULT_CONFIG: InvitationConfig = {
  bgColor: '#faf8f3',
  titleColor: '#8a7a3a',
  textColor: '#2a2418',
  dataColor: '#7a6e4a',
  borderColor: '#d4af37',
  borderWidth: 2,
  qrBgColor: '#ffffff',
  bgImage: null,
  bgOpacity: 70,
  frameShape: 'rounded',
  fontIdx: 0,
  titleSize: 2,
  textSize: 1,
  letterSpacing: 0,
  bold: false,
  italic: false,
  qrPosition: 'bottom',
  footerMessage: '',
};

export const FONT_STYLES = [
  { name: 'Elegante Fina', font: 'Georgia, serif', weight: 300 },
  { name: 'Clásica Dorada', font: '"Times New Roman", serif', weight: 400 },
  { name: 'Moderna Minimalista', font: 'system-ui, sans-serif', weight: 300 },
  { name: 'Festiva Decorada', font: 'Georgia, serif', weight: 600 },
  { name: 'Caligráfica', font: '"Brush Script MT", cursive', weight: 400 },
  { name: 'Negra Elegante', font: 'Georgia, serif', weight: 700 },
  { name: 'Suave Redondeada', font: '"Trebuchet MS", sans-serif', weight: 400 },
];

export const TITLE_SIZES = [
  { name: 'Pequeño', px: 22, svg: 24 },
  { name: 'Mediano', px: 28, svg: 30 },
  { name: 'Grande', px: 36, svg: 38 },
  { name: 'Muy Grande', px: 44, svg: 46 },
];

export const TEXT_SIZES = [
  { name: 'Pequeño', px: 11, svg: 12 },
  { name: 'Mediano', px: 13, svg: 14 },
  { name: 'Grande', px: 15, svg: 16 },
];

export const FRAME_SHAPES = [
  { name: 'Redondeada', radius: 28, svgRadius: 30 },
  { name: 'Suave', radius: 12, svgRadius: 14 },
  { name: 'Recta', radius: 0, svgRadius: 0 },
];

export const QR_POSITIONS = [
  { name: 'Abajo', value: 'bottom' as const },
  { name: 'Derecha', value: 'right' as const },
  { name: 'Centro', value: 'center' as const },
];

export const COLOR_SWATCHES = [
  '#faf8f3', '#fff5f8', '#f0f5ff', '#f0fff8', '#f5edd9', '#f8e8f0',
  '#e0e8f8', '#e0f8f0', '#1a1a1a', '#2a1828', '#0a1828', '#0a2a28',
  '#fff', '#000', '#f5f5f5', '#222',
];

export const ACCENT_SWATCHES = [
  '#d4af37', '#d6709c', '#2e6da4', '#2e8b57', '#8b5cf6', '#9b1c3c',
  '#2a2a2a', '#5da5d9', '#c0392b', '#e67e22', '#16a085', '#34495e',
];

export function buildInvitationText(guest: Invitado, evento: Evento): string {
  const restrictions = guest.restriccion_alimentaria.filter((r) => r !== 'Normal');
  return [
    EVENTO_TITULO[evento.tipo], evento.nombre || '', '',
    `Invitado/a: ${guest.nombre_completo}`,
    `Personas: ${guest.pases_totales} (${guest.adultos} adultos, ${guest.ninos} niños)`,
    `Grupo: ${guest.categoria}`,
    `Mesa: ${guest.mesa}`,
    `Menú: ${guest.menu_elegido || 'A confirmar'}`,
    `Alimentación: ${restrictions.length ? restrictions.join(', ') : 'Normal'}`,
    `Fecha: ${formatDate(evento.fecha)}`,
    `Lugar: ${evento.lugar || 'A confirmar'}`,
    `Hora: ${formatHora(evento.hora)}`,
    '', `Código QR: ${buildQrImageUrl(guest.id, 200)}`,
  ].filter(Boolean).join('\n');
}

export function formatDate(fecha: string | null): string {
  if (!fecha) return 'Fecha a confirmar';
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatHora(hora: string | null): string {
  return hora ? `${hora} hs` : 'Hora a confirmar';
}

export function getFrameRadius(config: InvitationConfig): number {
  if (config.frameShape === 'rounded') return 28;
  if (config.frameShape === 'soft') return 12;
  return 0;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] ?? c));
}

export function makeInvitationSvg(guest: Invitado, evento: Evento, config: InvitationConfig): string {
  const qr = buildQrImageUrl(guest.id, 220);
  const restrictions = guest.restriccion_alimentaria.filter((r) => r !== 'Normal');
  const font = FONT_STYLES[config.fontIdx];
  const titleSize = TITLE_SIZES[config.titleSize].svg;
  const textSize = TEXT_SIZES[config.textSize].svg;
  const frameRadius = getFrameRadius(config);
  const fontStyle = config.italic ? 'italic' : 'normal';
  const fontWeight = config.bold ? font.weight + 200 : font.weight;

  const bgRect = config.bgImage
    ? `<rect width="700" height="700" fill="${config.bgColor}"/><image href="${escapeXmlAttr(config.bgImage)}" x="0" y="0" width="700" height="700" preserveAspectRatio="xMidYMid slice" opacity="${config.bgOpacity / 100}"/>`
    : `<rect width="700" height="700" fill="${config.bgColor}"/>`;

  const borderRect = `<rect x="18" y="18" width="664" height="664" rx="${frameRadius}" fill="none" stroke="${config.borderColor}" stroke-width="${config.borderWidth}" opacity="0.7"/>`;

  const titleText = `<text x="350" y="60" text-anchor="middle" font-family="${font.font}" font-size="14" fill="${config.dataColor}" letter-spacing="3.5" font-weight="500">INVITACIÓN ESPECIAL</text>
    <text x="350" y="${60 + titleSize + 10}" text-anchor="middle" font-family="${font.font}" font-size="${titleSize}" fill="${config.titleColor}" font-weight="${fontWeight}" font-style="${fontStyle}" letter-spacing="${config.letterSpacing}">${escapeXml(EVENTO_TITULO[evento.tipo])}</text>`;

  const eventName = evento.nombre ? `<text x="350" y="${60 + titleSize + 35}" text-anchor="middle" font-family="${font.font}" font-size="16" fill="${config.dataColor}" font-style="${fontStyle}">${escapeXml(evento.nombre)}</text>` : '';

  const divider = `<line x1="100" y1="${60 + titleSize + 55}" x2="600" y2="${60 + titleSize + 55}" stroke="${config.borderColor}" stroke-width="1" opacity="0.45"/>`;

  const guestLabel = `<text x="350" y="${60 + titleSize + 80}" text-anchor="middle" font-family="${font.font}" font-size="12" fill="${config.dataColor}" letter-spacing="2">INVITADO/A</text>`;
  const guestName = `<text x="350" y="${60 + titleSize + 110}" text-anchor="middle" font-family="${font.font}" font-size="${titleSize - 6}" fill="${config.textColor}" font-weight="${config.bold ? 700 : 600}" font-style="${fontStyle}">${escapeXml(guest.nombre_completo)}</text>`;

  const infoY = 60 + titleSize + 140;
  const infoItems = [
    `Adultos: ${guest.adultos}`,
    `Niños: ${guest.ninos}`,
    `Mesa: ${guest.mesa}`,
    `Grupo: ${guest.categoria}`,
    `Menú: ${guest.menu_elegido || 'A confirmar'}`,
    `Alim.: ${restrictions.length ? restrictions.join(', ') : 'Normal'}`,
  ];
  const infoText = infoItems.map((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col === 0 ? 60 : 370;
    const y = infoY + row * 28;
    return `<text x="${x}" y="${y}" font-family="${font.font}" font-size="${textSize}" fill="${config.textColor}">${escapeXml(item)}</text>`;
  }).join('');

  const detailsY = infoY + 3 * 28 + 20;
  const details = [
    formatDate(evento.fecha),
    evento.lugar || 'Lugar a confirmar',
    formatHora(evento.hora),
  ];
  const detailsText = details.map((d, i) => `<text x="350" y="${detailsY + i * 22}" text-anchor="middle" font-family="${font.font}" font-size="${textSize}" fill="${config.dataColor}">${escapeXml(d)}</text>`).join('');

  const qrSize = 200;
  let qrX = 250, qrY = detailsY + 80;
  if (config.qrPosition === 'right') { qrX = 430; qrY = detailsY + 20; }
  else if (config.qrPosition === 'center') { qrX = 250; qrY = detailsY + 40; }
  else { qrX = 250; qrY = detailsY + 80; }

  const qrRect = `<rect x="${qrX - 10}" y="${qrY - 10}" width="${qrSize + 20}" height="${qrSize + 20}" rx="12" fill="${config.qrBgColor}" stroke="${config.borderColor}" stroke-width="${config.borderWidth}"/>`;
  const qrImg = `<image href="${escapeXmlAttr(qr)}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}"/>`;
  const qrLabel = `<text x="350" y="${qrY + qrSize + 35}" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="${config.dataColor}" letter-spacing="2">PRESENTÁ ESTE CÓDIGO EN RECEPCIÓN</text>`;

  const footerY = qrY + qrSize + 65;
  const footerText = config.footerMessage
    ? `<line x1="100" y1="${footerY}" x2="600" y2="${footerY}" stroke="${config.borderColor}" stroke-width="1" opacity="0.3"/><text x="350" y="${footerY + 25}" text-anchor="middle" font-family="${font.font}" font-size="14" fill="${config.textColor}" font-style="${fontStyle}" font-weight="${config.bold ? 600 : 400}">${escapeXml(config.footerMessage)}</text>`
    : '';

  const totalHeight = Math.max(footerY + 50, qrY + qrSize + 70);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="${totalHeight}" viewBox="0 0 700 ${totalHeight}">${bgRect}${borderRect}${titleText}${eventName}${divider}${guestLabel}${guestName}${infoText}${detailsText}${qrRect}${qrImg}${qrLabel}${footerText}</svg>`;
}

export function downloadAllInvitationsHtml(
  guests: Invitado[],
  evento: Evento,
  config: InvitationConfig,
): void {
  if (guests.length === 0) return;

  const cards = guests.map((g) => makeInvitationSvg(g, evento, config)).join('\n');
  const font = FONT_STYLES[config.fontIdx];

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Invitaciones - ${escapeXml(evento.nombre || evento.tipo)}</title>
<style>
  @page { margin: 16mm; }
  body { margin: 0; padding: 24px; background: #1a1a1a; font-family: ${font.font}; }
  .grid { display: flex; flex-wrap: wrap; gap: 24px; justify-content: center; }
  .card { page-break-inside: avoid; margin-bottom: 24px; }
  .card svg { display: block; max-width: 100%; height: auto; border-radius: ${getFrameRadius(config)}px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
  @media print { body { background: white; padding: 0; } .grid { display: block; } .card { margin: 0; page-break-after: always; } .card:last-child { page-break-after: auto; } }
</style>
</head>
<body>
<div class="grid">
${cards.split('\n').map((svg) => `<div class="card">${svg}</div>`).join('\n')}
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `invitaciones-${(evento.nombre || evento.tipo).toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
