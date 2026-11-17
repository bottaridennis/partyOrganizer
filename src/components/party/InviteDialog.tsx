import { useState } from 'react';
import { Check, Copy, Share2, UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useParty } from '../../lib/party-context';
import { inviteLink } from '../../lib/router';
import { useToast } from '../ui/Toast';

export function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { party } = useParty();
  const toast = useToast();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const link = inviteLink(party.inviteCode);

  const copy = async (what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(what === 'code' ? party.inviteCode : link);
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      toast.error('Copia non riuscita: seleziona il testo e copialo a mano.');
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: party.name, text: `Unisciti a "${party.name}" su Party Pantry! Codice: ${party.inviteCode}`, url: link });
    } catch {
      /* user cancelled */
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Invita amici"
      description="Chi entra con il codice resta in attesa finché un organizzatore non lo approva."
      icon={<div className="w-11 h-11 rounded-2xl bg-brand-soft text-brand grid place-items-center shrink-0"><UserPlus className="w-5 h-5" /></div>}
    >
      <div className="rounded-3xl bg-surface-2 p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-3">Codice invito</p>
        <p className="font-display text-4xl font-extrabold tracking-[0.25em] mt-2 tabular select-all">{party.inviteCode}</p>
        <Button variant="secondary" size="sm" className="mt-4" icon={copied === 'code' ? Check : Copy} onClick={() => copy('code')}>
          {copied === 'code' ? 'Copiato' : 'Copia codice'}
        </Button>
      </div>
      <div className="mt-4">
        <p className="text-sm font-semibold text-ink-2 mb-1.5">Oppure manda il link diretto</p>
        <div className="flex gap-2">
          <input readOnly value={link} onFocus={e => e.currentTarget.select()} className="flex-1 min-w-0 h-11 px-3 rounded-xl bg-surface border border-line text-sm text-ink-2 outline-none" />
          <Button variant="primary" icon={copied === 'link' ? Check : Copy} onClick={() => copy('link')}>{copied === 'link' ? 'Copiato' : 'Copia'}</Button>
        </div>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button variant="soft" block className="mt-3" icon={Share2} onClick={share}>Condividi…</Button>
        )}
      </div>
    </Modal>
  );
}
