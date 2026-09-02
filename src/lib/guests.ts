import { supabase } from '@/lib/supabase';
import type { Invitado, InvitadoInsert, InvitadoUpdate } from '@/types/guest';

export async function fetchGuests(eventoId: number): Promise<Invitado[]> {
  const { data, error } = await supabase
    .from('invitados')
    .select('*')
    .eq('evento_id', eventoId)
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Invitado[];
}

export async function fetchGuestById(id: number): Promise<Invitado | null> {
  const { data, error } = await supabase
    .from('invitados')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as Invitado) ?? null;
}

export async function checkInGuest(id: number): Promise<Invitado | null> {
  const { data, error } = await supabase
    .from('invitados')
    .update({ estado_ingreso: 'Ingresado', hora_ingreso: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Invitado) ?? null;
}

export async function revertCheckIn(id: number): Promise<Invitado | null> {
  const { data, error } = await supabase
    .from('invitados')
    .update({ estado_ingreso: 'Pendiente', hora_ingreso: null })
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Invitado) ?? null;
}

export async function createGuest(payload: InvitadoInsert): Promise<Invitado | null> {
  const { data, error } = await supabase
    .from('invitados')
    .insert(payload)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Invitado) ?? null;
}

export async function updateGuest(id: number, payload: InvitadoUpdate): Promise<Invitado | null> {
  const { data, error } = await supabase
    .from('invitados')
    .update(payload)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return (data as Invitado) ?? null;
}

export async function deleteGuest(id: number): Promise<void> {
  const { error } = await supabase.from('invitados').delete().eq('id', id);
  if (error) throw error;
}
