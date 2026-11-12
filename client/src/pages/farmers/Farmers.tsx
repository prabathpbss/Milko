import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Download, Plus, Search, Upload, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { FilterChips } from '@/components/ui/Tabs';
import { Avatar } from '@/components/ui/misc';
import { centers, farmers, regions, type Farmer } from '@/data/mock';
import { num } from '@/lib/format';
import { useToast } from '@/context/ToastContext';

type StatusFilter = 'all' | 'Active' | 'Pending' | 'Suspended';
const PAGE = 8;

function scoreTone(score: number) {
  if (score >= 85) return 'text-emerald-700';
  if (score >= 70) return 'text-zinc-800';
  return 'text-red-700';
}

export default function Farmers() {
  const navigate = useNavigate();
  const toast = useToast();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [q, setQ] = useState('');
  const [region, setRegion] = useState('');
  const [center, setCenter] = useState('');
  const [category, setCategory] = useState('');
  const [contract, setContract] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return farmers.filter(
      (f) =>
        (status === 'all' || f.status === status) &&
        (!region || f.region === region) &&
        (!center || f.centerId === center) &&
        (!category || f.category === category) &&
        (!contract || f.contractStatus === contract) &&
        (!term || [f.name, f.id, f.nic, f.mobile].some((v) => v.toLowerCase().includes(term))),
    );
  }, [status, q, region, center, category, contract]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const count = (s: StatusFilter) => (s === 'all' ? farmers.length : farmers.filter((f) => f.status === s).length);
  const hasFilters = q || region || center || category || contract;

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Farmers' }]}
        title="Farmer & supplier list"
        description="Profiles, categories, contracts and performance for every registered supplier."
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => toast('Import template downloaded', 'info')}>
              <Upload className="h-4 w-4" /> Import
            </button>
            <button className="btn btn-secondary" onClick={() => toast(`Exported ${filtered.length} farmers to Excel`)}>
              <Download className="h-4 w-4" /> Export
            </button>
            <Link to="/onboarding" className="btn btn-primary">
              <Plus className="h-4 w-4" /> Register farmer
            </Link>
          </>
        }
      />

      <div className="mb-4">
        <FilterChips<StatusFilter>
          value={status}
          onChange={(s) => {
            setStatus(s);
            setPage(0);
          }}
          options={[
            { id: 'all', label: 'All', count: count('all') },
            { id: 'Active', label: 'Active', count: count('Active') },
            { id: 'Pending', label: 'Pending verification', count: count('Pending') },
            { id: 'Suspended', label: 'Suspended', count: count('Suspended') },
          ]}
        />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-zinc-100 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="relative lg:col-span-2">
            <span className="sr-only">Search</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              className="input pl-9"
              placeholder="Name, farmer ID, NIC or mobile"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
            />
          </label>
          <select className="input" aria-label="Region" value={region} onChange={(e) => { setRegion(e.target.value); setPage(0); }}>
            <option value="">All regions</option>
            {regions.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select className="input" aria-label="Collection center" value={center} onChange={(e) => { setCenter(e.target.value); setPage(0); }}>
            <option value="">All centers</option>
            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" aria-label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }}>
            <option value="">All categories</option>
            {['Platinum', 'Gold', 'Silver', 'Standard'].map((c) => <option key={c}>{c}</option>)}
          </select>
          <select className="input" aria-label="Contract" value={contract} onChange={(e) => { setContract(e.target.value); setPage(0); }}>
            <option value="">Any contract</option>
            <option value="Valid">Valid</option>
            <option value="Expiring">Expiring in 30 days</option>
            <option value="Expired">Expired</option>
          </select>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 bg-zinc-900 px-4 py-2.5 text-sm text-white">
            <span className="mr-2 font-medium">{selected.size} selected</span>
            {['Change category', 'Send SMS', 'Renew contracts', 'Push to ERP'].map((a) => (
              <button
                key={a}
                className="btn btn-sm border border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => {
                  toast(`${a}: ${selected.size} farmers queued`);
                  setSelected(new Set());
                }}
              >
                {a}
              </button>
            ))}
            <button className="btn btn-sm ml-auto text-zinc-300 hover:text-white" onClick={() => setSelected(new Set())}>
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          </div>
        )}

        <DataTable<Farmer>
          rows={rows}
          rowKey={(f) => f.id}
          onRowClick={(f) => navigate(`/farmers/${f.id}`)}
          empty={
            <span>
              No farmers match these filters.{' '}
              {hasFilters && (
                <button
                  className="font-medium text-brand-700 hover:underline"
                  onClick={() => {
                    setQ(''); setRegion(''); setCenter(''); setCategory(''); setContract('');
                  }}
                >
                  Clear filters
                </button>
              )}
            </span>
          }
          columns={[
            {
              key: 'sel',
              header: (
                <input
                  type="checkbox"
                  aria-label="Select all on page"
                  className="h-4 w-4 accent-brand-600"
                  checked={allOnPage}
                  onChange={() =>
                    setSelected((s) => {
                      const n = new Set(s);
                      rows.forEach((r) => (allOnPage ? n.delete(r.id) : n.add(r.id)));
                      return n;
                    })
                  }
                />
              ),
              render: (f) => (
                <input
                  type="checkbox"
                  aria-label={`Select ${f.name}`}
                  className="h-4 w-4 accent-brand-600"
                  checked={selected.has(f.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggle(f.id)}
                />
              ),
            },
            {
              key: 'name',
              header: 'Farmer',
              render: (f) => (
                <div className="flex items-center gap-3">
                  <Avatar name={f.name} size="sm" />
                  <div>
                    <Link
                      to={`/farmers/${f.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-zinc-900 hover:text-brand-700"
                    >
                      {f.name}
                    </Link>
                    <div className="num text-xs text-zinc-500">{f.id}</div>
                  </div>
                </div>
              ),
            },
            {
              key: 'center',
              header: 'Center',
              render: (f) => (
                <div>
                  <div>{f.center}</div>
                  <div className="text-xs text-zinc-500">Route {f.route}</div>
                </div>
              ),
            },
            { key: 'cat', header: 'Category', render: (f) => <Badge tone={f.category === 'Platinum' || f.category === 'Gold' ? 'brand' : 'neutral'}>{f.category}</Badge> },
            { key: 'cows', header: 'Milking cows', align: 'right', mono: true, render: (f) => f.milkingCows },
            { key: 'l', header: 'Avg L / day', align: 'right', mono: true, render: (f) => num(f.avgLitres, 1) },
            {
              key: 'q',
              header: 'Quality',
              align: 'right',
              render: (f) => <span className={`num font-medium ${scoreTone(f.qualityScore)}`}>{f.qualityScore || '—'}</span>,
            },
            { key: 'rel', header: 'Reliability', align: 'right', mono: true, render: (f) => (f.reliability ? `${f.reliability}%` : '—') },
            {
              key: 'contract',
              header: 'Contract',
              render: (f) => (
                <div className="flex flex-col items-start gap-0.5">
                  <StatusBadge status={f.contractStatus} />
                  <span className="text-xs text-zinc-500">{f.contractEnd}</span>
                </div>
              ),
            },
            {
              key: 'erp',
              header: 'ERP vendor',
              render: (f) => (f.erpVendor ? <span className="num text-xs">{f.erpVendor}</span> : <Badge tone="warning">Not synced</Badge>),
            },
            { key: 'status', header: 'Status', render: (f) => <StatusBadge status={f.status} /> },
          ]}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 text-sm text-zinc-500">
          <span>
            Showing {filtered.length === 0 ? 0 : page * PAGE + 1}–{Math.min(filtered.length, (page + 1) * PAGE)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="num text-xs">
              {page + 1} / {pages}
            </span>
            <button className="btn btn-secondary btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </Card>
    </>
  );
}
