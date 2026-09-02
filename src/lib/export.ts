import type { Invitado } from '@/types/guest';

function escapeCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportGuestsToExcel(guests: Invitado[]): void {
  const headers = ['Nombre completo', 'Cantidad de acompañantes', 'Categoría / Grupo', 'Mesa o lugar asignado', 'Tipo de alimentación', 'Estado'];
  const rows = guests.map((guest) => [
    guest.nombre_completo,
    String(guest.pases_totales),
    guest.categoria,
    guest.mesa,
    guest.restriccion_alimentaria.join(', '),
    guest.estado_ingreso === 'Ingresado' ? 'Ya ingresó' : 'Pendiente',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(cell)).join(';'))
    .join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `lista-invitados-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
