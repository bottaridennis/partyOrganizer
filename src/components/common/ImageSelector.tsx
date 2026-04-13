import React, { useState } from 'react';
import { Image as ImageIcon, Link as LinkIcon, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ImageSelector({ 
  images, 
  selected, 
  onSelect 
}: { 
  images: string[], 
  selected: string, 
  onSelect: (url: string) => void 
}) {
  const [customUrl, setCustomUrl] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Immagine Profilo / Icona</label>
        <button 
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
        >
          <LinkIcon className="w-3 h-3" />
          {showCustom ? 'Scegli predefinite' : 'Usa URL personalizzato'}
        </button>
      </div>

      {showCustom ? (
        <div className="flex gap-2">
          <input 
            type="url"
            placeholder="https://esempio.com/immagine.jpg"
            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
          />
          <button 
            type="button"
            onClick={() => onSelect(customUrl)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all"
          >
            Applica
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(url)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105",
                selected === url ? "border-blue-600 shadow-lg shadow-blue-100" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img src={url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {selected === url && (
                <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                  <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
          >
            <ImageIcon className="w-5 h-5" />
            <span className="text-[8px] font-bold uppercase">Altro</span>
          </button>
        </div>
      )}
    </div>
  );
}
