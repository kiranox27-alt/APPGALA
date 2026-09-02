import { useState } from 'react';
import { X, Users, Baby, Armchair, Utensils, UtensilsCrossed, CheckCircle2, Clock, StickyNote, LogIn, Undo2, PartyPopper } from 'lucide-react';
import type { Invitado } from '@/types/guest';
import { checkInGuest, revertCheckIn } from '@/lib/guests';

interface GuestDetailModalProps {
  guest: Invitado;
  onClose: () => void;
  onGuestUpdated?: (guest: Invitado) => void;
}

export default function GuestDetailModal({ guest, onClose, onGuestUpdated }: GuestDetailModalProps) {
  const [current, setCurrent] = useState<Invitado>(guest);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  const isIn = current.estado_ingreso === 'Ingresado';
  const restrictions = current.restriccion_alimentaria.filter((r) => r !== 'Normal');

  async function handleCheckIn() {
    setSaving(true);
    setError(null);
    try {
      const updated = await checkInGuest(current.id);
      if (updated) {
        setCurrent(updated);
        onGuestUpdated?.(updated);
        setJustCheckedIn(true);
        setTimeout(() => setJustCheckedIn(false), 3000);
      }
    } catch {
      setError('No se pudo registrar el ingreso. Reintentá.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRevert() {
    setSaving(true);
    setError(null);
    try {
      const updated = await revertCheckIn(current.id);
      if (updated) {
        setCurrent(updated);
        onGuestUpdated?.(updated);
      }
    } catch {
      setError('No se pudo deshacer el ingreso. Reintentá.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 py-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-ink-800 border border-white/10 rounded-3xl overflow-hidden animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Success overlay */}
        {justCheckedIn && (
          <div className="absolute inset-0 z-20 bg-ink-800 flex flex-col items-center justify-center animate-fade-in">
            <div className="relative flex items-center justify-center mb-5">
              <div className="absolute w-24 h-24 rounded-full bg-emerald2-500/30 animate-pulse-ring" />
              <div className="relative w-20 h-20 rounded-full bg-emerald2-500 flex items-center justify-center animate-scale-in">
                <PartyPopper className="w-10 h-10 text-ink-900" strokeWidth={2} />
              </div>
            </div>
            <p className="text-emerald2-400 text-xl font-serif font-light tracking-wide text-center">
              ¡INGRESO CONFIRMADO!
            </p>
            <p className="text-white/50 text-sm font-light mt-2">
              {current.nombre_completo}
            </p>
            <p className="text-white/30 text-xs font-light mt-1">
              {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            {isIn ? (
              <span className="flex items-center gap-1.5 text-xs tracking-wider uppercase text-emerald2-400 px-2.5 py-1 rounded-full bg-emerald2-500/10 border border-emerald2-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" /> Presente
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs tracking-wider uppercase text-amber-400 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
                <Clock className="w-3.5 h-3.5" /> Pendiente
              </span>
            )}
            <span className="text-white/30 text-xs font-light">#{guest.id}</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Name */}
          <div className="text-center">
            <p className="text-white/40 text-[10px] tracking-[0.25em] uppercase mb-1 font-light">Invitado/a</p>
            <h2 className="text-2xl font-serif font-light text-white">{current.nombre_completo}</h2>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCard icon={<Users className="w-4 h-4" />} label="Adultos" value={String(current.adultos)} />
            <InfoCard icon={<Baby className="w-4 h-4" />} label="Niños" value={String(current.ninos)} />
            <InfoCard icon={<Armchair className="w-4 h-4" />} label="Mesa" value={current.mesa} />
            <InfoCard icon={<span className="text-sm">🏷️</span>} label="Grupo" value={current.categoria} />
            <InfoCard icon={<Utensils className="w-4 h-4" />} label="Menú" value={current.menu_elegido || 'A confirmar'} />
            <InfoCard
              icon={<UtensilsCrossed className="w-4 h-4" />}
              label="Alimentación"
              value={restrictions.length ? restrictions.join(', ') : 'Normal'}
              highlight={restrictions.length > 0}
            />
          </div>

          {/* Total people */}
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <Users className="w-4 h-4 text-gold-400" />
            <span className="text-sm font-light text-white/90">
              {current.pases_totales} {current.pases_totales === 1 ? 'persona' : 'personas'} en total
            </span>
          </div>

          {/* Confirmation status */}
          <div className="flex items-center justify-center gap-2">
            {current.asistencia_confirmada ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald2-500/10 border border-emerald2-500/30 text-emerald2-400 text-xs font-light">
                <CheckCircle2 className="w-3.5 h-3.5" /> Asistencia confirmada
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-light">
                <Clock className="w-3.5 h-3.5" /> Sin confirmar
              </span>
            )}
          </div>

          {/* Check-in time */}
          {isIn && current.hora_ingreso && (
            <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald2-500/10 border border-emerald2-500/20">
              <Clock className="w-4 h-4 text-emerald2-400" />
              <span className="text-emerald2-300 text-sm font-light">
                Ingresó a las {new Date(current.hora_ingreso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}

          {/* Notes */}
          {current.notas && (
            <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="flex items-center gap-1.5 text-amber-400/70 text-[10px] uppercase tracking-wide mb-1">
                <StickyNote className="w-3 h-3" /> Notas
              </p>
              <p className="text-amber-100/80 text-sm font-light">{current.notas}</p>
            </div>
          )}

          {error && (
            <p className="text-center text-red-400 text-sm font-light animate-fade-in">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 space-y-2">
          {isIn ? (
            <button
              onClick={handleRevert}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 transition-colors text-sm tracking-wide disabled:opacity-50"
            >
              <Undo2 className="w-4 h-4" /> {saving ? 'Deshaciendo…' : 'Deshacer ingreso'}
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-emerald2-500 text-ink-900 font-bold text-base tracking-wide hover:brightness-110 transition-all disabled:opacity-50 shadow-lg shadow-emerald2-500/30"
            >
              <LogIn className="w-5 h-5" /> {saving ? 'Registrando…' : 'CONFIRMAR INGRESO'}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-white/50 hover:text-white/80 transition-colors text-sm tracking-wide"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, highlight = false }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-2.5 ${highlight ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10'}`}>
      <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide ${highlight ? 'text-amber-400/70' : 'text-white/40'}`}>
        {icon}<span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-light text-white truncate" title={value}>{value}</p>
    </div>
  );
}
