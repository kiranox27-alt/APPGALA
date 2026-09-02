import type { Evento, EventType, Invitado } from '@/types/guest';
import { EVENTO_TITULO } from '@/types/guest';
import { buildQrImageUrl } from '@/lib/qr';

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
