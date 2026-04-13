import React, { useState } from 'react';
import { Plus, X, Tag } from 'lucide-react';

export function CustomFieldsSection({ 
  fields, 
  onChange, 
  suggestions = [] 
}: { 
  fields: { key: string, value: string }[], 
  onChange: (fields: { key: string, value: string }[]) => void,
  suggestions?: string[]
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addField = () => {
    if (!newKey.trim()) return;
    onChange([...fields, { key: newKey.trim(), value: newValue.trim() }]);
    setNewKey('');
    setNewValue('');
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Tag className="w-4 h-4 text-slate-400" />
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Campi Personalizzati</h4>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700">
              {field.key}
            </div>
            <input 
              className="flex-[2] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
              value={field.value}
              onChange={(e) => {
                const newFields = [...fields];
                newFields[index].value = e.target.value;
                onChange(newFields);
              }}
            />
            <button 
              type="button"
              onClick={() => removeField(index)}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <input 
            placeholder="Etichetta (es. RAM)"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            list="field-suggestions"
          />
          <datalist id="field-suggestions">
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="flex-[2] space-y-1">
          <input 
            placeholder="Valore (es. 16GB)"
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
        </div>
        <button 
          type="button"
          onClick={addField}
          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
