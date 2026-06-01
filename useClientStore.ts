import { useState, useEffect, useCallback } from 'react';
import type { Client, CallLog } from '@/types';
import { generateId } from '@/types';

const STORAGE_KEY = 'solarcrm_clients';
const INITIALIZED_KEY = 'solarcrm_initialized';

const DEMO_CLIENTS: Client[] = [
  {
    id: generateId(),
    fullName: 'Rajesh Kumar Sharma',
    mobileNumber: '9876543210',
    ivrsNumber: 'IVRS-2024-001',
    contactNumber: '011-23456789',
    address: '42, Patel Nagar, New Delhi - 110008',
    status: 'deal_closed',
    dealAmount: 450000,
    amountReceived: 450000,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'Initial inquiry about 5kW solar installation', createdAt: '2025-12-15T10:30:00Z' },
      { id: generateId(), clientId: '', status: 'interested', notes: 'Site survey completed. Client interested in on-grid system.', createdAt: '2025-12-18T14:00:00Z' },
      { id: generateId(), clientId: '', status: 'deal_closed', notes: 'Deal closed for 5kW on-grid system. Full payment received.', dealAmount: 450000, amountReceived: 450000, createdAt: '2026-01-05T11:00:00Z' },
    ],
    createdAt: '2025-12-15T10:30:00Z',
    updatedAt: '2026-01-05T11:00:00Z',
  },
  {
    id: generateId(),
    fullName: 'Priya Patel',
    mobileNumber: '8765432109',
    ivrsNumber: '',
    contactNumber: '8765432109',
    address: '15, Green Valley Apartments, Bangalore - 560034',
    status: 'interested',
    dealAmount: 0,
    amountReceived: 0,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'Called about solar for her apartment complex', createdAt: '2026-01-10T09:15:00Z' },
      { id: generateId(), clientId: '', status: 'interested', notes: 'Wants 3kW system. Scheduled site visit for next week.', createdAt: '2026-01-12T16:30:00Z' },
    ],
    createdAt: '2026-01-10T09:15:00Z',
    updatedAt: '2026-01-12T16:30:00Z',
  },
  {
    id: generateId(),
    fullName: 'Amit Singh Chauhan',
    mobileNumber: '7654321098',
    ivrsNumber: 'IVRS-2024-015',
    contactNumber: '',
    address: '78, Model Town, Jaipur - 302001',
    status: 'follow_up',
    dealAmount: 0,
    amountReceived: 0,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'Interested in solar water heater plus panels', createdAt: '2026-01-08T11:00:00Z' },
      { id: generateId(), clientId: '', status: 'interested', notes: 'Quoted for hybrid system. Needs to discuss with family.', createdAt: '2026-01-14T13:45:00Z' },
      { id: generateId(), clientId: '', status: 'follow_up', notes: 'Follow-up call scheduled. Waiting for budget approval.', createdAt: '2026-01-20T10:00:00Z' },
    ],
    createdAt: '2026-01-08T11:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
  {
    id: generateId(),
    fullName: 'Sunita Devi Agrawal',
    mobileNumber: '6543210987',
    ivrsNumber: '',
    contactNumber: '0291-2456789',
    address: '23, Ratanada, Jodhpur - 342001',
    status: 'deal_closed',
    dealAmount: 320000,
    amountReceived: 160000,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'Called for 4kW rooftop solar', createdAt: '2025-11-20T09:00:00Z' },
      { id: generateId(), clientId: '', status: 'interested', notes: 'Site assessment done. Roof suitable.', createdAt: '2025-11-25T14:30:00Z' },
      { id: generateId(), clientId: '', status: 'deal_closed', notes: 'Deal closed. 50% advance received. Balance on installation.', dealAmount: 320000, amountReceived: 160000, createdAt: '2025-12-10T11:00:00Z' },
    ],
    createdAt: '2025-11-20T09:00:00Z',
    updatedAt: '2025-12-10T11:00:00Z',
  },
  {
    id: generateId(),
    fullName: 'Vikram Reddy',
    mobileNumber: '5432109876',
    ivrsNumber: 'IVRS-2024-032',
    contactNumber: '5432109876',
    address: '56, Hitech City, Hyderabad - 500081',
    status: 'not_interested',
    dealAmount: 0,
    amountReceived: 0,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'Inquiry about commercial solar installation', createdAt: '2026-01-15T10:00:00Z' },
      { id: generateId(), clientId: '', status: 'not_interested', notes: 'Found cheaper vendor. Not interested anymore.', createdAt: '2026-01-18T15:00:00Z' },
    ],
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-01-18T15:00:00Z',
  },
  {
    id: generateId(),
    fullName: 'Meena Gupta',
    mobileNumber: '4321098765',
    ivrsNumber: '',
    contactNumber: '',
    address: '89, Lake View Road, Udaipur - 313001',
    status: 'interested',
    dealAmount: 0,
    amountReceived: 0,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'Wants solar for new villa construction', createdAt: '2026-01-22T09:30:00Z' },
      { id: generateId(), clientId: '', status: 'interested', notes: 'Wants 8kW premium system with battery backup.', createdAt: '2026-01-25T14:00:00Z' },
    ],
    createdAt: '2026-01-22T09:30:00Z',
    updatedAt: '2026-01-25T14:00:00Z',
  },
  {
    id: generateId(),
    fullName: 'Deepak Mishra',
    mobileNumber: '3210987654',
    ivrsNumber: 'IVRS-2024-048',
    contactNumber: '0512-2345678',
    address: '34, Civil Lines, Kanpur - 208001',
    status: 'new',
    dealAmount: 0,
    amountReceived: 0,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'First call. Asked about government subsidy for solar.', createdAt: '2026-01-26T11:00:00Z' },
    ],
    createdAt: '2026-01-26T11:00:00Z',
    updatedAt: '2026-01-26T11:00:00Z',
  },
  {
    id: generateId(),
    fullName: 'Kavita Joshi',
    mobileNumber: '2109876543',
    ivrsNumber: '',
    contactNumber: '2109876543',
    address: '67, Hill View Colony, Dehradun - 248001',
    status: 'follow_up',
    dealAmount: 0,
    amountReceived: 0,
    callLogs: [
      { id: generateId(), clientId: '', status: 'new', notes: 'Interested in 2kW system for small home', createdAt: '2026-01-20T09:00:00Z' },
      { id: generateId(), clientId: '', status: 'follow_up', notes: 'Will decide after comparing with other quotes.', createdAt: '2026-01-24T16:00:00Z' },
    ],
    createdAt: '2026-01-20T09:00:00Z',
    updatedAt: '2026-01-24T16:00:00Z',
  },
];

