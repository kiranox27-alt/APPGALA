import { useEffect, useState } from 'react';
import { ArrowLeft, Users, TrendingUp, Clock, CheckCircle2, UtensilsCrossed, Crown } from 'lucide-react';
import type { Invitado } from '@/types/guest';
import { CATEGORIAS_POR_EVENTO } from '@/types/guest';
import type { EventType } from '@/types/guest';

interface DashboardProps {
  guests: Invitado[];
  eventType: EventType;
  onBack: () => void;
}

export default function Dashboard({ guests, eventType, onBack }: DashboardProps) {
  const [recent, setRecent] = useState<Invitado[]>([]);

  useEffect(() => {
    setRecent(
      [...guests]
        .filter((g) => g.estado_ingreso === 'Ingresado' && g.hora_ingreso)
        .sort((a, b) => new Date(b.hora_ingreso!).getTime() - new Date(a.hora_ingreso!).getTime())
        .slice(0, 6),
    );
  }, [guests]);

  const total = guests.length;
  const inGuests = guests.filter((g) => g.estado_ingreso === 'Ingresado');
  const pending = guests.filter((g) => g.estado_ingreso === 'Pendiente');
  const passes = guests.reduce((s, g) => s + g.pases_totales, 0);
  const inPasses = inGuests.reduce((s, g) => s + g.pases_totales, 0);
  const pct = passes > 0 ? Math.round((inPasses / passes) * 100) : 0;
  const confirmadas = guests.filter((g) => g.asistencia_confirmada).length;

  const cats = CATEGORIAS_POR_EVENTO[eventType];
  const byCategory: Record<string, { total: number; in: number }> = {};
  cats.forEach((c) => {
    byCategory[c] = { total: 0, in: 0 };
  });
  guests.forEach((g) => {
    if (!byCategory[g.categoria]) byCategory[g.categoria] = { total: 0, in: 0 };
    byCategory[g.categoria].total += 1;
    if (g.estado_ingreso === 'Ingresado') byCategory[g.categoria].in += 1;
  });

  const dietary = guests.filter((g) => g.restriccion_alimentaria.some((r) => r !== 'Normal'));

  const stats = [
    { icon: Users, label: 'Invitados totales', value: total, sub: `${passes} pases`, color: 'text-white' },
    { icon: CheckCircle2, label: 'Reservados', value: inGuests.length, sub: `${inPasses} pases`, color: 'text-red-400' },
    { icon: Clock, label: 'Disponibles', value: pending.length, sub: 'Sin fichar', color: 'text-emerald2-500' },
    { icon: CheckCircle2, label: 'Confirmados', value: confirmadas, sub: 'RSVP sí', color: 'text-gold-400' },
  ];

  return (
    <div className="min-h-screen px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-light">Recepción</span>
        </button>
        <h1 className="text-xl font-serif font-light gold-gradient-text">Panel del Evento</h1>
        <div className="w-20" />
      </div>

      {/* Progress hero */}
      <div className="rounded-3xl bg-gradient-to-br from-ink-800 to-ink-700 border border-gold-400/20 p-6 mb-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase font-light">Progreso del ingreso</p>
            <p className="text-4xl font-serif font-light gold-gradient-text mt-1">{pct}%</p>
          </div>
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="#d4af37"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(pct / 100) * 264} 264`}
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-gold-400" />
            </div>
          </div>
        </div>
        <div className="h-2 rounded-full bg-ink-600 overflow-hidden">
          <div
            className="h-full gold-gradient-bg transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-white/50 text-xs font-light mt-2">
          {inPasses} de {passes} pases ingresaron · {confirmadas} confirmaron asistencia
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="rounded-2xl bg-ink-800 border border-white/10 p-4 animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} strokeWidth={1.5} />
            <p className="text-2xl font-serif font-light text-white">{s.value}</p>
            <p className="text-white/40 text-xs font-light">{s.label}</p>
            <p className="text-white/30 text-[11px] font-light mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* By category */}
      <div className="rounded-2xl bg-ink-800 border border-white/10 p-5 mb-5 animate-fade-in-up">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-light text-white/80 tracking-wide">Por categoría</h3>
        </div>
        <div className="space-y-3">
          {cats.map((cat) => {
            const { total: t, in: c } = byCategory[cat] ?? { total: 0, in: 0 };
            const p = t > 0 ? Math.round((c / t) * 100) : 0;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-light text-white/70">{cat}</span>
                  <span className="text-xs font-light text-white/40">
                    {c}/{t}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-ink-600 overflow-hidden">
                  <div
                    className="h-full bg-gold-400/70 transition-all duration-500"
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dietary alerts */}
      {dietary.length > 0 && (
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5 mb-5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <UtensilsCrossed className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-light text-amber-200/90 tracking-wide">Menús especiales</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {dietary.map((g) => (
              <div key={g.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <span className="text-xs font-light text-amber-100/80">{g.nombre_completo}</span>
                <span className="text-[10px] text-amber-300/60">
                  {g.restriccion_alimentaria.filter((r) => r !== 'Normal').join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent check-ins */}
      {recent.length > 0 && (
        <div className="rounded-2xl bg-ink-800 border border-white/10 p-5 animate-fade-in-up">
          <h3 className="text-sm font-light text-white/80 tracking-wide mb-3">Ingresos recientes</h3>
          <div className="space-y-2">
            {recent.map((g) => (
              <div key={g.id} className="flex items-center gap-3 py-1.5">
                <div className="w-7 h-7 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-white/80 truncate">{g.nombre_completo}</p>
                  <p className="text-xs text-white/40 font-light">{g.mesa}</p>
                </div>
                <span className="text-xs text-white/40 font-light">
                  {new Date(g.hora_ingreso!).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
