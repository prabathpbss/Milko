import { useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, Database, Loader2, PlugZap, Save, Server, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Field, FormGrid } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/misc';
import { erpSystems as seedSystems, syncObjects as seedObjects, type ErpKey, type SyncObject } from '@/data/mock';
import { useToast } from '@/context/ToastContext';

type TestState = 'idle' | 'running' | 'done';

const testSteps = ['Sign in', 'Read business partners', 'Read items', 'Post a test document (rolled back)'];

function SapB1Form() {
  return (
    <FormGrid>
      <Field label="Service Layer URL" className="sm:col-span-2">
        <input className="input" defaultValue="https://sapb1.milco.lk:50000/b1s/v1" />
      </Field>
      <Field label="Company database"><input className="input" defaultValue="MILCO_LIVE" /></Field>
      <Field label="Username"><input className="input" defaultValue="milco_integration" /></Field>
      <Field label="Password" hint="Stored encrypted on the server"><input className="input" type="password" defaultValue="placeholder" /></Field>
      <Field label="Database type">
        <select className="input"><option>SAP HANA</option><option>Microsoft SQL Server</option></select>
      </Field>
      <Field label="B1 version"><select className="input"><option>10.0 FP 2405</option><option>10.0 FP 2311</option></select></Field>
      <Field label="Default branch (BPL)"><select className="input"><option>1 · Head Office</option></select></Field>
      <Field label="Session timeout (minutes)"><input className="input num" defaultValue="30" /></Field>
    </FormGrid>
  );
}

function OdooForm() {
  return (
    <FormGrid>
      <Field label="Odoo URL" className="sm:col-span-2"><input className="input" defaultValue="https://erp.milco.lk" /></Field>
      <Field label="Database"><input className="input" defaultValue="milco_prod" /></Field>
      <Field label="Login"><input className="input" defaultValue="integration@milco.lk" /></Field>
      <Field label="API key" hint="Settings › Users › API keys in Odoo"><input className="input" type="password" defaultValue="placeholder" /></Field>
      <Field label="Protocol"><select className="input"><option>JSON-RPC</option><option>XML-RPC</option></select></Field>
      <Field label="Odoo version"><select className="input"><option>17.0 Enterprise</option><option>16.0</option><option>18.0</option></select></Field>
      <Field label="Company"><select className="input"><option>Milk Industries of Lanka</option></select></Field>
      <Field label="Vendor bill journal"><select className="input"><option>BILL · Vendor bills</option></select></Field>
    </FormGrid>
  );
}

function S4Form() {
  return (
    <FormGrid>
      <Field label="API host" className="sm:col-span-2"><input className="input" placeholder="https://my000000-api.s4hana.cloud.sap" /></Field>
      <Field label="Deployment">
        <select className="input"><option>S/4HANA Cloud, public edition</option><option>S/4HANA on-premise (Cloud Connector)</option></select>
      </Field>
      <Field label="Authentication">
        <select className="input"><option>OAuth 2.0 client credentials</option><option>Basic (communication user)</option><option>X.509 certificate</option></select>
      </Field>
      <Field label="Client ID"><input className="input" placeholder="Communication user or client ID" /></Field>
      <Field label="Client secret"><input className="input" type="password" placeholder="••••••••" /></Field>
      <Field label="Token URL" className="sm:col-span-2"><input className="input" placeholder="https://…/oauth/token" /></Field>
      <Field label="Communication arrangement"><input className="input" placeholder="SAP_COM_0008" /></Field>
      <Field label="Company code"><input className="input" placeholder="1000" /></Field>
    </FormGrid>
  );
}

