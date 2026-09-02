import { useEffect, useState } from 'react';
import { ArrowLeft, Radio, Users, UtensilsCrossed, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Invitado } from '@/types/guest';

interface LivePanelProps {
  eventoId: number;
  onBack: () => void;
}

export default function LivePanel({ eventoId, onBack }: LivePanelProps) {
  const [checkedIn, setCheckedIn] = useState<Invitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState<number | null>(null);

  async function load() {
    try {
      const { data, error } = await supabase
        .from('invitados')
        .select('*')
        .eq('estado_ingreso', 'Ingresado')
        .eq('evento_id', eventoId)
        .order('hora_ingreso', { ascending: false });
      if (error) throw error;
      setCheckedIn((data ?? []) as Invitado[]);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const refreshTimer = window.setInterval(load, 3000);
    const channel = supabase
      .channel('live-checkins')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invitados', filter: `evento_id=eq.${eventoId}` },
        (payload) => {
          const updated = payload.new as Invitado;
          if (updated.estado_ingreso === 'Ingresado' && updated.hora_ingreso) {
            setCheckedIn((prev) => {
              const filtered = prev.filter((g) => g.id !== updated.id);
              return [updated, ...filtered];
            });
            setPulse(updated.id);
            setTimeout(() => setPulse(null), 2000);
          } else if (updated.estado_ingreso === 'Pendiente') {
            setCheckedIn((prev) => prev.filter((g) => g.id !== updated.id));
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invitados', filter: `evento_id=eq.${eventoId}` },
        (payload) => {
          const inserted = payload.new as Invitado;
          if (inserted.estado_ingreso === 'Ingresado') {
            setCheckedIn((prev) => [inserted, ...prev.filter((g) => g.id !== inserted.id)]);
            setPulse(inserted.id);
            setTimeout(() => setPulse(null), 2000);
          }
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  function formatTime(ts: string | null): string {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(ts: string | null): string {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-light">Recepción</span>
        </button>
        <h1 className="text-xl font-serif font-light gold-gradient-text flex items-center gap-2">
          <Radio className="w-5 h-5 text-emerald2-500 animate-pulse" />
          Panel en Vivo
        </h1>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald2-500 animate-pulse" />
          <span className="text-[10px] tracking-wider uppercase text-emerald2-500/80 font-light">En vivo</span>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <Users className="w-4 h-4 text-gold-400" />
        <span className="text-white/60 text-sm font-light">
          {checkedIn.length} {checkedIn.length === 1 ? 'invitado ingresó' : 'invitados ingresaron'}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-ink-800 border border-white/5 shimmer-bg animate-shimmer" />
          ))}
        </div>
      ) : checkedIn.length === 0 ? (
        <div className="text-center py-20">
          <Radio className="w-14 h-14 text-white/15 mx-auto mb-3" />
          <p className="text-white/40 font-light text-sm">
            Todavía no ingresó nadie. Cuando escanes un pase, aparecerá acá al instante.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkedIn.map((g, idx) => {
            const isPulsing = pulse === g.id;
            const hasRest = g.restriccion_alimentaria.some((r) => r !== 'Normal');
            const restrictions = g.restriccion_alimentaria.filter((r) => r !== 'Normal');
            return (
              <div
                key={g.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isPulsing
                    ? 'bg-emerald2-500/15 border-emerald2-500/50 shadow-emerald animate-scale-in'
                    : idx === 0
                    ? 'bg-emerald2-500/5 border-emerald2-500/25'
                    : 'bg-ink-800 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {idx === 0 && <span className="text-[9px] tracking-wider uppercase text-emerald2-500 font-medium px-2 py-0.5 rounded-full bg-emerald2-500/10 border border-emerald2-500/30">Reciente</span>}
                      <span className="text-white/30 text-xs font-light">#{g.id}</span>
                    </div>
                    <p className="text-white text-lg font-light truncate">{g.nombre_completo}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald2-500 text-sm font-medium">{formatTime(g.hora_ingreso)}</p>
                    <p className="text-white/30 text-[11px] font-light">{formatDate(g.hora_ingreso)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-light text-white/70">
                    <span className="text-gold-400/80">🏷️</span> {g.categoria}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-light text-white/70">
                    <span className="text-gold-400/80">🪑</span> {g.mesa}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-light text-white/70">
                    <Users className="w-3 h-3 text-gold-400/80" /> {g.adultos}A · {g.ninos}N
                  </span>
                  {g.menu_elegido && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-light text-white/70">
                      🍽️ {g.menu_elegido}
                    </span>
                  )}
                  {hasRest && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-xs font-light text-orange-300">
                      <UtensilsCrossed className="w-3 h-3" /> {restrictions.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
