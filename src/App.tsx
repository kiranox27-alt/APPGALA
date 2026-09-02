import { useCallback, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { Invitado, Evento } from '@/types/guest';
import { fetchGuests, fetchGuestById } from '@/lib/guests';
import { fetchEventos, createEvento, updateEvento, deleteEvento } from '@/lib/evento';
import EventSelectionScreen from '@/components/EventSelectionScreen';
import ReceptionHome from '@/components/ReceptionHome';
import QrScanner from '@/components/QrScanner';
import ValidationScreen from '@/components/ValidationScreen';
import GuestManagement from '@/components/GuestManagement';
import Dashboard from '@/components/Dashboard';
import LivePanel from '@/components/LivePanel';
import GuestDetailModal from '@/components/GuestDetailModal';
import { exportGuestsToExcel } from '@/lib/export';
import type { EventoInput } from '@/lib/evento';

type View = 'home' | 'guests' | 'dashboard' | 'live';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [guests, setGuests] = useState<Invitado[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [currentEvento, setCurrentEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [validatingGuest, setValidatingGuest] = useState<Invitado | null>(null);
  const [detailGuest, setDetailGuest] = useState<Invitado | null>(null);
  const [scanErr, setScanErr] = useState<string | null>(null);
  const [showEventList, setShowEventList] = useState(false);

  const loadEventos = useCallback(async () => {
    try {
      const list = await fetchEventos();
      setEventos(list);
      if (list.length > 0 && !currentEvento) {
        setCurrentEvento(list[0]);
      }
    } catch {
      // non-fatal
    }
  }, [currentEvento]);

  const loadGuests = useCallback(async (eventoId: number) => {
    try {
      setGuests(await fetchGuests(eventoId));
    } catch {
      setLoadErr('No se pudo cargar la lista de invitados.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const list = await fetchEventos();
        setEventos(list);
        if (list.length > 0) {
          setCurrentEvento(list[0]);
          await loadGuests(list[0].id);
        }
      } catch {
        setLoadErr('No se pudo conectar con el servidor.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSelectEvent(input: EventoInput) {
    const e = await createEvento(input);
    if (e) {
      setCurrentEvento(e);
      setEventos((prev) => [e, ...prev]);
      setShowEventList(false);
      setView('home');
      await loadGuests(e.id);
    }
  }

  async function handleUpdateEvent(id: number, input: EventoInput) {
    const e = await updateEvento(id, input);
    if (e) {
      setCurrentEvento(e);
      setEventos((prev) => prev.map((p) => (p.id === e.id ? e : p)));
      setShowEventList(false);
    }
  }

  async function handleDeleteEvent(id: number) {
    try {
      await deleteEvento(id);
    } catch {
      // non-fatal
    }
    const remaining = eventos.filter((e) => e.id !== id);
    setEventos(remaining);
    if (currentEvento?.id === id) {
      setCurrentEvento(remaining[0] ?? null);
      setGuests([]);
      setView('home');
    }
    setShowEventList(false);
  }

  function handleSwitchEvent(e: Evento) {
    setCurrentEvento(e);
    setShowEventList(false);
    setView('home');
    loadGuests(e.id);
  }

  async function handleScan(decoded: string) {
    setScanErr(null);
    const id = parseInt(decoded.trim(), 10);
    if (Number.isNaN(id)) {
      setScanErr('El código escaneado no es un pase válido.');
      setScanning(false);
      return;
    }
    try {
      const g = await fetchGuestById(id);
      if (!g) {
        setScanErr(`No se encontró ningún invitado con el pase #${id}.`);
        setScanning(false);
        return;
      }
      if (currentEvento && g.evento_id !== currentEvento.id) {
        setScanErr(`Ese pase pertenece a otro evento.`);
        setScanning(false);
        return;
      }
      setValidatingGuest(g);
      setScanning(false);
    } catch {
      setScanErr('No se pudo validar el pase. Reintentá.');
      setScanning(false);
    }
  }

  function handleSelectGuest(g: Invitado) {
    setDetailGuest(g);
  }

  function handleRescan() {
    setValidatingGuest(null);
    setScanErr(null);
    setScanning(true);
  }

  function handleBackHome() {
    setValidatingGuest(null);
    setScanErr(null);
    setView('home');
    if (currentEvento) loadGuests(currentEvento.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink-900">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-gold-400/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-400 animate-spin" />
        </div>
        <p className="text-gold-400/70 text-xs tracking-[0.3em] uppercase font-light">Recepción de Eventos</p>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <AlertCircle className="w-14 h-14 text-red-500 mb-4" />
        <p className="text-white/80 font-light mb-6">{loadErr}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full border border-gold-400/40 text-gold-400 hover:bg-gold-400/10 transition-colors text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (showEventList || !currentEvento) {
    return (
      <EventSelectionScreen
        eventos={eventos}
        currentEvento={currentEvento}
        onSelect={handleSelectEvent}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
        onSwitch={handleSwitchEvent}
        onBack={() => setShowEventList(false)}
      />
    );
  }

  if (validatingGuest) {
    return (
      <ValidationScreen
        guest={validatingGuest}
        onRescan={handleRescan}
        onBackHome={handleBackHome}
      />
    );
  }

  if (scanErr && view === 'home') {
    return (
      <div className="min-h-screen flex flex-col">
        <ReceptionHome
          guests={guests}
          evento={currentEvento}
          onScan={() => { setScanErr(null); setScanning(true); }}
          onSelectGuest={handleSelectGuest}
          onGuestUpdated={(updated) => {
            setGuests((prev) => prev.map((guest) => (guest.id === updated.id ? updated : guest)));
          }}
          onNavigate={(v) => setView(v)}
          onChangeEvent={() => setShowEventList(true)}
          onExport={() => exportGuestsToExcel(guests)}
          onDeleteEvent={() => handleDeleteEvent(currentEvento.id)}
        />
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] animate-fade-in-up">
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/40 backdrop-blur">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-200 text-sm font-light">{scanErr}</p>
            </div>
            <button onClick={() => setScanErr(null)} className="text-red-300/60 hover:text-red-200 text-sm shrink-0">✕</button>
          </div>
        </div>
      </div>
    );
  }

  if (scanning) {
    return <QrScanner onScan={handleScan} onClose={() => setScanning(false)} />;
  }

  if (view === 'guests') {
    return <GuestManagement eventType={currentEvento.tipo} evento={currentEvento} onBack={() => setView('home')} />;
  }

  if (view === 'dashboard') {
    return <Dashboard guests={guests} eventType={currentEvento.tipo} onBack={() => setView('home')} />;
  }

  if (view === 'live') {
    return <LivePanel eventoId={currentEvento.id} onBack={() => setView('home')} />;
  }

  return (
    <>
      <ReceptionHome
        guests={guests}
        evento={currentEvento}
        onScan={() => setScanning(true)}
        onSelectGuest={handleSelectGuest}
        onGuestUpdated={(updated) => {
          setGuests((prev) => prev.map((guest) => (guest.id === updated.id ? updated : guest)));
        }}
        onNavigate={(v) => setView(v)}
        onChangeEvent={() => setShowEventList(true)}
        onExport={() => exportGuestsToExcel(guests)}
        onDeleteEvent={() => handleDeleteEvent(currentEvento.id)}
      />
      {detailGuest && (
        <GuestDetailModal
          guest={detailGuest}
          onClose={() => setDetailGuest(null)}
          onGuestUpdated={(g) => {
            setGuests((prev) => prev.map((p) => (p.id === g.id ? g : p)));
            setDetailGuest(g);
          }}
        />
      )}
    </>
  );
}
