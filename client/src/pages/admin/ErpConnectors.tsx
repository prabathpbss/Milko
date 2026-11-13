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
import { useLang } from '@/i18n/LanguageContext';

type TestState = 'idle' | 'running' | 'done';

const testSteps = ['Sign in', 'Read business partners', 'Read items', 'Post a test document (rolled back)'];

function SapB1Form() {
  const { t } = useLang();
  return (
    <FormGrid>
      <Field label={t('Service Layer URL')} className="sm:col-span-2">
        <input className="input" defaultValue="https://sapb1.milco.lk:50000/b1s/v1" />
      </Field>
      <Field label={t('Company database')}><input className="input" defaultValue="MILCO_LIVE" /></Field>
      <Field label={t('Username')}><input className="input" defaultValue="milco_integration" /></Field>
      <Field label={t('Password')} hint={t('Stored encrypted on the server')}><input className="input" type="password" defaultValue="placeholder" /></Field>
      <Field label={t('Database type')}>
        <select className="input"><option>SAP HANA</option><option>Microsoft SQL Server</option></select>
      </Field>
      <Field label={t('B1 version')}><select className="input"><option>10.0 FP 2405</option><option>10.0 FP 2311</option></select></Field>
      <Field label={t('Default branch (BPL)')}><select className="input"><option value="1 · Head Office">{t('1 · Head Office')}</option></select></Field>
      <Field label={t('Session timeout (minutes)')}><input className="input num" defaultValue="30" /></Field>
    </FormGrid>
  );
}

function OdooForm() {
  const { t } = useLang();
  return (
    <FormGrid>
      <Field label={t('Odoo URL')} className="sm:col-span-2"><input className="input" defaultValue="https://erp.milco.lk" /></Field>
      <Field label={t('Database')}><input className="input" defaultValue="milco_prod" /></Field>
      <Field label={t('Login')}><input className="input" defaultValue="integration@milco.lk" /></Field>
      <Field label={t('API key')} hint={t('Settings › Users › API keys in Odoo')}><input className="input" type="password" defaultValue="placeholder" /></Field>
      <Field label={t('Protocol')}><select className="input"><option>JSON-RPC</option><option>XML-RPC</option></select></Field>
      <Field label={t('Odoo version')}><select className="input"><option>17.0 Enterprise</option><option>16.0</option><option>18.0</option></select></Field>
      <Field label={t('Company')}><select className="input"><option>Milk Industries of Lanka</option></select></Field>
      <Field label={t('Vendor bill journal')}><select className="input"><option>BILL · Vendor bills</option></select></Field>
    </FormGrid>
  );
}

function S4Form() {
  const { t } = useLang();
  return (
    <FormGrid>
      <Field label={t('API host')} className="sm:col-span-2"><input className="input" placeholder="https://my000000-api.s4hana.cloud.sap" /></Field>
      <Field label={t('Deployment')}>
        <select className="input"><option>S/4HANA Cloud, public edition</option><option>S/4HANA on-premise (Cloud Connector)</option></select>
      </Field>
      <Field label={t('Authentication')}>
        <select className="input"><option>OAuth 2.0 client credentials</option><option value="Basic (communication user)">{t('Basic (communication user)')}</option><option value="X.509 certificate">{t('X.509 certificate')}</option></select>
      </Field>
      <Field label={t('Client ID')}><input className="input" placeholder={t('Communication user or client ID')} /></Field>
      <Field label={t('Client secret')}><input className="input" type="password" placeholder="••••••••" /></Field>
      <Field label={t('Token URL')} className="sm:col-span-2"><input className="input" placeholder="https://…/oauth/token" /></Field>
      <Field label={t('Communication arrangement')}><input className="input" placeholder="SAP_COM_0008" /></Field>
      <Field label={t('Company code')}><input className="input" placeholder="1000" /></Field>
    </FormGrid>
  );
}