function loadClients(): Client[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveClients(clients: Client[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

export function useClientStore() {
  const [clients, setClients] = useState<Client[]>(() => {
    const stored = loadClients();
    if (stored.length === 0) {
      const initialized = localStorage.getItem(INITIALIZED_KEY);
      if (!initialized) {
        localStorage.setItem(INITIALIZED_KEY, 'true');
        const demoWithClientIds = DEMO_CLIENTS.map(c => ({
          ...c,
          callLogs: c.callLogs.map(log => ({ ...log, clientId: c.id })),
        }));
        saveClients(demoWithClientIds);
        return demoWithClientIds;
      }
    }
    return stored;
  });

  useEffect(() => {
    saveClients(clients);
  }, [clients]);

  const addClient = useCallback((clientData: Omit<Client, 'id' | 'callLogs' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      callLogs: [],
      createdAt: now,
      updatedAt: now,
    };
    setClients(prev => [newClient, ...prev]);
    return newClient;
  }, []);

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    setClients(prev =>
      prev.map(c =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      )
    );
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  const addCallLog = useCallback((clientId: string, logData: Omit<CallLog, 'id' | 'clientId' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newLog: CallLog = {
      ...logData,
      id: generateId(),
      clientId,
      createdAt: now,
    };
    setClients(prev =>
      prev.map(c => {
        if (c.id !== clientId) return c;
        const updates: Partial<Client> = {
          callLogs: [...c.callLogs, newLog],
          updatedAt: now,
          status: logData.status,
        };
        if (logData.dealAmount !== undefined) updates.dealAmount = logData.dealAmount;
        if (logData.amountReceived !== undefined) updates.amountReceived = logData.amountReceived;
        return { ...c, ...updates };
      })
    );
    return newLog;
  }, []);

  const importClients = useCallback((newClients: Omit<Client, 'id' | 'callLogs' | 'createdAt' | 'updatedAt'>[]) => {
    const now = new Date().toISOString();
    const created = newClients.map(data => ({
      ...data,
      id: generateId(),
      callLogs: [] as CallLog[],
      createdAt: now,
      updatedAt: now,
    }));
    setClients(prev => [...created, ...prev]);
    return created;
  }, []);

  const clearAll = useCallback(() => {
    setClients([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INITIALIZED_KEY);
  }, []);

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    addCallLog,
    importClients,
    clearAll,
  };
}
