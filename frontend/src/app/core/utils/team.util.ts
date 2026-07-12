import { Appointment } from '../../core/services/appointment.service';

export function appointmentClientLabel(appointment: Appointment): string {
  if (appointment.guestName?.trim()) {
    return appointment.guestName.trim();
  }
  return appointment.client?.name ?? 'Cliente';
}

export function roleLabel(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'PROFESSIONAL':
      return 'Profissional';
    case 'CLIENT':
      return 'Cliente';
    default:
      return role;
  }
}
