import { useEffect, useState } from 'react';
import { QrCode, Users, TrendingUp, Sparkle, Heart, Cake, PartyPopper, GraduationCap, Pencil, Radio, FileDown, Trash2, Palette } from 'lucide-react';
import type { Invitado, Evento, EventType } from '@/types/guest';
import GuestSearch from './GuestSearch';

interface ReceptionHomeProps {
  guests: Invitado[];
  evento: Evento;
  onScan: () => void;
  onSelectGuest: (guest: Invitado) => void;
  onGuestUpdated: (guest: Invitado) => void;
  onNavigate: (view: 'guests' | 'dashboard' | 'live') => void;
  onChangeEvent: () => void;
  onExport: () => void;
  onDeleteEvent: () => void;
  onDesignInvitation: () => void;
}

const EVENT_ICONS: Record<EventType, typeof Heart> = {
  'Casamiento': Heart,
  'Cumpleaños de 15': Cake,
  'Fiesta de Egresados': GraduationCap,
  'Fiesta Privada': PartyPopper,
};

export default function ReceptionHome({ guests, evento, onScan, onSelectGuest, onGuestUpdated, onNavigate, onChangeEvent, onExport, onDeleteEvent, onDesignInvitation }: ReceptionHomeProps) {
  const [stats, setStats] = useState({ total: 0, in: 0, pending: 0, passes: 0, inPasses: 0 });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const total = guests.length;
    const inG = guests.filter((g) => g.estado_ingreso === 'Ingresado');
    const passes = guests.reduce((s, g) => s + g.pases_totales, 0);
    setStats({
      total,
      in: inG.length,
      pending: guests.filter((g) => g.estado_ingreso === 'Pendiente').length,
      passes,
      inPasses: inG.reduce((s, g) => s + g.pases_totales, 0),
    });
  }, [guests]);

  const pct = stats.passes > 0 ? Math.round((stats.inPasses / stats.passes) * 100) : 0;
  const EventIcon = EVENT_ICONS[evento.tipo];

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-8 max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Sparkle className="w-4 h-4 text-gold-400" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-gold-400/80 font-light">Recepción de Eventos</span>
          <Sparkle className="w-4 h-4 text-gold-400" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-serif font-light gold-gradient-text tracking-wide text-center">
          {evento.nombre || evento.tipo}
        </h1>
        <button
          onClick={onChangeEvent}
          className="mt-3 flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink-700/80 border border-white/10 hover:border-gold-400/40 transition-all group"
        >
          <EventIcon className="w-3.5 h-3.5 text-gold-400" strokeWidth={1.5} />
          <span className="text-xs text-white/60 font-light tracking-wide">{evento.tipo}</span>
          <Pencil className="w-3 h-3 text-white/30 group-hover:text-gold-400/60 transition-colors" />
        </button>
      </header>

      {/* Progress ring */}
      <div className="flex items-center justify-center gap-6 mb-10 animate-fade-in-up">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#2a2a2a" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="#d4af37" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 264} 264`} className="transition-all duration-700" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-serif font-light text-gold-400">{pct}%</span>
            <span className="text-[9px] tracking-wider uppercase text-white/40">Ingresaron</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-serif font-light text-white">{stats.in}</span>
            <span className="text-xs text-white/40 font-light">de {stats.total} invitados</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-serif font-light text-gold-400">{stats.inPasses}</span>
            <span className="text-xs text-white/40 font-light">de {stats.passes} pases</span>
          </div>
        </div>
      </div>

      {/* Scan button */}
      <div className="flex flex-col items-center mb-8 animate-fade-in-up">
        <button onClick={onScan} className="group relative w-44 h-44 rounded-full gold-gradient-bg shadow-gold-lg flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95">
          <div className="absolute inset-2 rounded-full border border-white/20" />
          <QrCode className="w-14 h-14 text-ink-900 mb-2 transition-transform group-hover:scale-110" strokeWidth={1.5} />
          <span className="text-ink-900 text-[11px] font-semibold tracking-[0.15em] uppercase">Escanear Pases</span>
        </button>
        <p className="text-white/40 text-xs font-light mt-4 tracking-wide">Activá la cámara para escanear el QR del pase</p>
      </div>

      {/* Manual search */}
      <div className="mb-6 animate-fade-in-up">
        <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase mb-2 text-center font-light">Búsqueda manual de contingencia</p>
        <GuestSearch guests={guests} onSelect={onSelectGuest} onGuestUpdated={onGuestUpdated} />
      </div>

      {/* Export */}
      <button onClick={onExport} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold-400/10 border border-gold-400/35 text-gold-300 text-sm font-medium tracking-wide hover:bg-gold-400/20 transition-all mb-3 animate-fade-in-up">
        <FileDown className="w-5 h-5" /> Exportar lista completa a Excel
      </button>

      {/* Main menu */}
      <div className="mt-auto grid grid-cols-2 gap-3 animate-fade-in-up">
        <button onClick={() => onNavigate('guests')} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-ink-800/60 border border-white/10 hover:border-gold-400/40 hover:bg-ink-700 transition-all">
          <Users className="w-6 h-6 text-gold-400" strokeWidth={1.5} />
          <span className="text-xs text-white/70 font-light tracking-wide">Invitados</span>
        </button>
        <button onClick={() => onNavigate('live')} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-ink-800/60 border border-emerald2-500/20 hover:border-emerald2-500/50 hover:bg-ink-700 transition-all">
          <Radio className="w-6 h-6 text-emerald2-500" strokeWidth={1.5} />
          <span className="text-xs text-white/70 font-light tracking-wide">Panel en Vivo</span>
        </button>
        <button onClick={() => onNavigate('dashboard')} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-ink-800/60 border border-white/10 hover:border-gold-400/40 hover:bg-ink-700 transition-all">
          <TrendingUp className="w-6 h-6 text-gold-400" strokeWidth={1.5} />
          <span className="text-xs text-white/70 font-light tracking-wide">Resumen</span>
        </button>
        <button onClick={onDesignInvitation} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-ink-800/60 border border-gold-400/20 hover:border-gold-400/50 hover:bg-ink-700 transition-all">
          <Palette className="w-6 h-6 text-gold-400" strokeWidth={1.5} />
          <span className="text-xs text-white/70 font-light tracking-wide">Diseñar Invitación</span>
        </button>
        <button onClick={() => setConfirmDelete(true)} className="flex flex-col items-center gap-2 py-4 rounded-2xl bg-ink-800/60 border border-red-500/20 hover:border-red-500/50 hover:bg-ink-700 transition-all">
          <Trash2 className="w-6 h-6 text-red-400" strokeWidth={1.5} />
          <span className="text-xs text-white/70 font-light tracking-wide">Eliminar Evento</span>
        </button>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center px-6 animate-fade-in" onClick={() => setConfirmDelete(false)}>
          <div className="bg-ink-800 rounded-3xl border border-white/10 p-6 max-w-sm w-full text-center animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-serif font-light text-white mb-2">¿Eliminar evento?</h3>
            <p className="text-white/50 text-sm font-light mb-6">
              Vas a eliminar el evento y todos los invitados cargados. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 transition-colors text-sm">Cancelar</button>
              <button onClick={() => { setConfirmDelete(false); onDeleteEvent(); }} className="flex-1 py-2.5 rounded-full bg-red-500/90 text-white font-medium text-sm hover:bg-red-500 transition-colors">Eliminar todo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
