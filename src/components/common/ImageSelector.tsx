import { useState } from 'react';
import { Check, ImageOff, Link2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Input } from '../ui/Field';

export function ImageSelector({ images, selected, onSelect, round }: { images: string[]; selected: string; onSelect: (url: string) => void; round?: boolean }) {
  const custom = !!selected && !images.includes(selected);
  const [showUrl, setShowUrl] = useState(custom);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
        <Option active={!selected} round={round} onClick={() => onSelect('')} label="Nessuna immagine">
          <ImageOff className="w-5 h-5 text-ink-3" />
        </Option>
        {images.map(url => (
          <Option key={url} active={selected === url} round={round} onClick={() => onSelect(url)} label="Immagine predefinita">
            <img src={url} alt="" loading="lazy" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </Option>
        ))}
        <Option active={custom || showUrl} round={round} onClick={() => setShowUrl(true)} label="Usa un link">
          <Link2 className="w-5 h-5 text-ink-3" />
        </Option>
      </div>
      {(showUrl || custom) && (
        <Input
          type="url"
          inputMode="url"
          placeholder="Incolla il link di un'immagine (https://…)"
          value={custom ? selected : ''}
          onChange={e => onSelect(e.target.value.trim())}
        />
      )}
    </div>
  );
}

function Option({ active, onClick, children, label, round }: { active: boolean; onClick: () => void; children: React.ReactNode; label: string; round?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'relative w-14 h-14 shrink-0 overflow-hidden grid place-items-center bg-surface-2 transition-all',
        round ? 'rounded-full' : 'rounded-2xl',
        active ? 'ring-[3px] ring-brand ring-offset-2 ring-offset-surface' : 'opacity-80 hover:opacity-100'
      )}
    >
      {children}
      {active && (
        <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-brand text-white grid place-items-center">
          <Check className="w-3 h-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
