import { useEffect, useMemo, useState } from 'react';
import { Search, X, UserCircle2, Armchair, Utensils, CheckCircle2, Clock, LogIn } from 'lucide-react';
import type { Invitado } from '@/types/guest';
import { checkInGuest } from '@/lib/guests';

interface GuestSearchProps {
  guests: Invitado[];
  onSelect: (guest: Invitado) => void;
  onGuestUpdated?: (guest: Invitado) => void;
}

export default function GuestSearch({ guests, onSelect, onGuestUpdated }: GuestSearchProps) {
  const [query, setQuery] = useState('');
  const [touched, setTouched] = useState(false);
  const [checkingIn, setCheckingIn] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const safeGuests = Array.isArray(guests) ? guests : [];

  const q = query.trim().toLowerCase();

  const tableMatch = q.length > 0 ? safeGuests.find((g) => g?.mesa?.toLowerCase() === q) ?? null : null;
  const isTableSearch = tableMatch !== null;

  const results = useMemo(() => {
    if (!query || typeof query !== 'string' || !query.trim()) return [];
    const qs = query.toLowerCase().trim();
    return (safeGuests || []).filter((p) => {
      if (!p) return false;
      const name = p.nombre_completo ? String(p.nombre_completo).toLowerCase() : '';
      const mesa = p.mesa ? String(p.mesa).toLowerCase() : '';
      const categoria = p.categoria ? String(p.categoria).toLowerCase() : '';
      const id = p.id != null ? String(p.id) : '';
      return name.includes(qs) || mesa.includes(qs) || categoria.includes(qs) || id === qs;
    });
  }, [query, safeGuests]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setQuery('');
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function handleCheckIn(guest: Invitado): Promise<void> {
    setCheckingIn(guest.id);
    setError(null);
    try {
      const updated = await checkInGuest(guest.id);
      if (updated) onGuestUpdated?.(updated);
    } catch {
      setError('No se pudo registrar el ingreso. Reintentá.');
    } finally {
      setCheckingIn(null);
    }
  }

  return (
    <div className="relative z-40 w-full">
      {/* Search bar */}
      <div className="relative flex items-center gap-3 px-5 py-3.5 rounded-full bg-ink-700/80 border border-gold-400/30 transition-all focus-within:border-gold-400/60 focus-within:shadow-gold">
        <Search className="w-5 h-5 shrink-0 text-gold-400" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setTouched(true); }}
          placeholder="Buscar por nombre o mesa…"
          className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 font-light text-sm tracking-wide"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setTouched(false); }}
            className="text-white/40 hover:text-white/70 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto scrollbar-thin rounded-2xl bg-ink-800/95 backdrop-blur-md border border-gold-500/30 shadow-2xl shadow-black/50 overflow-hidden">
          {isTableSearch && tableMatch && (
            <div className="px-4 py-2.5 bg-gold-400/10 border-b border-gold-400/30 flex items-center gap-2">
              <Armchair className="w-4 h-4 text-gold-400" />
              <span className="text-gold-300 text-xs font-medium tracking-wide">
                Mesa {tableMatch.mesa} — {results.length} {results.length === 1 ? 'invitado' : 'invitados'}
              </span>
            </div>
          )}
          {(results || []).map((g) => {
            if (!g) return null;
            const isIn = g.estado_ingreso === 'Ingresado';
            return (
              <div key={g.id} className="flex items-center gap-3 border-b border-white/10 px-4 py-3.5 last:border-0 hover:bg-gold-400/5 transition-colors">
                <button onClick={() => onSelect(g)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <UserCircle2 className={`h-9 w-9 shrink-0 ${isIn ? 'text-red-400' : 'text-emerald2-400'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-white">{g?.nombre_completo ?? 'Invitado'}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-light text-white/65">
                      {g?.mesa && <span className="text-gold-300">{g.mesa}</span>}
                      <span>·</span>
                      <span>{g?.pases_totales ?? 0} {(g?.pases_totales ?? 0) === 1 ? 'persona' : 'personas'}</span>
                      {g?.menu_elegido && <><span>·</span><span className="flex items-center gap-1"><Utensils className="h-3 w-3" />{g.menu_elegido}</span></>}
                    </span>
                  </span>
                </button>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {isIn ? (
                    <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-wider text-red-300">
                      <CheckCircle2 className="h-3 w-3" /> Ya ingresó
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(g)}
                      disabled={checkingIn === g.id}
                      className="flex items-center gap-1.5 rounded-full bg-emerald2-500 px-3 py-1.5 text-xs font-semibold text-ink-900 transition-all hover:bg-emerald2-400 disabled:cursor-wait disabled:opacity-60"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      {checkingIn === g.id ? 'Ingresando…' : 'Ingresar'}
                    </button>
                  )}
                  <span className={`flex items-center gap-1 text-[10px] ${isIn ? 'text-red-300/80' : 'text-emerald2-300/80'}`}>
                    <Clock className="h-3 w-3" />
                    {isIn && g?.hora_ingreso ? new Date(g.hora_ingreso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : isIn ? 'Ya ingresó' : 'Disponible'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-center text-xs text-red-200">{error}</p>}

      {/* No results */}
      {results.length === 0 && touched && q.length > 0 && (
        <p className="mt-3 text-center text-white/50 text-sm font-light">No se encontró ese invitado.</p>
      )}
    </div>
  );
}
