import { useRef, useState } from 'react';
import { X, Download, Share2, Calendar, MapPin, Clock, Users, UtensilsCrossed, Armchair, Baby, Utensils, Image, Palette, Type, Frame, QrCode, MessageSquare, ChevronDown, ChevronUp, Save, CheckCircle2 } from 'lucide-react';
import type { Evento, Invitado } from '@/types/guest';
import { EVENTO_TITULO } from '@/types/guest';
import { buildQrImageUrl, escapeXmlAttr } from '@/lib/qr';
import {
  DEFAULT_CONFIG, FONT_STYLES, TITLE_SIZES, TEXT_SIZES, FRAME_SHAPES, QR_POSITIONS,
  COLOR_SWATCHES, ACCENT_SWATCHES, formatDate, formatHora,
} from '@/lib/invitation';
import type { InvitationConfig } from '@/lib/invitation';

interface InvitationDesignerProps {
  evento: Evento;
  previewGuest: Invitado | null;
  savedConfig: InvitationConfig | null;
  onSave: (config: InvitationConfig) => Promise<void>;
  onClose: () => void;
}

type Section = 'colors' | 'background' | 'font' | 'frame' | 'qr' | 'footer';

export default function InvitationDesigner({ evento, previewGuest, savedConfig, onSave, onClose }: InvitationDesignerProps) {
  const [config, setConfig] = useState<InvitationConfig>(savedConfig ?? { ...DEFAULT_CONFIG });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSection, setOpenSection] = useState<Section | null>('colors');
  const fileRef = useRef<HTMLInputElement>(null);

  const guest = previewGuest;
  const fontStyle = FONT_STYLES[config.fontIdx];
  const titleSize = TITLE_SIZES[config.titleSize];
  const textSize = TEXT_SIZES[config.textSize];
  const frameRadius = getFrameRadius(config);
  const restrictions = guest ? guest.restriccion_alimentaria.filter((r) => r !== 'Normal') : [];

  function update<K extends keyof InvitationConfig>(key: K, value: InvitationConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('bgImage', reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleSection(s: Section) {
    setOpenSection((prev) => (prev === s ? null : s));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // non-fatal
    } finally {
      setSaving(false);
    }
  }

  const qrContainerClass =
    config.qrPosition === 'center' ? 'flex justify-center mt-6' :
    config.qrPosition === 'right' ? 'flex justify-end mt-6' :
    'flex justify-center mt-6';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-start justify-center px-4 py-4 animate-fade-in overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-md my-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-lg font-serif font-light text-white">Diseño de Invitación</h2>
            <p className="text-xs text-white/40 font-light">Se aplica a todos los invitados del evento</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* LIVE PREVIEW */}
        <div
          className="relative overflow-hidden shadow-2xl"
          style={{
            background: config.bgImage ? `url(${config.bgImage}) center/cover` : config.bgColor,
            color: config.textColor,
            fontFamily: fontStyle.font,
            borderRadius: `${frameRadius}px`,
          }}
        >
          {config.bgImage && (
            <div className="absolute inset-0" style={{ backgroundColor: config.bgColor, opacity: config.bgOpacity / 100 }} />
          )}
          <div className="absolute inset-3 pointer-events-none" style={{ borderRadius: `${Math.max(0, frameRadius - 6)}px`, border: `${config.borderWidth}px solid ${config.borderColor}`, opacity: 0.7 }} />
          <div className="relative px-7 py-6 text-center">
            <p className="text-[10px] tracking-[0.35em] uppercase font-medium" style={{ color: config.dataColor }}>Invitación especial</p>
            <h2 className="mt-2 font-serif" style={{ color: config.titleColor, fontSize: `${titleSize.px}px`, fontWeight: config.bold ? fontStyle.weight + 200 : fontStyle.weight, fontStyle: config.italic ? 'italic' : 'normal', letterSpacing: `${config.letterSpacing}px` }}>
              {EVENTO_TITULO[evento.tipo]}
            </h2>
            {evento.nombre && <p className="mt-1 text-sm" style={{ color: config.dataColor, fontStyle: config.italic ? 'italic' : 'normal' }}>{evento.nombre}</p>}
            <div className="my-4 h-px" style={{ backgroundColor: config.borderColor, opacity: 0.45 }} />
            <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: config.dataColor }}>Invitado/a</p>
            <p className="mt-1 font-serif" style={{ fontSize: `${titleSize.px - 6}px`, fontWeight: config.bold ? 700 : 600, fontStyle: config.italic ? 'italic' : 'normal' }}>
              {guest ? guest.nombre_completo : 'Nombre del Invitado'}
            </p>
            {guest && (
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <InfoBox icon={<Users className="w-3.5 h-3.5" />} label="Adultos" value={String(guest.adultos)} config={config} />
                <InfoBox icon={<Baby className="w-3.5 h-3.5" />} label="Niños" value={String(guest.ninos)} config={config} />
                <InfoBox icon={<Armchair className="w-3.5 h-3.5" />} label="Mesa" value={guest.mesa} config={config} />
                <InfoBox icon={<span className="text-xs">🏷️</span>} label="Grupo" value={guest.categoria} config={config} />
                <InfoBox icon={<Utensils className="w-3.5 h-3.5" />} label="Menú" value={guest.menu_elegido || 'A confirmar'} config={config} />
                <InfoBox icon={<UtensilsCrossed className="w-3.5 h-3.5" />} label="Alim." value={restrictions.length ? restrictions.join(', ') : 'Normal'} config={config} />
              </div>
            )}
            <div className="mt-4 space-y-1.5 text-left" style={{ color: config.dataColor, fontSize: `${textSize.px}px` }}>
              <DetailRow icon={<Calendar className="w-3.5 h-3.5" />} value={formatDate(evento.fecha)} />
              <DetailRow icon={<MapPin className="w-3.5 h-3.5" />} value={evento.lugar || 'Lugar a confirmar'} />
              <DetailRow icon={<Clock className="w-3.5 h-3.5" />} value={formatHora(evento.hora)} />
            </div>
            <div className={qrContainerClass}>
              <div className="inline-flex p-2.5 shadow-lg" style={{ backgroundColor: config.qrBgColor, border: `${config.borderWidth}px solid ${config.borderColor}`, borderRadius: '12px' }}>
                <img src={buildQrImageUrl(guest?.id ?? 1, 150)} alt="QR" className="w-32 h-32" />
              </div>
            </div>
            <p className="mt-2 text-[10px] tracking-widest uppercase" style={{ color: config.dataColor }}>Presentá este código en recepción</p>
            {config.footerMessage && (
              <p className="mt-4 pt-3 text-sm" style={{ color: config.textColor, fontStyle: config.italic ? 'italic' : 'normal', fontWeight: config.bold ? 600 : 400, borderTop: `1px solid ${config.borderColor}55` }}>
                {config.footerMessage}
              </p>
            )}
          </div>
        </div>

        {!guest && (
          <p className="text-center text-amber-400/70 text-xs mt-2 font-light">
            Vista previa con datos de ejemplo. Agregá invitados para verlos en la invitación.
          </p>
        )}

        {/* CUSTOMIZER */}
        <div className="mt-3 rounded-2xl bg-ink-800 border border-white/10 overflow-hidden">
          <SectionHeader title="Colores" icon={<Palette className="w-4 h-4" />} open={openSection === 'colors'} onClick={() => toggleSection('colors')} />
          {openSection === 'colors' && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              <ColorRow label="Fondo de tarjeta" value={config.bgColor} swatches={COLOR_SWATCHES} onChange={(v) => update('bgColor', v)} />
              <ColorRow label="Títulos" value={config.titleColor} swatches={ACCENT_SWATCHES} onChange={(v) => update('titleColor', v)} />
              <ColorRow label="Texto general" value={config.textColor} swatches={COLOR_SWATCHES} onChange={(v) => update('textColor', v)} />
              <ColorRow label="Datos (fecha, hora, lugar)" value={config.dataColor} swatches={ACCENT_SWATCHES} onChange={(v) => update('dataColor', v)} />
              <ColorRow label="Borde decorativo" value={config.borderColor} swatches={ACCENT_SWATCHES} onChange={(v) => update('borderColor', v)} />
              <ColorRow label="Fondo del QR" value={config.qrBgColor} swatches={COLOR_SWATCHES} onChange={(v) => update('qrBgColor', v)} />
              <div>
                <p className="text-xs text-white/40 font-light mb-1.5">Grosor del borde</p>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={6} step={1} value={config.borderWidth} onChange={(e) => update('borderWidth', Number(e.target.value))} className="flex-1 accent-gold-400" />
                  <span className="text-xs text-white/60 w-8 text-center">{config.borderWidth}px</span>
                </div>
              </div>
            </div>
          )}

          <SectionHeader title="Fondo y Marco" icon={<Frame className="w-4 h-4" />} open={openSection === 'background'} onClick={() => toggleSection('background')} />
          {openSection === 'background' && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              <div>
                <p className="text-xs text-white/40 font-light mb-1.5 flex items-center gap-1.5"><Image className="w-3.5 h-3.5" /> Imagen de fondo</p>
                <div className="flex gap-2">
                  <button onClick={() => fileRef.current?.click()} className="flex-1 px-3 py-2 rounded-lg bg-ink-700 border border-white/10 text-white/70 text-xs hover:border-gold-400/40">Subir imagen</button>
                  {config.bgImage && <button onClick={() => update('bgImage', null)} className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20">Quitar</button>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
              {config.bgImage && (
                <div>
                  <p className="text-xs text-white/40 font-light mb-1.5">Opacidad del fondo</p>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={100} step={5} value={config.bgOpacity} onChange={(e) => update('bgOpacity', Number(e.target.value))} className="flex-1 accent-gold-400" />
                    <span className="text-xs text-white/60 w-10 text-center">{config.bgOpacity}%</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-white/40 font-light mb-1.5">Forma del marco</p>
                <div className="flex gap-2">
                  {FRAME_SHAPES.map((f) => (
                    <button key={f.name} onClick={() => update('frameShape', f.name.toLowerCase() as InvitationConfig['frameShape'])} className={`flex-1 px-3 py-2 rounded-lg text-xs border transition-all ${getFrameRadius(config) === f.radius ? 'bg-gold-400/15 border-gold-400/50 text-gold-300' : 'bg-ink-700 border-white/10 text-white/50 hover:border-white/20'}`} style={{ borderRadius: `${f.radius}px` }}>{f.name}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <SectionHeader title="Estilos de Letra" icon={<Type className="w-4 h-4" />} open={openSection === 'font'} onClick={() => toggleSection('font')} />
          {openSection === 'font' && (
            <div className="px-4 pb-4 space-y-3 animate-fade-in">
              <div>
                <p className="text-xs text-white/40 font-light mb-1.5">Estilo de letra</p>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_STYLES.map((f, i) => (
                    <button key={f.name} onClick={() => update('fontIdx', i)} className={`px-3 py-2 rounded-lg text-xs border transition-all ${config.fontIdx === i ? 'bg-gold-400/15 border-gold-400/50 text-gold-300' : 'bg-ink-700 border-white/10 text-white/50 hover:border-white/20'}`} style={{ fontFamily: f.font, fontWeight: f.weight }}>{f.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 font-light mb-1.5">Tamaño de títulos</p>
                <div className="flex gap-2">
                  {TITLE_SIZES.map((s, i) => (
                    <button key={s.name} onClick={() => update('titleSize', i)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs border transition-all ${config.titleSize === i ? 'bg-gold-400/15 border-gold-400/50 text-gold-300' : 'bg-ink-700 border-white/10 text-white/50 hover:border-white/20'}`}>{s.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 font-light mb-1.5">Tamaño del texto general</p>
                <div className="flex gap-2">
                  {TEXT_SIZES.map((s, i) => (
                    <button key={s.name} onClick={() => update('textSize', i)} className={`flex-1 px-2 py-1.5 rounded-lg text-xs border transition-all ${config.textSize === i ? 'bg-gold-400/15 border-gold-400/50 text-gold-300' : 'bg-ink-700 border-white/10 text-white/50 hover:border-white/20'}`}>{s.name}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 font-light mb-1.5">Espaciado entre letras</p>
                <div className="flex items-center gap-2">
                  <input type="range" min={-2} max={8} step={0.5} value={config.letterSpacing} onChange={(e) => update('letterSpacing', Number(e.target.value))} className="flex-1 accent-gold-400" />
                  <span className="text-xs text-white/60 w-10 text-center">{config.letterSpacing}px</span>
                </div>
              </div>
              <div className="flex gap-3">
                <ToggleButton label="Negrita" active={config.bold} onClick={() => update('bold', !config.bold)} />
                <ToggleButton label="Cursiva" active={config.italic} onClick={() => update('italic', !config.italic)} />
              </div>
            </div>
          )}

          <SectionHeader title="Ubicación del QR" icon={<QrCode className="w-4 h-4" />} open={openSection === 'qr'} onClick={() => toggleSection('qr')} />
          {openSection === 'qr' && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
              <div className="flex gap-2">
                {QR_POSITIONS.map((p) => (
                  <button key={p.value} onClick={() => update('qrPosition', p.value)} className={`flex-1 px-3 py-2 rounded-lg text-xs border transition-all ${config.qrPosition === p.value ? 'bg-gold-400/15 border-gold-400/50 text-gold-300' : 'bg-ink-700 border-white/10 text-white/50 hover:border-white/20'}`}>{p.name}</button>
                ))}
              </div>
            </div>
          )}

          <SectionHeader title="Mensaje al Pie" icon={<MessageSquare className="w-4 h-4" />} open={openSection === 'footer'} onClick={() => toggleSection('footer')} />
          {openSection === 'footer' && (
            <div className="px-4 pb-4 space-y-2 animate-fade-in">
              <textarea value={config.footerMessage} onChange={(e) => update('footerMessage', e.target.value)} placeholder="Ej: ¡Te esperamos para celebrar juntos este momento único!" rows={2} className="w-full px-3 py-2.5 rounded-xl bg-ink-700 border border-white/10 text-white placeholder:text-white/30 font-light text-sm outline-none focus:border-gold-400/60 resize-none" />
            </div>
          )}
        </div>

        {/* Save button */}
        <button onClick={handleSave} disabled={saving} className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-full gold-gradient-bg text-ink-900 font-semibold text-sm tracking-wide hover:shadow-gold transition-all disabled:opacity-60">
          {saved ? <><CheckCircle2 className="w-5 h-5" /> ¡Diseño guardado!</> : <><Save className="w-5 h-5" /> {saving ? 'Guardando…' : 'Guardar diseño del evento'}</>}
        </button>
        {saved && <p className="text-center text-emerald2-400 text-xs mt-2 animate-fade-in">Este diseño se aplicará automáticamente a todos los invitados</p>}
      </div>
    </div>
  );
}

function getFrameRadius(config: InvitationConfig): number {
  if (config.frameShape === 'rounded') return 28;
  if (config.frameShape === 'soft') return 12;
  return 0;
}

function SectionHeader({ title, icon, open, onClick }: { title: string; icon: React.ReactNode; open: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-t border-white/5 first:border-t-0">
      <span className="flex items-center gap-2 text-white/70 text-sm font-light">{icon} {title}</span>
      {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
    </button>
  );
}

function ColorRow({ label, value, swatches, onChange }: { label: string; value: string; swatches: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-white/40 font-light">{label}</p>
        <div className="flex items-center gap-1.5">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/20" />
          <span className="text-[10px] text-white/30 font-mono">{value}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {swatches.map((c) => (
          <button key={c} onClick={() => onChange(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${value.toLowerCase() === c.toLowerCase() ? 'border-white scale-110' : 'border-white/20 hover:scale-105'}`} style={{ backgroundColor: c }} />
        ))}
      </div>
    </div>
  );
}

function ToggleButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 px-3 py-2 rounded-lg text-xs border transition-all ${active ? 'bg-gold-400/15 border-gold-400/50 text-gold-300' : 'bg-ink-700 border-white/10 text-white/50 hover:border-white/20'}`}>{label}: {active ? 'Sí' : 'No'}</button>
  );
}

function InfoBox({ icon, label, value, config }: { icon: React.ReactNode; label: string; value: string; config: InvitationConfig }) {
  return (
    <div className="rounded-xl p-2" style={{ backgroundColor: `${config.borderColor}15` }}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide" style={{ color: config.dataColor }}>{icon}<span>{label}</span></div>
      <p className="mt-0.5 text-xs font-medium truncate" title={value} style={{ color: config.textColor }}>{value}</p>
    </div>
  );
}

function DetailRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return <div className="flex items-center gap-2"><span className="shrink-0">{icon}</span><span className="capitalize">{value}</span></div>;
}
