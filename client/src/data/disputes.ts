/**
 * Shared dispute & complaint list. The farmer portal adds to it; the Quality & disputes screen
 * and the farmer profile read from it, so a farmer's submission shows up for staff straight away.
 */
import { createStore, useStore } from '@/lib/store';
import { disputes as seed, type Dispute } from '@/data/mock';

export const disputeStore = createStore<Dispute[]>(seed);
export const useDisputes = () => useStore(disputeStore);

/** Response target (hours) and first owner team per category. */
export const DISPUTE_ROUTING: Record<Dispute['category'], { sla: number; owner: string }> = {
  Quality: { sla: 48, owner: 'QA · not assigned' },
  Payment: { sla: 72, owner: 'Finance · not assigned' },
  Delivery: { sla: 48, owner: 'Logistics · not assigned' },
  Service: { sla: 120, owner: 'Center supervisor' },
};

/** The demo data's "today" (collection and payment sample data run to 12 Nov 2026). */
const TODAY = '12 Nov';

export function raiseDispute(
  input: Pick<Dispute, 'farmer' | 'farmerId' | 'kind' | 'category' | 'summary' | 'value' | 'linked' | 'attachments'> & { channel: string },
): Dispute {
  const all = disputeStore.get();
  const max = Math.max(0, ...all.map((d) => Number(d.id.split('-').pop()) || 0));
  const prefix = input.kind === 'Complaint' ? 'CMP' : 'DSP';
  const time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const route = DISPUTE_ROUTING[input.category];
  const files = input.attachments ? ` with ${input.attachments} attachment${input.attachments > 1 ? 's' : ''}` : '';
  const d: Dispute = {
    id: `${prefix}-2026-${String(max + 1).padStart(4, '0')}`,
    farmer: input.farmer,
    farmerId: input.farmerId,
    kind: input.kind,
    category: input.category,
    raised: TODAY,
    owner: route.owner,
    slaHours: route.sla,
    status: 'New',
    summary: input.summary,
    value: input.value,
    linked: input.linked,
    attachments: input.attachments,
    timeline: [
      { time: `${TODAY} ${time}`, who: input.channel, text: `${input.kind ?? 'Dispute'} raised${files}.` },
      { time: `${TODAY} ${time}`, who: 'System', text: `Sent to ${route.owner}. Response target ${route.sla} h. Farmer notified by SMS.` },
    ],
  };
  disputeStore.set((xs) => [d, ...xs]);
  return d;
}
