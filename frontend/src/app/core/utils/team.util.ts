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
    case 'EDITOR':
      return 'Editor';
    case 'LEITOR':
      return 'Leitor';
    case 'PROFESSIONAL':
      return 'Leitor';
    case 'CLIENT':
      return 'Cliente';
    default:
      return role;
  }
}

export function canManageSalon(role: string): boolean {
  return role === 'ADMIN';
}

export function canManageSchedulingSettings(role: string): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export function canManageAllSchedules(role: string): boolean {
  return role === 'ADMIN' || role === 'EDITOR';
}

export function isStaffReader(role: string): boolean {
  return role === 'LEITOR' || role === 'PROFESSIONAL';
}

export function canAccessAgendaSettings(role: string): boolean {
  return canManageAllSchedules(role) || isStaffReader(role);
}
