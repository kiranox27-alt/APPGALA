import { useMemo, useState } from 'react';
import { X, Plus, Check, Armchair, AlertCircle, Utensils, StickyNote, Baby, User } from 'lucide-react';
import type { Invitado, InvitadoInsert, Restriccion, EventType, MenuElegido } from '@/types/guest';
import { CATEGORIAS_POR_EVENTO, RESTRICCIONES, MAX_PERSONAS_POR_MESA, MENU_OPCIONES } from '@/types/guest';
import { buildQrImageUrl } from '@/lib/qr';

interface GuestFormModalProps {
  guest: Invitado | null;
  eventType: EventType;
  allGuests: Invitado[];
  onSave: (payload: InvitadoInsert) => Promise<void>;
  onClose: () => void;
}

export default function GuestFormModal({ guest, eventType, allGuests, onSave, onClose }: GuestFormModalProps) {
  const categorias = CATEGORIAS_POR_EVENTO[eventType];
  const [nombre, setNombre] = useState(guest?.nombre_completo ?? '');
  const [mesa, setMesa] = useState(guest?.mesa ?? '');
  const [categoria, setCategoria] = useState<string>(
    guest?.categoria && categorias.includes(guest.categoria) ? guest.categoria : categorias[0],
  );
  const [adultos, setAdultos] = useState(guest?.adultos ?? 1);
  const [ninos, setNinos] = useState(guest?.ninos ?? 0);
  const [menu, setMenu] = useState<string>(guest?.menu_elegido ?? MENU_OPCIONES[0]);
  const [notas, setNotas] = useState(guest?.notas ?? '');
  const [restricciones, setRestricciones] = useState<Restriccion[]>(
    guest?.restriccion_alimentaria ?? ['Normal'],
  );
  const [confirmada, setConfirmada] = useState(guest?.asistencia_confirmada ?? false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const totalPersonas = Math.max(1, adultos + ninos);

  const allTables = useMemo(() => {
    const usedTables = new Set(allGuests.map((g) => g.mesa).filter(Boolean));
    const preset = Array.from({ length: 30 }, (_, i) => `Mesa ${i + 1}`);
    const custom = [...usedTables].filter((t) => !preset.includes(t));
    return [...preset, ...custom.sort()];
  }, [allGuests]);

  const tableOccupancy = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of allGuests) {
      if (guest && g.id === guest.id) continue;
      if (!g.mesa) continue;
      map.set(g.mesa, (map.get(g.mesa) ?? 0) + g.pases_totales);
    }
    return map;
  }, [allGuests, guest]);

  function getOccupancy(table: string): number {
    return tableOccupancy.get(table) ?? 0;
  }
  function getRemaining(table: string): number {
    return MAX_PERSONAS_POR_MESA - getOccupancy(table);
  }
  const wouldExceed = mesa ? getOccupancy(mesa) + totalPersonas > MAX_PERSONAS_POR_MESA : false;

  function toggleRestriccion(r: Restriccion) {
    setRestricciones((prev) => {
      if (r === 'Normal') return ['Normal'];
      const clean = prev.filter((x) => x !== 'Normal');
      return clean.includes(r) ? clean.filter((x) => x !== r) : [...clean, r];
    });
  }

  async function submit() {
    setErr(null);
    if (!nombre.trim() || !mesa.trim()) {
      setErr('Nombre y mesa son obligatorios.');
      return;
    }
    if (wouldExceed) {
      setErr(`La mesa ${mesa} está completa. Máximo ${MAX_PERSONAS_POR_MESA} personas (ya hay ${getOccupancy(mesa)}, querés sumar ${totalPersonas}).`);
      return;
    }
    setSaving(true);
    const payload: InvitadoInsert = {
      nombre_completo: nombre.trim(),
      mesa: mesa.trim(),
      categoria,
      pases_totales: totalPersonas,
      adultos: Math.max(0, Math.round(adultos)),
      ninos: Math.max(0, Math.round(ninos)),
      menu_elegido: menu,
      notas: notas.trim() || null,
      restriccion_alimentaria: restricciones.length === 0 ? ['Normal'] : restricciones,
      asistencia_confirmada: confirmada,
    };
    try {
      await onSave(payload);
      onClose();
    } catch {
      setErr('No se pudo guardar. Reintentá en un momento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
      <div className="w-full sm:max-w-lg bg-ink-800 border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto scrollbar-thin animate-fade-in-up">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-ink-800/95 backdrop-blur">
          <h2 className="text-xl font-serif font-light text-white">
            {guest ? 'Editar invitado' : 'Nuevo invitado'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 pb-28 sm:pb-5">
          {/* QR preview for existing */}
          {guest && (
            <div className="flex justify-center">
              <div className="rounded-2xl bg-white p-2">
                <img src={buildQrImageUrl(guest.id, 140)} alt={`QR de ${guest.nombre_completo}`} className="w-32 h-32" />
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light">Nombre completo</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre y apellido"
              className="w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 text-white placeholder:text-white/30 font-light text-sm outline-none focus:border-gold-400/60 transition-colors"
            />
          </div>

          {/* Mesa — smart selector with free names */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
              <Armchair className="w-3.5 h-3.5" /> Mesa o lugar asignado
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto scrollbar-thin p-1 -m-1">
              {allTables.map((t) => {
                const occ = getOccupancy(t);
                const remaining = MAX_PERSONAS_POR_MESA - occ;
                const full = remaining <= 0;
                const selectedT = mesa === t;
                return (
                  <button
                    key={t}
                    onClick={() => !full && setMesa(t)}
                    disabled={full}
                    className={`flex flex-col items-center gap-0.5 py-2.5 px-2 rounded-xl text-xs font-light tracking-wide transition-all border ${
                      selectedT
                        ? 'bg-gold-400/15 border-gold-400/60 text-gold-300'
                        : full
                        ? 'bg-red-500/5 border-red-500/20 text-red-400/40 cursor-not-allowed line-through'
                        : 'bg-ink-700 border-white/10 text-white/70 hover:border-gold-400/40'
                    }`}
                  >
                    <span className="font-medium">{t.replace('Mesa ', 'N° ')}</span>
                    <span className={`text-[10px] ${full ? 'text-red-400/60' : remaining <= 3 ? 'text-amber-400/70' : 'text-emerald2-500/70'}`}>
                      {occ} de {MAX_PERSONAS_POR_MESA}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Free table name input */}
            <input
              value={mesa.startsWith('Mesa ') ? '' : mesa}
              onChange={(e) => setMesa(e.target.value)}
              placeholder="O escribir nombre libre (Ej: Familia Ramírez)"
              className="w-full mt-2 px-4 py-2.5 rounded-xl bg-ink-700 border border-white/10 text-white placeholder:text-white/30 font-light text-sm outline-none focus:border-gold-400/60 transition-colors"
            />
            {mesa && !mesa.startsWith('Mesa ') && (() => {
              const occ = getOccupancy(mesa);
              const remaining = MAX_PERSONAS_POR_MESA - occ;
              const full = remaining <= 0;
              return (
                <p className={`mt-1.5 text-xs font-light ${full ? 'text-red-400' : 'text-emerald2-400'}`}>
                  {full ? '🔴 ' : '✅ '}{mesa}: {occ} de {MAX_PERSONAS_POR_MESA} personas
                </p>
              );
            })()}
            {mesa && wouldExceed && (
              <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-300 text-xs font-light">
                  La mesa {mesa} está completa. Máximo {MAX_PERSONAS_POR_MESA} personas (ya hay {getOccupancy(mesa)}, querés sumar {totalPersonas}).
                </p>
              </div>
            )}
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light">
              Categoría <span className="text-gold-400/50">· {eventType}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categorias.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoria(c)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-light tracking-wide transition-all border ${
                    categoria === c
                      ? 'bg-gold-400/15 border-gold-400/60 text-gold-300'
                      : 'bg-ink-700 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Adultos + Niños */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Adultos
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setAdultos((a) => Math.max(0, a - 1))} className="w-9 h-9 rounded-full bg-ink-700 border border-white/10 text-white/70 hover:border-gold-400/40">−</button>
                <span className="text-xl font-serif font-light text-gold-400 w-8 text-center">{adultos}</span>
                <button onClick={() => setAdultos((a) => a + 1)} className="w-9 h-9 rounded-full bg-ink-700 border border-white/10 text-white/70 hover:border-gold-400/40">+</button>
              </div>
            </div>
            <div>
              <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
                <Baby className="w-3.5 h-3.5" /> Niños
              </label>
              <div className="flex items-center gap-2">
                <button onClick={() => setNinos((n) => Math.max(0, n - 1))} className="w-9 h-9 rounded-full bg-ink-700 border border-white/10 text-white/70 hover:border-gold-400/40">−</button>
                <span className="text-xl font-serif font-light text-gold-400 w-8 text-center">{ninos}</span>
                <button onClick={() => setNinos((n) => n + 1)} className="w-9 h-9 rounded-full bg-ink-700 border border-white/10 text-white/70 hover:border-gold-400/40">+</button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 -mt-2">
            <span className="text-xs text-white/40 font-light">Total: {totalPersonas} {totalPersonas === 1 ? 'persona' : 'personas'}</span>
          </div>

          {/* Menú */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5" /> Menú elegido
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MENU_OPCIONES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMenu(m)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-light tracking-wide transition-all border ${
                    menu === m
                      ? 'bg-gold-400/15 border-gold-400/60 text-gold-300'
                      : 'bg-ink-700 border-white/10 text-white/60 hover:border-white/20'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Restricciones */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light">Alimentación</label>
            <div className="flex flex-wrap gap-2">
              {RESTRICCIONES.map((r) => {
                const active = restricciones.includes(r);
                const isNormal = r === 'Normal';
                return (
                  <button
                    key={r}
                    onClick={() => toggleRestriccion(r)}
                    className={`px-3.5 py-2 rounded-full text-xs font-light tracking-wide transition-all border ${
                      active
                        ? isNormal
                          ? 'bg-white/10 border-white/30 text-white'
                          : 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-ink-700 border-white/10 text-white/50 hover:border-white/20'
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
              <StickyNote className="w-3.5 h-3.5" /> Notas u observaciones
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Alergia a frutos secos, viene con cochecito, etc."
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 text-white placeholder:text-white/30 font-light text-sm outline-none focus:border-gold-400/60 transition-colors resize-none"
            />
          </div>

          {/* Confirmada */}
          <button
            onClick={() => setConfirmada((v) => !v)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 hover:border-white/20 transition-colors"
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${confirmada ? 'bg-emerald2-500 border-emerald2-500' : 'border-white/30'}`}>
              {confirmada && <Check className="w-3.5 h-3.5 text-ink-900" strokeWidth={3} />}
            </div>
            <span className="text-sm font-light text-white/80">Asistencia confirmada</span>
          </button>

          {err && <p className="text-red-400 text-xs font-light">{err}</p>}
        </div>

        {/* Sticky action bar — always visible on mobile */}
        <div className="sticky bottom-0 z-10 flex gap-3 px-5 py-4 bg-ink-800/95 backdrop-blur border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-white/15 text-white/70 hover:bg-white/5 transition-colors text-sm tracking-wide"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving || wouldExceed}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full gold-gradient-bg text-ink-900 font-semibold text-sm tracking-wide hover:shadow-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando…' : guest ? 'Guardar' : 'Agregar'}
            {!saving && <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
