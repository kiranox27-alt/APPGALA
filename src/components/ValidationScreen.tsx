import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, RotateCcw, Users, UtensilsCrossed, Clock, UserX, Utensils, Baby } from 'lucide-react';
import type { Invitado } from '@/types/guest';
import { checkInGuest } from '@/lib/guests';

interface ValidationScreenProps {
  guest: Invitado;
  onRescan: () => void;
  onBackHome: () => void;
}

export default function ValidationScreen({ guest, onRescan, onBackHome }: ValidationScreenProps) {
  const [updated, setUpdated] = useState<Invitado | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyIn = guest.estado_ingreso === 'Ingresado';

  useEffect(() => {
    let mounted = true;
    if (alreadyIn) {
      setUpdated(guest);
      return;
    }
    setSaving(true);
    checkInGuest(guest.id)
      .then((g) => { if (mounted) setUpdated(g); })
      .catch(() => { if (mounted) setError('No se pudo registrar el ingreso. Reintentá.'); })
      .finally(() => { if (mounted) setSaving(false); });
    return () => { mounted = false; };
  }, [guest, alreadyIn]);

  const display = updated ?? guest;
  const hasRestriction = display.restriccion_alimentaria.length > 0 && !display.restriccion_alimentaria.includes('Normal');

  return (
    <div className="fixed inset-0 z-40 bg-ink-900 flex flex-col items-center justify-center px-6 animate-fade-in overflow-y-auto py-8">
      {/* Indicator */}
      <div className="relative flex items-center justify-center mb-8 shrink-0">
        <div className={`absolute w-32 h-32 rounded-full ${alreadyIn ? 'bg-red-500/20' : 'bg-emerald2-500/20'} animate-pulse-ring`} />
        <div className={`absolute w-28 h-28 rounded-full ${alreadyIn ? 'bg-red-500/30' : 'bg-emerald2-500/30'}`} />
        <div className={`relative w-28 h-28 rounded-full ${alreadyIn ? 'bg-red-500' : 'bg-emerald2-500'} flex items-center justify-center shadow-${alreadyIn ? 'red' : 'emerald'} animate-scale-in`}>
          {alreadyIn ? <AlertTriangle className="w-14 h-14 text-ink-900" /> : <CheckCircle2 className="w-14 h-14 text-ink-900" strokeWidth={2.5} />}
        </div>
      </div>

      {error ? (
        <div className="text-center max-w-sm animate-fade-in-up">
          <p className="text-red-400 font-light mb-6">{error}</p>
          <button onClick={onRescan} className="px-6 py-3 rounded-full border border-gold-400/50 text-gold-400 hover:bg-gold-400/10 transition-colors">Reintentar</button>
        </div>
      ) : (
        <>
          {/* Status */}
          <p className="text-white/50 text-xs tracking-[0.3em] uppercase mb-2 animate-fade-in-up">
            {alreadyIn ? 'YA INGRESÓ' : saving ? 'Registrando…' : 'Ingreso Validado'}
          </p>

          {/* Name */}
          <h2 className="text-3xl sm:text-4xl font-serif font-light text-white text-center mb-6 animate-fade-in-up text-balance">
            {display.nombre_completo}
          </h2>

          {/* Mesa */}
          <div className="text-center mb-6 animate-fade-in-up">
            <p className="text-white/40 text-xs tracking-[0.25em] uppercase mb-1">Mesa asignada</p>
            <p className="text-5xl sm:text-6xl font-serif font-semibold gold-gradient-text leading-none">{display.mesa}</p>
          </div>

          {/* People + menu + dietary */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6 animate-fade-in-up">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <Users className="w-4 h-4 text-gold-400" />
              <span className="text-sm font-light text-white/90">{display.adultos} adultos · {display.ninos} niños</span>
            </div>
            {display.menu_elegido && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <Utensils className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-light text-white/90">Menú: {display.menu_elegido}</span>
              </div>
            )}
            {hasRestriction && display.restriccion_alimentaria.filter((r) => r !== 'Normal').map((r) => (
              <div key={r} className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/40">
                <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-light text-amber-200">Menú {r.toLowerCase()}</span>
              </div>
            ))}
            {alreadyIn && display.hora_ingreso && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                <Clock className="w-4 h-4 text-red-400" />
                <span className="text-sm font-light text-red-200">
                  Primer ingreso: {new Date(display.hora_ingreso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>

          {/* Double entry warning */}
          {alreadyIn && (
            <div className="flex items-center gap-2 mb-8 text-red-400/90 animate-fade-in-up max-w-sm text-center">
              <UserX className="w-5 h-5 shrink-0" />
              <p className="text-sm font-light">
                Este pase ya fue utilizado. No se permite un segundo ingreso. Verificá que sea la persona correcta.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 animate-fade-in-up">
            <button onClick={onRescan} className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/30 transition-all text-sm tracking-wide">
              <RotateCcw className="w-4 h-4" /> Volver a Escanear
            </button>
            <button onClick={onBackHome} className="px-6 py-3 rounded-full text-white/50 hover:text-white/80 transition-colors text-sm tracking-wide">
              Ir a Recepción
            </button>
          </div>
        </>
      )}
    </div>
  );
}
