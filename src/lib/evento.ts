import { supabase } from '@/lib/supabase';
import type { Evento, EventType } from '@/types/guest';

export async function fetchEventos(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from('evento')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Evento[];
}

export async function fetchEvento(id: number): Promise<Evento | null> {
  const { data, error } = await supabase
    .from('evento')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Evento) ?? null;
}

export interface EventoInput {
  tipo: EventType;
  nombre?: string;
  fecha?: string;
  lugar?: string;
  hora?: string;
}

export async function createEvento(input: EventoInput): Promise<Evento | null> {
  const { data, error } = await supabase
    .from('evento')
    .insert({
      tipo: input.tipo,
      nombre: input.nombre ?? null,
      fecha: input.fecha ?? null,
      lugar: input.lugar ?? null,
      hora: input.hora ?? null,
    })
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Evento) ?? null;
}

export async function updateEvento(id: number, input: EventoInput): Promise<Evento | null> {
  const { data, error } = await supabase
    .from('evento')
    .update({
      tipo: input.tipo,
      nombre: input.nombre ?? null,
      fecha: input.fecha ?? null,
      lugar: input.lugar ?? null,
      hora: input.hora ?? null,
    })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Evento) ?? null;
}

export async function deleteEvento(id: number): Promise<void> {
  const { error: guestErr } = await supabase.from('invitados').delete().eq('evento_id', id);
  if (guestErr) throw guestErr;
  const { error } = await supabase.from('evento').delete().eq('id', id);
  if (error) throw error;
}
