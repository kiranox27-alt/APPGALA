import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Search, Pencil, Trash2, QrCode, CheckCircle2, Clock, Users, UtensilsCrossed, RotateCcw, Utensils, Baby } from 'lucide-react';
import type { Invitado, InvitadoInsert, EventType, Evento } from '@/types/guest';
import { fetchGuests, createGuest, updateGuest, deleteGuest, revertCheckIn } from '@/lib/guests';
import { buildQrImageUrl } from '@/lib/qr';
import GuestFormModal from './GuestFormModal';
import InvitationCard from './InvitationCard';

interface GuestManagementProps {
  eventType: EventType;
  evento: Evento;
  onBack: () => void;
}

type Filter = 'todos' | 'Pendiente' | 'Ingresado';

export default function GuestManagement({ eventType, evento, onBack }: GuestManagementProps) {
  const [guests, setGuests] = useState<Invitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [modalGuest, setModalGuest] = useState<Invitado | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [qrGuest, setQrGuest] = useState<Invitado | null>(null);
  const [invitationGuest, setInvitationGuest] = useState<Invitado | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Invitado | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setGuests(await fetchGuests(evento.id));
    } catch {
      setErr('No se pudo cargar la lista de invitados.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evento.id]);

  const q = query.trim().toLowerCase();
  const filtered = guests.filter((g) => {
    if (filter !== 'todos' && g.estado_ingreso !== filter) return false;
    if (q.length === 0) return true;
    return (
      g.nombre_completo.toLowerCase().includes(q) ||
      g.mesa.toLowerCase().includes(q) ||
      g.categoria.toLowerCase().includes(q) ||
      String(g.id) === q
    );
  });

  async function handleSave(payload: InvitadoInsert) {
    if (modalGuest) {
      await updateGuest(modalGuest.id, payload);
    } else {
      await createGuest({ ...payload, evento_id: evento.id });
    }
    await load();
  }

  async function handleDelete(id: number) {
    await deleteGuest(id);
    setConfirmDelete(null);
    await load();
  }

  async function handleRevert(id: number) {
    await revertCheckIn(id);
    await load();
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'Pendiente', label: 'Disponibles' },
    { key: 'Ingresado', label: 'Reservados' },
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
        <h1 className="text-xl font-serif font-light gold-gradient-text">Invitados</h1>
        <button
          onClick={() => {
            setModalGuest(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full gold-gradient-bg text-ink-900 text-xs font-semibold tracking-wide hover:shadow-gold transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo
        </button>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-ink-700/80 border border-white/10">
          <Search className="w-4 h-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar nombre, mesa, categoría…"
            className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 font-light text-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-light tracking-wide whitespace-nowrap transition-all border ${
                filter === f.key
                  ? 'bg-gold-400/15 border-gold-400/50 text-gold-300'
                  : 'bg-ink-700/50 border-white/10 text-white/50 hover:border-white/20'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-ink-800 border border-white/5 shimmer-bg animate-shimmer" />
          ))}
        </div>
      ) : err ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-white/60 font-light mb-4">{err}</p>
          <button onClick={load} className="px-5 py-2 rounded-full border border-gold-400/40 text-gold-400 text-sm hover:bg-gold-400/10 transition-colors">
            Reintentar
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 font-light">
            {guests.length === 0 ? 'Todavía no hay invitados cargados.' : 'No hay resultados para esta búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((g) => {
            const isIn = g.estado_ingreso === 'Ingresado';
            const hasRest = g.restriccion_alimentaria.some((r) => r !== 'Normal');
            return (
              <div
                key={g.id}
                className={`rounded-2xl border p-4 transition-all ${
                  isIn
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-emerald2-500/5 border-emerald2-500/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white/30 text-xs font-light">#{g.id}</span>
                      {isIn ? (
                        <span className="flex items-center gap-1 text-[10px] tracking-wider uppercase text-red-400/80 px-2 py-0.5 rounded-full border border-red-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Reservado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] tracking-wider uppercase text-emerald2-500/80 px-2 py-0.5 rounded-full border border-emerald2-500/30">
                          <Clock className="w-3 h-3" /> Disponible
                        </span>
                      )}
                    </div>
                    <p className="text-white font-light text-sm truncate">{g.nombre_completo}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="text-gold-400/80 text-xs font-light">{g.mesa}</span>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/50 text-xs font-light">{g.categoria}</span>
                      <span className="text-white/30 text-xs">·</span>
                      <span className="text-white/50 text-xs font-light">{g.pases_totales} pers.</span>
                      {g.menu_elegido && (
                        <>
                          <span className="text-white/30 text-xs">·</span>
                          <span className="flex items-center gap-0.5 text-white/50 text-xs font-light">
                            <Utensils className="w-3 h-3" />{g.menu_elegido}
                          </span>
                        </>
                      )}
                      {hasRest && (
                        <>
                          <span className="text-white/30 text-xs">·</span>
                          <span className="flex items-center gap-1 text-amber-300/80 text-xs font-light">
                            <UtensilsCrossed className="w-3 h-3" />
                            {g.restriccion_alimentaria.filter((r) => r !== 'Normal').join(', ')}
                          </span>
                        </>
                      )}
                    </div>
                    {isIn && g.hora_ingreso && (
                      <p className="text-red-400/60 text-[11px] font-light mt-1">
                        Ingresó {new Date(g.hora_ingreso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setInvitationGuest(g)}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gold-400/10 border border-gold-400/30 text-gold-300 text-[10px] font-medium tracking-wide hover:bg-gold-400/20 transition-colors"
                      aria-label="Ver invitación"
                    >
                      <span>🎫</span> Invitación
                    </button>
                    <button
                      onClick={() => setQrGuest(g)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="Ver QR"
                    >
                      <QrCode className="w-4 h-4 text-white/50" />
                    </button>
                    <button
                      onClick={() => {
                        setModalGuest(g);
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4 text-white/50" />
                    </button>
                    {isIn && (
                      <button
                        onClick={() => handleRevert(g.id)}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Revertir ingreso"
                      >
                        <RotateCcw className="w-4 h-4 text-white/50" />
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmDelete(g)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-white/40 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {modalOpen && (
        <GuestFormModal
          guest={modalGuest}
          eventType={eventType}
          allGuests={guests}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Invitation modal */}
      {invitationGuest && (
        <InvitationCard guest={invitationGuest} evento={evento} onClose={() => setInvitationGuest(null)} />
      )}

      {/* QR modal */}
      {qrGuest && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center px-6 animate-fade-in"
          onClick={() => setQrGuest(null)}
        >
          <div
            className="bg-ink-800 rounded-3xl border border-white/10 p-6 max-w-xs w-full text-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white/40 text-[10px] tracking-[0.3em] uppercase mb-1 font-light">Pase #{qrGuest.id}</p>
            <h3 className="text-lg font-serif font-light text-white mb-4">{qrGuest.nombre_completo}</h3>
            <div className="rounded-2xl bg-white p-3 inline-block">
              <img src={buildQrImageUrl(qrGuest.id, 220)} alt={`QR de ${qrGuest.nombre_completo}`} className="w-48 h-48" />
            </div>
            <p className="text-gold-400 text-sm font-light mt-4">{qrGuest.mesa}</p>
            <p className="text-white/40 text-xs font-light mt-1">{qrGuest.pases_totales} pases</p>
            <button
              onClick={() => setQrGuest(null)}
              className="mt-5 px-6 py-2.5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center px-6 animate-fade-in"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-ink-800 rounded-3xl border border-white/10 p-6 max-w-sm w-full text-center animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-serif font-light text-white mb-2">¿Eliminar invitado?</h3>
            <p className="text-white/50 text-sm font-light mb-6">
              Vas a eliminar a <span className="text-white/80">{confirmDelete.nombre_completo}</span>. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-full border border-white/15 text-white/70 hover:bg-white/5 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 rounded-full bg-red-500/90 text-white font-medium text-sm hover:bg-red-500 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
