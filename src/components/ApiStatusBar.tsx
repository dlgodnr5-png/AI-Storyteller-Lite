import React from 'react';

type Item = {
  key: string;
  label: string;
  on: boolean;
  colorOn: string;
};

type Props = {
  items: Item[];
};

export default function ApiStatusBar({ items }: Props) {
  const onCount = items.filter(item => item.on).length;
  return (
    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
      <span className="text-[9px] font-mono text-slate-400">{onCount}/{items.length}</span>
      {items.map(item => (
        <div key={item.key} className="group relative flex items-center justify-center">
          <span
            className={`w-2.5 h-2.5 rounded-full transition-all ${item.on ? `${item.colorOn} shadow-[0_0_10px_rgba(255,255,255,0.45)]` : 'bg-slate-600/60'}`}
          />
          <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="whitespace-nowrap px-2 py-1 rounded-md border border-white/10 bg-black/85 text-[10px] text-slate-200">
              {item.label} · {item.on ? 'ON' : 'OFF'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
