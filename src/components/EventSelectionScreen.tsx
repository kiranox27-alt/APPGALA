import { useState } from 'react';
import { Heart, Cake, GraduationCap, PartyPopper, Sparkle, ArrowRight, ArrowLeft, Calendar, MapPin, Clock, User, CheckCircle2, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import type { EventType, Evento } from '@/types/guest';
import type { EventoInput } from '@/lib/evento';

interface EventSelectionScreenProps {
  eventos: Evento[];
  currentEvento: Evento | null;
  onSelect: (input: EventoInput) => Promise<void>;
  onUpdate: (id: number, input: EventoInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onSwitch: (evento: Evento) => void;
  onBack: () => void;
}

const EVENTOS: { tipo: EventType; icon: typeof Heart; desc: string }[] = [
  { tipo: 'Casamiento', icon: Heart, desc: 'Bodas y casamientos' },
  { tipo: 'Cumpleaños de 15', icon: Cake, desc: 'Fiesta de quinceañera' },
  { tipo: 'Fiesta de Egresados', icon: GraduationCap, desc: 'Egresados y graduación' },
  { tipo: 'Fiesta Privada', icon: PartyPopper, desc: 'Evento corporativo o social' },
];

const EVENT_ICONS: Record<EventType, typeof Heart> = {
  'Casamiento': Heart,
  'Cumpleaños de 15': Cake,
  'Fiesta de Egresados': GraduationCap,
  'Fiesta Privada': PartyPopper,
};

type Mode = 'list' | 'create' | 'edit';

export default function EventSelectionScreen({ eventos, currentEvento, onSelect, onUpdate, onDelete, onSwitch, onBack }: EventSelectionScreenProps) {
  const [mode, setMode] = useState<Mode>('list');
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Evento | null>(null);

  function handleBack() {
    if (mode === 'create' || mode === 'edit') {
      setMode('list');
      setEditingEvento(null);
    } else {
      onBack();
    }
  }

  if (confirmDelete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-ink-900">
        <div className="w-full max-w-sm bg-ink-800 rounded-3xl border border-white/10 p-6 text-center animate-scale-in">
          <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-400" />
          </div>
          <h3 className="text-lg font-serif font-light text-white mb-2">¿Eliminar evento?</h3>
          <p className="text-white/50 text-sm font-light mb-6">
            Vas a eliminar <span className="text-white/80">{confirmDelete.nombre || confirmDelete.tipo}</span> y todos sus invitados. Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 transition-colors text-sm">Cancelar</button>
            <button onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-full bg-red-500/90 text-white font-medium text-sm hover:bg-red-500 transition-colors">Eliminar</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <EventForm
        editing={editingEvento}
        onConfirm={async (input) => {
          if (mode === 'edit' && editingEvento) {
            await onUpdate(editingEvento.id, input);
          } else {
            await onSelect(input);
          }
        }}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        {currentEvento ? (
          <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-light">Volver</span>
          </button>
        ) : (
          <span />
        )}
      </div>

      <header className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Sparkle className="w-4 h-4 text-gold-400" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-gold-400/80 font-light">Recepción de Eventos</span>
          <Sparkle className="w-4 h-4 text-gold-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-light gold-gradient-text tracking-wide text-center">
          Tus eventos
        </h1>
        <p className="text-white/40 text-xs tracking-[0.2em] uppercase mt-2 font-light">
          Elegí un evento o creá uno nuevo
        </p>
      </header>

      {eventos.length > 0 && (
        <div className="w-full space-y-2.5 mb-6">
          {eventos.map((e, i) => {
            const Icon = EVENT_ICONS[e.tipo];
            const isActive = currentEvento?.id === e.id;
            return (
              <div
                key={e.id}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all animate-fade-in-up ${
                  isActive ? 'bg-gold-400/10 border-gold-400/50' : 'bg-ink-800 border-white/10 hover:border-white/20'
                }`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <button
                  onClick={() => onSwitch(e)}
                  className="flex items-center gap-4 flex-1 text-left"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-gold-400/20' : 'bg-white/5'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-white/50'}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-base font-serif font-light ${isActive ? 'text-gold-300' : 'text-white/80'}`}>
                      {e.nombre || e.tipo}
                    </p>
                    <p className="text-xs text-white/40 font-light">
                      {e.tipo}{e.fecha ? ` · ${formatDate(e.fecha)}` : ''}{e.lugar ? ` · ${e.lugar}` : ''}
                    </p>
                  </div>
                  {isActive && <span className="text-[10px] tracking-wider uppercase text-gold-400 px-2 py-0.5 rounded-full bg-gold-400/10 border border-gold-400/30">Activo</span>}
                </button>
                <button
                  onClick={() => { setEditingEvento(e); setMode('edit'); }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Editar evento"
                >
                  <Pencil className="w-4 h-4 text-white/40" />
                </button>
                <button
                  onClick={() => setConfirmDelete(e)}
                  className="p-2 rounded-lg hover:bg-red-500/10 transition-colors shrink-0"
                  aria-label="Eliminar evento"
                >
                  <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => { setEditingEvento(null); setMode('create'); }}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gold-400/10 border border-gold-400/35 text-gold-300 text-sm font-medium tracking-wide hover:bg-gold-400/20 transition-all animate-fade-in-up"
      >
        <Plus className="w-5 h-5" /> Crear nuevo evento
      </button>
    </div>
  );
}

function EventForm({ editing, onConfirm, onBack }: { editing: Evento | null; onConfirm: (input: EventoInput) => Promise<void>; onBack: () => void }) {
  const [selected, setSelected] = useState<EventType | null>(editing?.tipo ?? null);
  const [nombre, setNombre] = useState(editing?.nombre ?? '');
  const [fecha, setFecha] = useState(editing?.fecha ?? '');
  const [lugar, setLugar] = useState(editing?.lugar ?? '');
  const [hora, setHora] = useState(editing?.hora ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConfirm() {
    if (!selected) return;
    setSaving(true);
    setErr(null);
    try {
      await onConfirm({ tipo: selected, nombre: nombre || undefined, fecha: fecha || undefined, lugar: lugar || undefined, hora: hora || undefined });
      setSaved(true);
      setTimeout(() => onBack(), 1300);
    } catch {
      setErr('No se pudo guardar. Reintentá en un momento.');
    } finally {
      setSaving(false);
    }
  }

  if (saved) {
    return (
      <div className="fixed inset-0 z-50 bg-ink-900 flex flex-col items-center justify-center animate-fade-in">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute w-28 h-28 rounded-full bg-emerald2-500/20 animate-pulse-ring" />
          <div className="relative w-24 h-24 rounded-full bg-emerald2-500 flex items-center justify-center animate-scale-in">
            <CheckCircle2 className="w-12 h-12 text-ink-900" strokeWidth={2.5} />
          </div>
        </div>
        <p className="text-white text-xl font-serif font-light text-center animate-fade-in-up">
          ¡Evento guardado correctamente!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 py-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-light">Volver</span>
        </button>
      </div>

      <header className="flex flex-col items-center mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Sparkle className="w-4 h-4 text-gold-400" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-gold-400/80 font-light">Recepción de Eventos</span>
          <Sparkle className="w-4 h-4 text-gold-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-light gold-gradient-text tracking-wide text-center">
          {editing ? 'Editar evento' : '¿Qué tipo de evento es?'}
        </h1>
        <p className="text-white/40 text-xs tracking-[0.2em] uppercase mt-2 font-light">
          Completá los datos del evento
        </p>
      </header>

      <div className="w-full space-y-3 mb-6">
        {EVENTOS.map((e, i) => {
          const isActive = selected === e.tipo;
          return (
            <button
              key={e.tipo}
              onClick={() => setSelected(e.tipo)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all animate-fade-in-up ${
                isActive ? 'bg-gold-400/10 border-gold-400/60 shadow-gold' : 'bg-ink-800 border-white/10 hover:border-white/20'
              }`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-gold-400/20' : 'bg-white/5'}`}>
                <e.icon className={`w-5 h-5 ${isActive ? 'text-gold-400' : 'text-white/50'}`} strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-base font-serif font-light ${isActive ? 'text-gold-300' : 'text-white/80'}`}>{e.tipo}</p>
                <p className="text-xs text-white/40 font-light">{e.desc}</p>
              </div>
              {isActive && <ArrowRight className="w-4 h-4 text-gold-400" />}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="w-full space-y-3 mb-6 animate-fade-in-up">
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nombre del evento (opcional)
            </label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Boda de Valentina y Mateo"
              className="w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 text-white placeholder:text-white/30 font-light text-sm outline-none focus:border-gold-400/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Fecha
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 text-white font-light text-sm outline-none focus:border-gold-400/60 transition-colors [color-scheme:dark]"
            />
          </div>
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Lugar
            </label>
            <input
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Ej: Salón Cristal, Av. Libertador 1234"
              className="w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 text-white placeholder:text-white/30 font-light text-sm outline-none focus:border-gold-400/60 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs tracking-wide uppercase text-white/40 mb-1.5 font-light flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-ink-700 border border-white/10 text-white font-light text-sm outline-none focus:border-gold-400/60 transition-colors [color-scheme:dark]"
            />
          </div>
        </div>
      )}

      {err && <p className="text-red-400 text-sm font-light mb-3">{err}</p>}

      <button
        onClick={handleConfirm}
        disabled={!selected || saving}
        className="px-8 py-3.5 rounded-full gold-gradient-bg text-ink-900 font-semibold text-sm tracking-wide hover:shadow-gold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Comenzar'}
      </button>
    </div>
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
