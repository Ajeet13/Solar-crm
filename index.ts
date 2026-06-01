export type ClientStatus = 'new' | 'interested' | 'follow_up' | 'deal_closed' | 'not_interested';

export interface CallLog {
  id: string;
  clientId: string;
  status: ClientStatus;
  notes: string;
  dealAmount?: number;
  amountReceived?: number;
  createdAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  mobileNumber: string;
  ivrsNumber: string;
  contactNumber: string;
  address: string;
  status: ClientStatus;
  dealAmount: number;
  amountReceived: number;
  callLogs: CallLog[];
  createdAt: string;
  updatedAt: string;
}

export type Page = 'dashboard' | 'clients' | 'import' | 'settings';

export const STATUS_CONFIG: Record<ClientStatus, { label: string; color: string; bg: string; dot: string }> = {
  new: { label: 'New', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
  interested: { label: 'Interested', color: '#F97316', bg: '#FFF7ED', dot: '#F97316' },
  follow_up: { label: 'Follow Up', color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
  deal_closed: { label: 'Deal Closed', color: '#10B981', bg: '#ECFDF5', dot: '#10B981' },
  not_interested: { label: 'Not Interested', color: '#EF4444', bg: '#FEF2F2', dot: '#EF4444' },
};

export const STATUS_OPTIONS: ClientStatus[] = ['new', 'interested', 'follow_up', 'deal_closed', 'not_interested'];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}
