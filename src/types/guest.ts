export type EventType = 'Casamiento' | 'Cumpleaños de 15' | 'Fiesta de Egresados' | 'Fiesta Privada';

export type Restriccion = 'Normal' | 'Vegano' | 'Vegetariano' | 'Celiaco' | 'Otra';

export type EstadoIngreso = 'Pendiente' | 'Ingresado';

export type MenuElegido = 'Carne/Asado' | 'Pollo' | 'Pescado' | 'Menú Infantil';

export const MENU_OPCIONES: MenuElegido[] = ['Carne/Asado', 'Pollo', 'Pescado', 'Menú Infantil'];

export interface Evento {
  id: number;
  tipo: EventType;
  nombre: string | null;
  fecha: string | null;
  lugar: string | null;
  hora: string | null;
  created_at: string;
  invitation_config?: string | null;
}

export interface Invitado {
  id: number;
  evento_id: number;
  nombre_completo: string;
  mesa: string;
  categoria: string;
  pases_totales: number;
  adultos: number;
  ninos: number;
  menu_elegido: string | null;
  notas: string | null;
  restriccion_alimentaria: Restriccion[];
  asistencia_confirmada: boolean;
  estado_ingreso: EstadoIngreso;
  hora_ingreso: string | null;
  created_at: string;
}

export type InvitadoInsert = Omit<Invitado, 'id' | 'created_at' | 'hora_ingreso' | 'estado_ingreso' | 'evento_id'> & {
  evento_id?: number;
  estado_ingreso?: EstadoIngreso;
  hora_ingreso?: string | null;
};

export type InvitadoUpdate = Partial<InvitadoInsert>;

export const CATEGORIAS_POR_EVENTO: Record<EventType, string[]> = {
  'Casamiento': [
    'Invitados del Novio',
    'Invitados de la Novia',
    'Familiares del Novio',
    'Familiares de la Novia',
    'Otros / Amigos en común',
  ],
  'Cumpleaños de 15': [
    'Amigas',
    'Amigos',
    'Familiares',
    'Compañeros',
    'Otros',
  ],
  'Fiesta de Egresados': [
    'Egresados',
    'Familiares',
    'Profesores',
    'Organización',
    'Otros',
  ],
  'Fiesta Privada': [
    'Familia',
    'Amigos',
    'Conocidos',
    'Otros',
  ],
};

export const RESTRICCIONES: Restriccion[] = ['Normal', 'Vegano', 'Vegetariano', 'Celiaco', 'Otra'];

export const MAX_PERSONAS_POR_MESA = 10;

export const ESTADO_INFO: Record<EstadoIngreso, { label: string; color: 'green' | 'red' }> = {
  Pendiente: { label: 'Disponible', color: 'green' },
  Ingresado: { label: 'Reservado', color: 'red' },
};

export const EVENTO_TITULO: Record<EventType, string> = {
  'Casamiento': '¡Nuestra Boda!',
  'Cumpleaños de 15': '¡Mis 15 Años!',
  'Fiesta de Egresados': '¡Fiesta de Egresados!',
  'Fiesta Privada': '¡Fiesta Privada!',
};