export default function ErpConnectors() {
  const toast = useToast();
  const { t } = useLang();
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
          toast(t('{name}: connection test passed', { name: erp.name }));
        }
      }, 450 * (i + 1)),
    );
  };

  const activate = () => {
    setSystems((s) => s.map((x) => ({ ...x, status: x.key === selected ? 'Active' : x.status === 'Active' ? 'Inactive' : x.status })));
    toast(t('{name} is now the active ERP. New documents will post there.', { name: erp.name }));
  };

  return (
    <>
      <PageHeader
        breadcrumb={[{ label: t('Administration') }, { label: t('ERP connectors') }]}
        title={t('ERP integration')}
        description={t('Choose the ERP this MILCO system posts to. One connector is active at a time; others can be set up and tested ahead of a switch.')}
        actions={
          <Link to="/erp/sync" className="btn btn-secondary">
            {t('Field mapping & sync log')}
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
            <span className="text-xs text-zinc-500">{t(s.note)}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t('{name} connection', { name: erp.name })}
            subtitle={erp.protocol}
            actions={erp.status === 'Active' ? <Badge tone="success" dot>{t('Active connector')}</Badge> : undefined}
          />
          <CardBody className="space-y-6">
            {selected === 'sapb1' && <SapB1Form />}
            {selected === 'odoo' && <OdooForm />}
            {selected === 's4hana' && <S4Form />}
            <div className="flex flex-wrap justify-end gap-2 border-t border-zinc-100 pt-5">
              <button className="btn btn-secondary" onClick={() => toast(t('Connection settings saved'))}>
                <Save className="h-4 w-4" /> {t('Save')}
              </button>
              <button className="btn btn-secondary" onClick={runTest} disabled={test === 'running'}>
                {test === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlugZap className="h-4 w-4" />} {t('Test connection')}
              </button>
              <button className="btn btn-primary" onClick={activate} disabled={erp.status === 'Active' || erp.status === 'Not configured'}>
                {t('Set as active ERP')}
              </button>
            </div>
          </CardBody>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title={t('Connection test')} subtitle={test === 'idle' ? t('Not run in this session') : test === 'running' ? t('Running…') : t('Finished')} />
            <ul className="divide-y divide-zinc-100">
              {testSteps.map((step, i) => {
                const done = testIndex > i;
                const running = test === 'running' && testIndex === i;
                return (
                  <li key={step} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                    <span>{t(step)}</span>
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
            <CardHeader title={t('Retry & alerts')} />
            <CardBody className="space-y-4">
              <Field label={t('Retries on failure')}>
                <input className="input num" value={retries} onChange={(e) => setRetries(e.target.value)} />
              </Field>
              <Field label={t('Back-off')}>
                <select className="input"><option value="Exponential, max 30 minutes">{t('Exponential, max 30 minutes')}</option><option value="Fixed, every 5 minutes">{t('Fixed, every 5 minutes')}</option></select>
              </Field>
              <Field label={t('Alert email')}>
                <input className="input" defaultValue="erp-support@milco.lk" />
              </Field>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader title={t('What syncs with {name}', { name: erp.name })} subtitle={t('Direction, ERP object and schedule for each record type')} />
        <DataTable<SyncObject>
          rows={objects}
          rowKey={(o) => o.id}
          columns={[
            { key: 'name', header: t('Record'), render: (o) => <span className="font-medium">{t(o.name)}</span> },
            { key: 'milco', header: t('In MILCO'), className: 'text-zinc-600', render: (o) => t(o.milco) },
            { key: 'dir', header: t('Direction'), render: (o) => <Badge tone={o.direction === 'Both ways' ? 'info' : 'neutral'}>{t(o.direction)}</Badge> },
            { key: 'target', header: t('{name} object', { name: erp.name }), render: (o) => <span className="num text-[13px]">{o.target[selected]}</span> },
            { key: 'when', header: t('When'), render: (o) => t(o.when) },
            {
              key: 'on',
              header: t('Enabled'),
              render: (o) => (
                <Toggle
                  label={t('Sync {name}', { name: t(o.name) })}
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
