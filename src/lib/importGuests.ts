import * as XLSX from 'xlsx';
import type { InvitadoInsert, Restriccion } from '@/types/guest';
import { RESTRICCIONES } from '@/types/guest';

export interface ImportedGuest {
  nombre_completo: string;
  adultos: number;
  ninos: number;
  categoria: string;
  mesa: string;
  menu_elegido: string | null;
  restriccion_alimentaria: Restriccion[];
  notas: string | null;
  asistencia_confirmada: boolean;
  pases_totales: number;
  valid: boolean;
  errors: string[];
}

export interface ImportResult {
  guests: ImportedGuest[];
  totalRows: number;
  validCount: number;
  errorCount: number;
}

const HEADER_ALIASES: Record<string, string> = {
  'nombre completo': 'nombre_completo',
  'nombre': 'nombre_completo',
  'name': 'nombre_completo',
  'adultos': 'adultos',
  'niños': 'ninos',
  'ninos': 'ninos',
  'kids': 'ninos',
  'categoria': 'categoria',
  'categoria / grupo': 'categoria',
  'grupo': 'categoria',
  'mesa': 'mesa',
  'mesa o lugar asignado': 'mesa',
  'lugar': 'mesa',
  'menu': 'menu_elegido',
  'menu elegido': 'menu_elegido',
  'tipo de alimentacion': 'restriccion_alimentaria',
  'tipo de alimentación': 'restriccion_alimentaria',
  'alimentacion': 'restriccion_alimentaria',
  'alimentación': 'restriccion_alimentaria',
  'restriccion alimentaria': 'restriccion_alimentaria',
  'restricción alimentaria': 'restriccion_alimentaria',
  'restriccion': 'restriccion_alimentaria',
  'restricción': 'restriccion_alimentaria',
  'notas': 'notas',
  'nota': 'notas',
  'observaciones': 'notas',
  'asistencia confirmada': 'asistencia_confirmada',
  'confirmada': 'asistencia_confirmada',
  'confirmado': 'asistencia_confirmada',
  'pases totales': 'pases_totales',
  'pases': 'pases_totales',
  'cantidad de acompanantes': 'pases_totales',
  'cantidad de acompañantes': 'pases_totales',
  'personas': 'pases_totales',
  'estado': 'estado',
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function parseRestricciones(value: string): Restriccion[] {
  if (!value || !value.trim()) return ['Normal'];
  const parts = value.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  const result: Restriccion[] = [];
  for (const p of parts) {
    const lower = p.toLowerCase();
    const match = RESTRICCIONES.find((r) => r.toLowerCase() === lower);
    if (match) result.push(match);
  }
  return result.length > 0 ? result : ['Normal'];
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Math.max(0, Math.floor(value));
  if (typeof value === 'string') {
    const n = parseInt(value.replace(/[^\d-]/g, ''), 10);
    return Number.isNaN(n) ? fallback : Math.max(0, n);
  }
  return fallback;
}

function parseBool(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    return ['si', 'sí', 'true', '1', 'confirmado', 'confirmada', 'yes'].includes(v);
  }
  return false;
}

export async function parseGuestExcel(file: File): Promise<ImportResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { guests: [], totalRows: 0, validCount: 0, errorCount: 0 };

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rawRows.length === 0) return { guests: [], totalRows: 0, validCount: 0, errorCount: 0 };

  const sample = rawRows[0];
  const colMap: Record<string, string> = {};
  for (const key of Object.keys(sample)) {
    const mapped = HEADER_ALIASES[normalizeHeader(key)];
    if (mapped) colMap[mapped] = key;
  }

  const guests: ImportedGuest[] = rawRows.map((row) => {
    const errors: string[] = [];

    const nombre = String(row[colMap.nombre_completo ?? 'nombre_completo'] ?? row['Nombre completo'] ?? '').trim();
    if (!nombre) errors.push('Falta el nombre');

    const adultos = colMap.adultos ? parseNumber(row[colMap.adultos], 1) : 1;
    const ninos = colMap.ninos ? parseNumber(row[colMap.ninos], 0) : 0;
    const pasesFromCol = colMap.pases_totales ? parseNumber(row[colMap.pases_totales], 0) : 0;
    const pases_totales = pasesFromCol > 0 ? pasesFromCol : adultos + ninos;

    const categoria = colMap.categoria ? String(row[colMap.categoria] ?? '').trim() : '';
    const mesa = colMap.mesa ? String(row[colMap.mesa] ?? '').trim() : '';
    const menu = colMap.menu_elegido ? String(row[colMap.menu_elegido] ?? '').trim() : '';
    const restrRaw = colMap.restriccion_alimentaria ? String(row[colMap.restriccion_alimentaria] ?? '') : '';
    const notas = colMap.notas ? String(row[colMap.notas] ?? '').trim() : '';
    const confirmada = colMap.asistencia_confirmada ? parseBool(row[colMap.asistencia_confirmada]) : false;

    return {
      nombre_completo: nombre,
      adultos,
      ninos,
      pases_totales,
      categoria: categoria || 'Otros',
      mesa: mesa || 'Sin asignar',
      menu_elegido: menu || null,
      restriccion_alimentaria: parseRestricciones(restrRaw),
      notas: notas || null,
      asistencia_confirmada: confirmada,
      valid: errors.length === 0,
      errors,
    };
  });

  return {
    guests,
    totalRows: guests.length,
    validCount: guests.filter((g) => g.valid).length,
    errorCount: guests.filter((g) => !g.valid).length,
  };
}

export function importedGuestToInsert(g: ImportedGuest, eventoId: number): InvitadoInsert {
  return {
    nombre_completo: g.nombre_completo,
    adultos: g.adultos,
    ninos: g.ninos,
    pases_totales: g.pases_totales,
    categoria: g.categoria,
    mesa: g.mesa,
    menu_elegido: g.menu_elegido,
    restriccion_alimentaria: g.restriccion_alimentaria,
    notas: g.notas,
    asistencia_confirmada: g.asistencia_confirmada,
    evento_id: eventoId,
    estado_ingreso: 'Pendiente',
  };
}
