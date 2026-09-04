import { useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { createGuest } from '@/lib/guests';
import { importedGuestToInsert, parseGuestExcel } from '@/lib/importGuests';
import type { ImportedGuest, ImportResult } from '@/lib/importGuests';

interface GuestImportModalProps {
  eventoId: number;
  onClose: () => void;
  onImported: () => Promise<void>;
}

export default function GuestImportModal({ eventoId, onClose, onImported }: GuestImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  async function handleFile(file: File | undefined): Promise<void> {
    if (!file) return;
    setReading(true);
    setError(null);
    setSavedCount(0);
    try {
      setResult(await parseGuestExcel(file));
    } catch {
      setResult(null);
      setError('No se pudo leer la planilla. Usá un archivo Excel válido (.xlsx o .xls).');
    } finally {
      setReading(false);
    }
  }

  async function handleImport(): Promise<void> {
    if (!result || result.validCount === 0) return;
    setSaving(true);
    setError(null);
    try {
      const validGuests = result.guests.filter((guest) => guest.valid);
      for (const guest of validGuests) {
        await createGuest(importedGuestToInsert(guest, eventoId));
      }
      setSavedCount(validGuests.length);
      await onImported();
    } catch {
      setError('No se pudieron guardar todos los invitados. Verificá la conexión e intentá nuevamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-ink-800 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-gold-400">
              <FileSpreadsheet className="h-5 w-5" />
              <h2 className="font-serif text-xl font-light text-white">Importar invitados</h2>
            </div>
            <p className="text-xs font-light leading-relaxed text-white/50">Cargá una planilla y revisá los datos antes de agregarlos al evento.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Cerrar">
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <button onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gold-400/40 bg-gold-400/5 px-4 py-5 text-sm text-gold-300 transition-colors hover:bg-gold-400/10" disabled={reading || saving}>
          <Upload className="h-5 w-5" />
          {reading ? 'Leyendo planilla…' : 'Seleccionar archivo Excel'}
        </button>
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(event) => { void handleFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />

        <div className="mt-3 rounded-xl border border-white/10 bg-ink-900/50 px-3 py-2.5 text-xs font-light text-white/45">
          Columnas reconocidas: Nombre completo, Adultos, Niños, Categoría / Grupo, Mesa, Menú, Tipo de alimentación, Notas y Asistencia confirmada.
        </div>

        {error && <p className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}

        {result && (
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-white/60">{result.totalRows} filas encontradas</span>
              <span className="text-emerald2-400">{result.validCount} listas para importar</span>
              {result.errorCount > 0 && <span className="text-red-300">{result.errorCount} con errores</span>}
            </div>
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/10">
              {result.guests.map((guest: ImportedGuest, index: number) => (
                <div key={`${guest.nombre_completo}-${index}`} className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{guest.nombre_completo || 'Sin nombre'}</p>
                    <p className="truncate text-xs text-white/45">{guest.categoria} · {guest.mesa} · {guest.pases_totales} personas</p>
                  </div>
                  {guest.valid ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald2-400" /> : <span className="flex shrink-0 items-center gap-1 text-xs text-red-300"><AlertCircle className="h-4 w-4" />{guest.errors.join(', ')}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {savedCount > 0 && <p className="mt-3 text-center text-sm text-emerald2-400">Se agregaron {savedCount} invitados correctamente.</p>}

        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-white/15 py-3 text-sm text-white/70 hover:bg-white/5">Cerrar</button>
          <button onClick={() => void handleImport()} disabled={!result || result.validCount === 0 || saving} className="flex-1 rounded-full bg-emerald2-500 py-3 text-sm font-semibold text-ink-900 transition-all hover:bg-emerald2-400 disabled:cursor-not-allowed disabled:opacity-40">{saving ? 'Importando…' : `Agregar ${result?.validCount ?? 0} invitados`}</button>
        </div>
      </div>
    </div>
  );
}