export default function ErpConnectors() {
  const toast = useToast();
  const [systems, setSystems] = useState(seedSystems);
  const [selected, setSelected] = useState<ErpKey>('sapb1');
  const [objects, setObjects] = useState<SyncObject[]>(seedObjects);
  const [test, setTest] = useState<TestState>('idle');
  const [testIndex, setTestIndex] = useState(0);
  const [retries, setRetries] = useState('5');

  const erp = systems.find((s) => s.key === selected)!;
  const configured = erp.status !== 'Not configured';

  const runTest = () => {
    setTest('running');
    setTestIndex(0);
    testSteps.forEach((_, i) =>
      window.setTimeout(() => {
        setTestIndex(i + 1);
        if (i === testSteps.length - 1) {
          setTest('done');
          if (!configured) setSystems((s) => s.map((x) => (x.key === selected ? { ...x, status: 'Inactive', note: 'Tested just now, passed' } : x)));
          toast(`${erp.name}: connection test passed`);
        }
      }, 450 * (i + 1)),
    );
  };

  const activate = () => {
    setSystems((s) => s.map((x) => ({ ...x, status: x.key === selected ? 'Active' : x.status === 'Active' ? 'Inactive' : x.status })));
    toast(`${erp.name} is now the active ERP. New documents will post there.`);
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: 'Administration' }, { label: 'ERP connectors' }]}
        title="ERP integration"
        description="Choose the ERP this MILCO system posts to. One connector is active at a time; others can be set up and tested ahead of a switch."
        actions={
          <Link to="/erp/sync" className="btn btn-secondary">
            Field mapping & sync log
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {systems.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              setSelected(s.key);
              setTest('idle');
            }}
            className={clsx(
              'card flex flex-col gap-3 p-5 text-left transition',
              s.key === selected ? 'border-brand-600 ring-2 ring-brand-600' : 'hover:border-zinc-300',
            )}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
                {s.key === 'odoo' ? <Database className="h-5 w-5" /> : <Server className="h-5 w-5" />}
              </span>
              <StatusBadge status={s.status} />
            </span>
            <span>
              <span className="block text-base font-semibold">{s.name}</span>
              <span className="block text-sm text-zinc-500">
                {s.protocol} · {s.version}
              </span>
            </span>
            <span className="text-xs text-zinc-500">{s.note}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={`${erp.name} connection`}
            subtitle={erp.protocol}
            actions={erp.status === 'Active' ? <Badge tone="success" dot>Active connector</Badge> : undefined}
          />
          <CardBody className="space-y-6">
            {selected === 'sapb1' && <SapB1Form />}
            {selected === 'odoo' && <OdooForm />}
            {selected === 's4hana' && <S4Form />}
            <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-5">
              <button className="btn btn-secondary" onClick={() => toast('Connection settings saved')}>
                <Save className="h-4 w-4" /> Save
              </button>
              <button className="btn btn-secondary" onClick={runTest} disabled={test === 'running'}>
                {test === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} Test connection
              </button>
              <button className="btn btn-primary" onClick={activate} disabled={erp.status === 'Active' || erp.status === 'Not configured'}>
                Set as active ERP
              </button>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Connection test" subtitle={test === 'idle' ? 'Not run in this session' : test === 'running' ? 'Running…' : 'Finished'} />
            <ul className="divide-y divide-zinc-100">
              {testSteps.map((t, i) => {
                const done = testIndex > i;
                const running = test === 'running' && testIndex === i;
                return (
                  <li key={t} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span>{t}</span>
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : running ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-zinc-200" />
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Retry & alerts" />
            <CardBody className="space-y-4">
              <Field label="Retries on failure">
                <input className="input num" value={retries} onChange={(e) => setRetries(e.target.value)} />
              </Field>
              <Field label="Back-off">
                <select className="input"><option>Exponential, max 30 minutes</option><option>Fixed, every 5 minutes</option></select>
              </Field>
              <Field label="Alert email">
                <input className="input" defaultValue="erp-support@milco.lk" />
              </Field>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title={`What syncs with ${erp.name}`} subtitle="Direction, ERP object and schedule for each record type" />
        <DataTable<SyncObject>
          rows={objects}
          rowKey={(o) => o.id}
          columns={[
            { key: 'name', header: 'Record', render: (o) => <span className="font-medium">{o.name}</span> },
            { key: 'milco', header: 'In MILCO', className: 'text-zinc-600' },
            { key: 'dir', header: 'Direction', render: (o) => <Badge tone={o.direction === 'Both ways' ? 'info' : 'neutral'}>{o.direction}</Badge> },
            { key: 'target', header: `${erp.name} object`, render: (o) => <span className="num text-[13px]">{o.target[selected]}</span> },
            { key: 'when', header: 'When' },
            {
              key: 'on',
              header: 'Enabled',
              render: (o) => (
                <Toggle
                  label={`Sync ${o.name}`}
                  checked={o.enabled}
                  onChange={(v) => setObjects((all) => all.map((x) => (x.id === o.id ? { ...x, enabled: v } : x)))}
                />
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
