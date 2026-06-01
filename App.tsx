import { useState, useRef, useCallback, useMemo } from 'react';
import type { Client, ClientStatus, Page } from '@/types';
import { STATUS_CONFIG, STATUS_OPTIONS, formatCurrency, formatPhone, generateId } from '@/types';
import { useClientStore } from '@/hooks/useClientStore';
import * as XLSX from 'xlsx';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Users, Upload, Settings, Plus, Search, Phone, Pencil, Trash2,
  X, ChevronDown, Download, AlertTriangle, CheckCircle, ThumbsUp,
  IndianRupee, Check, Crown,
} from 'lucide-react';
import './App.css';

/* ═══════════════════════════════════════════
   NAV RAIL
   ═══════════════════════════════════════════ */
const NAV_ITEMS: { page: Page; icon: React.ElementType; label: string }[] = [
  { page: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { page: 'clients', icon: Users, label: 'Clients' },
  { page: 'import', icon: Upload, label: 'Import' },
  { page: 'settings', icon: Settings, label: 'Settings' },
];

function NavRail({ activePage, onNavigate }: { activePage: Page; onNavigate: (p: Page) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <nav className="fixed left-0 top-0 h-screen w-16 bg-[#1C1917] flex flex-col items-center py-4 z-50 select-none">
      <div className="mb-6">
        <div className="w-9 h-9 rounded-lg bg-[#F97316] flex items-center justify-center">
          <Crown className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-2 mt-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.page;
          const Icon = item.icon;
          return (
            <div key={item.page} className="relative">
              <button
                onClick={() => onNavigate(item.page)}
                onMouseEnter={() => setHovered(item.page)}
                onMouseLeave={() => setHovered(null)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 relative ${
                  isActive ? 'text-[#F97316]' : 'text-[#78716C] hover:text-[#A8A29E]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#F97316] rounded-r-full transition-transform duration-200" />
                )}
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
              </button>
              {hovered === item.page && (
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-[#292524] text-[#FAFAF9] text-[11px] font-medium uppercase tracking-[0.04em] px-2.5 py-1.5 rounded-md whitespace-nowrap z-50 shadow-lg">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-auto mb-2">
        <img
          src="https://api.dicebear.com/9.x/avataaars/svg?seed=sales&backgroundColor=1c1917"
          alt="User"
          className="w-8 h-8 rounded-full border border-[#44403C]"
        />
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════ */
function StatusBadge({ status, onChange, clickable = false }: {
  status: ClientStatus; onChange?: (s: ClientStatus) => void; clickable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = STATUS_CONFIG[status];

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (clickable && onChange) setOpen(o => !o);
  }, [clickable, onChange]);

  const handleSelect = useCallback((s: ClientStatus) => {
    onChange?.(s);
    setOpen(false);
  }, [onChange]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 ${
          clickable ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
        }`}
        style={{ backgroundColor: config.bg, color: config.color }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dot }} />
        {config.label}
        {clickable && <ChevronDown className="w-3 h-3 ml-0.5" />}
      </button>
      {open && clickable && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border border-[#E7E5E4] py-1 z-50 min-w-[160px] animate-in fade-in slide-in-from-top-1 duration-150">
            {STATUS_OPTIONS.map(s => {
              const c = STATUS_CONFIG[s];
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-[#FAFAF9] transition-colors text-left"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.dot }} />
                  <span style={{ color: c.color }}>{c.label}</span>
                  {s === status && <Check className="w-3 h-3 ml-auto text-[#F97316]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════ */
interface Toast { id: string; message: string; type: 'success' | 'error' | 'info'; }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="bg-white rounded-xl shadow-lg border border-[#E7E5E4] px-4 py-3 flex items-center gap-3 min-w-[300px] animate-in slide-in-from-right-2 fade-in duration-300"
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            t.type === 'success' ? 'bg-[#10B981]' : t.type === 'error' ? 'bg-[#EF4444]' : 'bg-[#3B82F6]'
          }`} />
          <span className="text-sm text-[#292524] flex-1">{t.message}</span>
          <button onClick={() => onRemove(t.id)} className="text-[#A8A29E] hover:text-[#78716C]">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DASHBOARD PAGE
   ═══════════════════════════════════════════ */
function DashboardPage({ clients }: { clients: Client[] }) {
  const stats = useMemo(() => {
    const total = clients.length;
    const interested = clients.filter(c => c.status === 'interested').length;
    const closed = clients.filter(c => c.status === 'deal_closed').length;
    const revenue = clients.reduce((sum, c) => sum + c.amountReceived, 0);
    return { total, interested, closed, revenue };
  }, [clients]);

  const statusData = useMemo(() => [
    { name: 'Interested', value: clients.filter(c => c.status === 'interested').length, color: '#F97316' },
    { name: 'Deal Closed', value: clients.filter(c => c.status === 'deal_closed').length, color: '#10B981' },
    { name: 'Not Interested', value: clients.filter(c => c.status === 'not_interested').length, color: '#EF4444' },
    { name: 'Follow Up', value: clients.filter(c => c.status === 'follow_up').length, color: '#F59E0B' },
    { name: 'New', value: clients.filter(c => c.status === 'new').length, color: '#A8A29E' },
  ].filter(d => d.value > 0), [clients]);

  const weeklyData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const count = clients.reduce((sum, c) =>
        sum + c.callLogs.filter(log => log.createdAt.startsWith(dayStr)).length, 0
      );
      data.push({ day: days[d.getDay()], calls: count });
    }
    return data;
  }, [clients]);

  const recentClients = useMemo(() =>
    [...clients].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5),
    [clients]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: stats.total, icon: Users, iconBg: '#E0E7FF', iconColor: '#6366F1', textColor: '#292524' },
          { label: 'Interested', value: stats.interested, icon: ThumbsUp, iconBg: '#FFF7ED', iconColor: '#F97316', textColor: '#F97316' },
          { label: 'Deal Closed', value: stats.closed, icon: CheckCircle, iconBg: '#ECFDF5', iconColor: '#10B981', textColor: '#10B981' },
          { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: IndianRupee, iconBg: '#ECFDF5', iconColor: '#10B981', textColor: '#10B981' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_2px_4px_rgba(0,0,0,0.04)] transition-shadow duration-200"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: card.iconBg }}>
                <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
              </div>
              <span className="text-xs font-medium text-[#A8A29E]">{card.label}</span>
            </div>
            <div className="text-[28px] font-semibold leading-tight" style={{ color: card.textColor, fontFamily: "'IBM Plex Mono', monospace" }}>
              {card.label === 'Total Revenue' ? card.value : stats.total.toString().padStart(1, '0') ? card.value : 0}
            </div>
            {card.label !== 'Total Revenue' && (
              <div className="text-[28px] font-semibold leading-tight text-[#292524]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                {card.value}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-semibold text-[#292524] mb-4">Status Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={32} outerRadius={80} paddingAngle={2} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="ml-6 space-y-2">
              {statusData.map(d => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-[#78716C]">{d.name}</span>
                  <span className="font-medium text-[#292524] ml-1">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]">
          <h3 className="text-sm font-semibold text-[#292524] mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F4" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#A8A29E' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="calls" fill="#F97316" radius={[8, 8, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Clients */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-[#E7E5E4]">
          <h3 className="text-sm font-semibold text-[#292524]">Recent Clients</h3>
          <span className="text-xs text-[#F97316] font-medium">{clients.length} total</span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAFAF9] text-left">
              <th className="px-6 py-3 text-xs font-medium text-[#A8A29E]">Name</th>
              <th className="px-6 py-3 text-xs font-medium text-[#A8A29E]">Phone</th>
              <th className="px-6 py-3 text-xs font-medium text-[#A8A29E]">Location</th>
              <th className="px-6 py-3 text-xs font-medium text-[#A8A29E]">Status</th>
              <th className="px-6 py-3 text-xs font-medium text-[#A8A29E]">Deal Amount</th>
              <th className="px-6 py-3 text-xs font-medium text-[#A8A29E]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentClients.map(client => (
              <tr key={client.id} className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors">
                <td className="px-6 py-3.5 text-sm font-medium text-[#292524]">{client.fullName}</td>
                <td className="px-6 py-3.5 text-sm text-[#4B5563]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatPhone(client.mobileNumber)}</td>
                <td className="px-6 py-3.5 text-sm text-[#4B5563] max-w-[200px] truncate">{client.address || '—'}</td>
                <td className="px-6 py-3.5"><StatusBadge status={client.status} /></td>
                <td className="px-6 py-3.5 text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: client.status === 'deal_closed' ? '#10B981' : '#A8A29E' }}>
                  {client.dealAmount > 0 ? formatCurrency(client.dealAmount) : '—'}
                </td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#3B82F6] hover:bg-[#EFF6FF] transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A8A29E] hover:bg-[#F5F5F4] transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CLIENT MODAL (Add/Edit)
   ═══════════════════════════════════════════ */
function ClientModal({ client, onSave, onClose }: {
  client?: Client | null; onSave: (data: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState({
    fullName: client?.fullName || '',
    mobileNumber: client?.mobileNumber || '',
    ivrsNumber: client?.ivrsNumber || '',
    contactNumber: client?.contactNumber || '',
    address: client?.address || '',
    status: (client?.status || 'new') as ClientStatus,
    dealAmount: client?.dealAmount || 0,
    amountReceived: client?.amountReceived || 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string | number | ClientStatus) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Name is required';
    if (!form.mobileNumber.trim()) errs.mobileNumber = 'Mobile number is required';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-[560px] max-h-[85vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-250">
        <div className="px-6 py-5 border-b border-[#E7E5E4] flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-[#292524]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A8A29E] hover:bg-[#F5F5F4] hover:text-[#78716C] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Full Name *</label>
              <input
                value={form.fullName}
                onChange={e => update('fullName', e.target.value)}
                className={`w-full h-10 px-3 rounded-[10px] border text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)] ${errors.fullName ? 'border-[#EF4444]' : 'border-[#E7E5E4]'}`}
                placeholder="Enter full name"
              />
              {errors.fullName && <p className="text-xs text-[#EF4444] mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Mobile Number *</label>
              <input
                value={form.mobileNumber}
                onChange={e => update('mobileNumber', e.target.value)}
                className={`w-full h-10 px-3 rounded-[10px] border text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)] ${errors.mobileNumber ? 'border-[#EF4444]' : 'border-[#E7E5E4]'}`}
                placeholder="9876543210"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
              {errors.mobileNumber && <p className="text-xs text-[#EF4444] mt-1">{errors.mobileNumber}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">IVRS Number</label>
              <input
                value={form.ivrsNumber}
                onChange={e => update('ivrsNumber', e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
                placeholder="IVRS-2024-XXX"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Contact Number</label>
              <input
                value={form.contactNumber}
                onChange={e => update('contactNumber', e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
                placeholder="Alternative number"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={e => update('address', e.target.value)}
              className="w-full px-3 py-2.5 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)] resize-none"
              rows={3}
              placeholder="Enter full address"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={e => update('status', e.target.value as ClientStatus)}
                className="w-full h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)] bg-white"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            {form.status === 'deal_closed' && (
              <div>
                <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Deal Amount (₹)</label>
                <input
                  type="number"
                  value={form.dealAmount || ''}
                  onChange={e => update('dealAmount', Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
                  placeholder="0"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                />
              </div>
            )}
          </div>
          {form.status === 'deal_closed' && form.dealAmount > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Amount Received (₹)</label>
              <input
                type="number"
                value={form.amountReceived || ''}
                onChange={e => update('amountReceived', Number(e.target.value))}
                className="w-full h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
                placeholder="0"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#E7E5E4] flex items-center justify-end gap-3 sticky bottom-0 bg-white">
          <button onClick={onClose} className="h-10 px-5 rounded-[10px] border border-[#E7E5E4] text-sm font-medium text-[#292524] hover:bg-[#FAFAF9] transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit} className="h-10 px-5 rounded-[10px] bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] active:scale-[0.97] transition-all duration-150">
            {client ? 'Update Client' : 'Save Client'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CALL LOG DRAWER
   ═══════════════════════════════════════════ */
function CallLogDrawer({ client, onLogCall, onClose }: {
  client: Client; onLogCall: (clientId: string, data: any) => void; onClose: () => void;
}) {
  const [status, setStatus] = useState<ClientStatus>('interested');
  const [notes, setNotes] = useState('');
  const [dealAmount, setDealAmount] = useState('');
  const [amountReceived, setAmountReceived] = useState('');

  const handleSubmit = () => {
    if (!notes.trim()) return;
    onLogCall(client.id, {
      status,
      notes,
      dealAmount: status === 'deal_closed' ? Number(dealAmount) || 0 : undefined,
      amountReceived: status === 'deal_closed' ? Number(amountReceived) || 0 : undefined,
    });
    setNotes('');
    setDealAmount('');
    setAmountReceived('');
  };

  const sortedLogs = [...client.callLogs].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusPills: { value: ClientStatus; label: string; color: string; bg: string }[] = [
    { value: 'new', label: 'New', color: '#6B7280', bg: '#F3F4F6' },
    { value: 'interested', label: 'Interested', color: '#F97316', bg: '#FFF7ED' },
    { value: 'follow_up', label: 'Follow Up', color: '#F59E0B', bg: '#FFFBEB' },
    { value: 'deal_closed', label: 'Deal Closed', color: '#10B981', bg: '#ECFDF5' },
    { value: 'not_interested', label: 'Not Interested', color: '#EF4444', bg: '#FEF2F2' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative bg-white w-[420px] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E7E5E4] flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#292524]">{client.fullName}</h3>
            <a href={`tel:${client.mobileNumber}`} className="text-sm text-[#3B82F6] hover:underline" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              {formatPhone(client.mobileNumber)}
            </a>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A8A29E] hover:bg-[#F5F5F4] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Call History */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {sortedLogs.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-10 h-10 text-[#E7E5E4] mx-auto mb-3" />
              <p className="text-sm text-[#A8A29E]">No calls logged yet.</p>
              <p className="text-xs text-[#D6D3D1]">Log your first call below.</p>
            </div>
          ) : (
            sortedLogs.map(log => (
              <div key={log.id} className="bg-white rounded-xl border border-[#E7E5E4] p-4">
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={log.status} />
                  <span className="text-xs text-[#A8A29E]">
                    {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-[#292524]">{log.notes}</p>
                {log.dealAmount !== undefined && log.dealAmount > 0 && (
                  <div className="mt-2 flex items-center gap-4 text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                    <span className="text-[#10B981]">Deal: {formatCurrency(log.dealAmount)}</span>
                    <span className="text-[#059669]">Received: {formatCurrency(log.amountReceived || 0)}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* New Call Form */}
        <div className="px-6 py-4 border-t border-[#E7E5E4] bg-[#FAFAF9]">
          <h4 className="text-sm font-semibold text-[#292524] mb-3">Log New Call</h4>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {statusPills.map(pill => (
              <button
                key={pill.value}
                onClick={() => setStatus(pill.value)}
                className="h-8 px-3 rounded-[10px] text-xs font-medium transition-all duration-150"
                style={{
                  backgroundColor: status === pill.value ? pill.color : '#F5F5F4',
                  color: status === pill.value ? '#fff' : '#78716C',
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)] resize-none mb-3"
            rows={2}
            placeholder="Call notes..."
          />
          {status === 'deal_closed' && (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="number"
                value={dealAmount}
                onChange={e => setDealAmount(e.target.value)}
                className="h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
                placeholder="Deal Amount (₹)"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
              <input
                type="number"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value)}
                className="h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
                placeholder="Received (₹)"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              />
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!notes.trim()}
            className="w-full h-10 rounded-[10px] bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Log Call
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DELETE CONFIRM MODAL
   ═══════════════════════════════════════════ */
function DeleteConfirmModal({ client, onConfirm, onClose }: {
  client: Client; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/35" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
          </div>
          <h3 className="text-base font-semibold text-[#292524]">Delete Client</h3>
        </div>
        <p className="text-sm text-[#78716C] mb-6">
          Are you sure you want to delete <strong className="text-[#292524]">{client.fullName}</strong>? This action cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="h-10 px-5 rounded-[10px] border border-[#E7E5E4] text-sm font-medium text-[#292524] hover:bg-[#FAFAF9] transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="h-10 px-5 rounded-[10px] bg-[#EF4444] text-white text-sm font-medium hover:bg-[#DC2626] active:scale-[0.97] transition-all duration-150">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CLIENTS PAGE
   ═══════════════════════════════════════════ */
function ClientsPage({ clients, onAdd, onUpdate, onDelete, onLogCall }: {
  clients: Client[];
  onAdd: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
  onLogCall: (clientId: string, data: any) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientStatus | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [callClient, setCallClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filters: { value: ClientStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'new', label: 'New' },
    { value: 'interested', label: 'Interested' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'deal_closed', label: 'Deal Closed' },
    { value: 'not_interested', label: 'Not Interested' },
  ];

  const filtered = useMemo(() => {
    let result = clients;
    if (filter !== 'all') result = result.filter(c => c.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.fullName.toLowerCase().includes(q) ||
        c.mobileNumber.includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.ivrsNumber.toLowerCase().includes(q)
      );
    }
    return result;
  }, [clients, filter, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[26px] font-semibold text-[#292524]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Clients</h1>
          <span className="bg-[#F3F4F6] text-[#6B7280] text-[11px] font-medium px-2 py-0.5 rounded-full">{clients.length}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-60 h-10 pl-9 pr-4 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
              placeholder="Search clients..."
            />
          </div>
          <button
            onClick={() => { setEditClient(null); setShowModal(true); }}
            className="h-10 px-4 rounded-[10px] bg-[#F97316] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#EA580C] active:scale-[0.97] transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {filters.map(f => {
          const count = f.value === 'all' ? clients.length : clients.filter(c => c.status === f.value).length;
          return (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={`h-9 px-4 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                filter === f.value
                  ? 'bg-[#F97316] text-white'
                  : 'text-[#A8A29E] hover:bg-[#F5F5F4]'
              }`}
            >
              {f.label} <span className={filter === f.value ? 'text-white/70' : ''}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-[#FAFAF9] text-left">
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E] w-12">#</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E]">Name</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E]">Mobile</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E]">IVRS</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E]">Address</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E]">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E]">Deal Amount</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E]">Received</th>
                <th className="px-4 py-3 text-xs font-medium text-[#A8A29E] w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((client, idx) => {
                const progress = client.dealAmount > 0 ? (client.amountReceived / client.dealAmount) * 100 : 0;
                return (
                  <tr key={client.id} className="border-b border-[#E7E5E4] hover:bg-[#FAFAF9] transition-colors">
                    <td className="px-4 py-3.5 text-xs text-[#A8A29E]">{(page - 1) * perPage + idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-sm font-medium text-[#292524]">{client.fullName}</div>
                      {client.contactNumber && (
                        <div className="text-xs text-[#A8A29E]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatPhone(client.contactNumber)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#4B5563]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{formatPhone(client.mobileNumber)}</td>
                    <td className="px-4 py-3.5 text-sm text-[#A8A29E]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{client.ivrsNumber || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-[#4B5563] max-w-[180px] truncate">{client.address || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={client.status}
                        clickable
                        onChange={(s) => onUpdate(client.id, { status: s })}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: client.dealAmount > 0 ? '#10B981' : '#A8A29E' }}>
                      {client.dealAmount > 0 ? formatCurrency(client.dealAmount) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      {client.dealAmount > 0 ? (
                        <div>
                          <span className="text-xs font-medium text-[#10B981]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                            {formatCurrency(client.amountReceived)}
                          </span>
                          <div className="w-20 h-1 bg-[#E7E5E4] rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-[#10B981] rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-[#A8A29E]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => setCallClient(client)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#3B82F6] hover:bg-[#EFF6FF] transition-colors"
                          title="Call Log"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditClient(client); setShowModal(true); }}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A8A29E] hover:bg-[#F5F5F4] transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteClient(client)}
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-[#A8A29E] hover:text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-[#E7E5E4] mx-auto mb-3" />
            <p className="text-sm text-[#A8A29E]">No clients found</p>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[#E7E5E4] flex items-center justify-end gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 px-3 rounded-lg border border-[#E7E5E4] text-xs font-medium text-[#292524] hover:bg-[#FAFAF9] disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  p === page ? 'bg-[#F97316] text-white' : 'text-[#78716C] hover:bg-[#F5F5F4]'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-8 px-3 rounded-lg border border-[#E7E5E4] text-xs font-medium text-[#292524] hover:bg-[#FAFAF9] disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <ClientModal
          client={editClient}
          onSave={(data) => {
            if (editClient) {
              onUpdate(editClient.id, data);
            } else {
              onAdd(data);
            }
          }}
          onClose={() => { setShowModal(false); setEditClient(null); }}
        />
      )}
      {callClient && (
        <CallLogDrawer
          client={callClient}
          onLogCall={onLogCall}
          onClose={() => setCallClient(null)}
        />
      )}
      {deleteClient && (
        <DeleteConfirmModal
          client={deleteClient}
          onConfirm={() => { onDelete(deleteClient.id); setDeleteClient(null); }}
          onClose={() => setDeleteClient(null)}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   IMPORT PAGE
   ═══════════════════════════════════════════ */
function ImportPage({ onImport }: { onImport: (clients: any[]) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'upload' | 'map' | 'done'>('upload');
  const [imported, setImported] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fieldOptions = [
    { value: '', label: '— Skip —' },
    { value: 'fullName', label: 'Full Name *' },
    { value: 'mobileNumber', label: 'Mobile Number *' },
    { value: 'ivrsNumber', label: 'IVRS Number' },
    { value: 'contactNumber', label: 'Contact Number' },
    { value: 'address', label: 'Address' },
    { value: 'status', label: 'Status' },
    { value: 'dealAmount', label: 'Deal Amount' },
    { value: 'amountReceived', label: 'Amount Received' },
  ];

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      if (json.length > 0) {
        const hdrs = json[0].map(h => String(h).trim());
        setHeaders(hdrs);
        setPreview(json.slice(1, 6));
        // Auto-map
        const auto: Record<string, string> = {};
        hdrs.forEach((h, i) => {
          const lower = h.toLowerCase();
          if (lower.includes('name') || lower === 'full name') auto[String(i)] = 'fullName';
          else if (lower.includes('mobile') || lower === 'phone') auto[String(i)] = 'mobileNumber';
          else if (lower.includes('ivrs')) auto[String(i)] = 'ivrsNumber';
          else if (lower.includes('contact') || lower === 'alt phone') auto[String(i)] = 'contactNumber';
          else if (lower.includes('address') || lower === 'location') auto[String(i)] = 'address';
          else if (lower.includes('status')) auto[String(i)] = 'status';
          else if (lower.includes('deal') || lower === 'amount') auto[String(i)] = 'dealAmount';
          else if (lower.includes('received') || lower === 'paid') auto[String(i)] = 'amountReceived';
        });
        setMapping(auto);
        setStep('map');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
      const rows = json.slice(1);
      let imp = 0, skip = 0;
      const toImport: any[] = [];

      rows.forEach(row => {
        const obj: Record<string, any> = { status: 'new', dealAmount: 0, amountReceived: 0 };
        headers.forEach((_, i) => {
          const field = mapping[String(i)];
          if (field && row[i] !== undefined) {
            const val = String(row[i]).trim();
            if (field === 'dealAmount' || field === 'amountReceived') {
              obj[field] = Number(val.replace(/[^0-9.]/g, '')) || 0;
            } else if (field === 'status') {
              const s = val.toLowerCase();
              if (s.includes('interested')) obj.status = 'interested';
              else if (s.includes('closed')) obj.status = 'deal_closed';
              else if (s.includes('not')) obj.status = 'not_interested';
              else if (s.includes('follow')) obj.status = 'follow_up';
              else obj.status = 'new';
            } else {
              obj[field] = val;
            }
          }
        });
        if (obj.fullName && obj.mobileNumber) {
          toImport.push(obj);
          imp++;
        } else {
          skip++;
        }
      });

      onImport(toImport);
      setImported(imp);
      setSkipped(skip);
      setStep('done');
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
      <h1 className="text-[26px] font-semibold text-[#292524] mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>Import from Excel</h1>

      {step === 'upload' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          className="bg-white rounded-xl border-2 border-dashed border-[#E7E5E4] hover:border-[#F97316] hover:bg-[#FFF7ED] transition-all duration-200 p-12 text-center cursor-pointer"
        >
          <Upload className="w-8 h-8 text-[#F97316] mx-auto mb-3" />
          <p className="text-sm text-[#292524] font-medium">Drop Excel file here or click to browse</p>
          <p className="text-xs text-[#A8A29E] mt-1">.xlsx, .xls</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>
      )}

      {step === 'map' && (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-[#292524]">{file?.name}</p>
              <p className="text-xs text-[#A8A29E]">{preview.length > 0 ? `${preview.length + 1} rows preview` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const auto: Record<string, string> = {};
                  headers.forEach((h, i) => {
                    const lower = h.toLowerCase();
                    if (lower.includes('name')) auto[String(i)] = 'fullName';
                    else if (lower.includes('mobile') || lower === 'phone') auto[String(i)] = 'mobileNumber';
                    else if (lower.includes('ivrs')) auto[String(i)] = 'ivrsNumber';
                    else if (lower.includes('contact')) auto[String(i)] = 'contactNumber';
                    else if (lower.includes('address')) auto[String(i)] = 'address';
                    else if (lower.includes('status')) auto[String(i)] = 'status';
                    else if (lower.includes('deal')) auto[String(i)] = 'dealAmount';
                    else if (lower.includes('received')) auto[String(i)] = 'amountReceived';
                  });
                  setMapping(auto);
                }}
                className="h-9 px-4 rounded-[10px] border border-[#E7E5E4] text-sm font-medium text-[#292524] hover:bg-[#FAFAF9] transition-colors"
              >
                Auto Map
              </button>
              <button
                onClick={handleImport}
                className="h-9 px-4 rounded-[10px] bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] transition-colors"
              >
                Import Clients
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#FAFAF9]">
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-xs font-medium text-[#A8A29E] min-w-[140px]">
                      <div className="mb-1">{h}</div>
                      <select
                        value={mapping[String(i)] || ''}
                        onChange={e => setMapping(prev => ({ ...prev, [String(i)]: e.target.value }))}
                        className="w-full h-8 px-2 rounded-lg border border-[#E7E5E4] text-xs bg-white outline-none focus:border-[#F97316]"
                      >
                        {fieldOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#E7E5E4]">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-xs text-[#4B5563] truncate max-w-[140px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#10B981]" />
          </div>
          <h3 className="text-lg font-semibold text-[#292524] mb-2">Import Complete</h3>
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-[#10B981]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{imported}</div>
              <div className="text-xs text-[#A8A29E]">Imported</div>
            </div>
            {skipped > 0 && (
              <div className="text-center">
                <div className="text-2xl font-semibold text-[#F59E0B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{skipped}</div>
                <div className="text-xs text-[#A8A29E]">Skipped</div>
              </div>
            )}
          </div>
          <button
            onClick={() => { setStep('upload'); setFile(null); setPreview([]); setHeaders([]); setMapping({}); }}
            className="h-10 px-5 rounded-[10px] bg-[#F97316] text-white text-sm font-medium hover:bg-[#EA580C] transition-colors"
          >
            Import Another File
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   SETTINGS PAGE
   ═══════════════════════════════════════════ */
function SettingsPage({ clients, onClear }: { clients: Client[]; onClear: () => void }) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = () => {
    const data = clients.map(c => ({
      'Full Name': c.fullName,
      'Mobile Number': c.mobileNumber,
      'IVRS Number': c.ivrsNumber,
      'Contact Number': c.contactNumber,
      'Address': c.address,
      'Status': STATUS_CONFIG[c.status].label,
      'Deal Amount': c.dealAmount,
      'Amount Received': c.amountReceived,
      'Created At': new Date(c.createdAt).toLocaleDateString('en-IN'),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, `solarcrm_clients_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-2xl space-y-6">
      <h1 className="text-[26px] font-semibold text-[#292524]" style={{ fontFamily: "'DM Sans', sans-serif" }}>Settings</h1>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-6">
        <h3 className="text-sm font-semibold text-[#292524] mb-4">General</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-[#292524]">Application Name</p>
              <p className="text-xs text-[#A8A29E]">Display name of the app</p>
            </div>
            <span className="text-sm font-medium text-[#78716C]">SolarCRM</span>
          </div>
          <div className="border-t border-[#E7E5E4]" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-[#292524]">Currency</p>
              <p className="text-xs text-[#A8A29E]">Default currency for deals</p>
            </div>
            <span className="text-sm font-medium text-[#78716C]">Indian Rupee (₹)</span>
          </div>
          <div className="border-t border-[#E7E5E4]" />
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-[#292524]">Date Format</p>
              <p className="text-xs text-[#A8A29E]">Display format for dates</p>
            </div>
            <span className="text-sm font-medium text-[#78716C]">DD/MM/YYYY</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-6">
        <h3 className="text-sm font-semibold text-[#292524] mb-4">Data Management</h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full h-11 rounded-[10px] border border-[#E7E5E4] text-sm font-medium text-[#292524] hover:bg-[#FAFAF9] transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="w-full h-11 rounded-[10px] border border-[#FECACA] text-sm font-medium text-[#EF4444] hover:bg-[#FEF2F2] transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] p-6">
        <h3 className="text-sm font-semibold text-[#292524] mb-2">About</h3>
        <p className="text-sm text-[#78716C]">SolarCRM v1.0</p>
        <p className="text-xs text-[#A8A29E] mt-1">A simple client management tool for solar sales teams.</p>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/35" onClick={() => setShowClearConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#FEF2F2] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
              </div>
              <h3 className="text-base font-semibold text-[#292524]">Clear All Data</h3>
            </div>
            <p className="text-sm text-[#78716C] mb-4">
              This will permanently delete all {clients.length} clients and their call history. This cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-[#A8A29E] mb-1.5">Type "DELETE" to confirm</label>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-[#E7E5E4] text-sm outline-none focus:border-[#EF4444] focus:ring-[3px] focus:ring-[rgba(239,68,68,0.1)]"
                placeholder="DELETE"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="h-10 px-5 rounded-[10px] border border-[#E7E5E4] text-sm font-medium text-[#292524] hover:bg-[#FAFAF9] transition-colors">
                Cancel
              </button>
              <button
                onClick={() => { if (confirmText === 'DELETE') { onClear(); setShowClearConfirm(false); setConfirmText(''); } }}
                disabled={confirmText !== 'DELETE'}
                className="h-10 px-5 rounded-[10px] bg-[#EF4444] text-white text-sm font-medium hover:bg-[#DC2626] disabled:opacity-40 transition-colors"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { clients, addClient, updateClient, deleteClient, addCallLog, importClients, clearAll } = useClientStore();

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleAddClient = (data: any) => {
    addClient(data);
    addToast('Client added successfully');
  };

  const handleUpdateClient = (id: string, data: any) => {
    updateClient(id, data);
    addToast('Client updated');
  };

  const handleDeleteClient = (id: string) => {
    deleteClient(id);
    addToast('Client deleted', 'info');
  };

  const handleLogCall = (clientId: string, data: any) => {
    addCallLog(clientId, data);
    addToast('Call logged successfully');
  };

  const handleImport = (newClients: any[]) => {
    importClients(newClients);
    addToast(`Imported ${newClients.length} clients`);
  };

  const pageTitle: Record<Page, string> = {
    dashboard: 'Dashboard',
    clients: 'Clients',
    import: 'Import',
    settings: 'Settings',
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <NavRail activePage={page} onNavigate={setPage} />

      <main className="ml-16 min-h-screen">
        {/* Top Bar */}
        <header className="h-[72px] bg-white border-b border-[#E7E5E4] px-8 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-[26px] font-semibold text-[#292524]" style={{ fontFamily: "'DM Sans', sans-serif" }}>{pageTitle[page]}</h1>
          </div>
          {page === 'clients' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A29E]" />
                <input
                  className="w-60 h-10 pl-9 pr-4 rounded-[10px] border border-[#E7E5E4] text-sm outline-none transition-all duration-150 focus:border-[#F97316] focus:ring-[3px] focus:ring-[rgba(249,115,22,0.1)]"
                  placeholder="Search clients..."
                />
              </div>
              <button className="h-10 px-4 rounded-[10px] bg-[#F97316] text-white text-sm font-medium flex items-center gap-2 hover:bg-[#EA580C] active:scale-[0.97] transition-all duration-150">
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            </div>
          )}
        </header>

        {/* Page Content */}
        <div className="p-8">
          {page === 'dashboard' && <DashboardPage clients={clients} />}
          {page === 'clients' && (
            <ClientsPage
              clients={clients}
              onAdd={handleAddClient}
              onUpdate={handleUpdateClient}
              onDelete={handleDeleteClient}
              onLogCall={handleLogCall}
            />
          )}
          {page === 'import' && <ImportPage onImport={handleImport} />}
          {page === 'settings' && <SettingsPage clients={clients} onClear={clearAll} />}
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
}
