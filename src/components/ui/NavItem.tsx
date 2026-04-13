import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export function NavItem({ 
  icon: Icon, 
  label, 
  active, 
  onClick, 
  horizontal, 
  badge 
}: { 
  icon: LucideIcon, 
  label: string, 
  active: boolean, 
  onClick: () => void, 
  horizontal?: boolean, 
  badge?: number 
}) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group",
        active 
          ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
        horizontal && "flex-col gap-1 px-2 py-2"
      )}
    >
      <div className={cn(
        "transition-transform group-hover:scale-110",
        active ? "text-white" : "text-slate-400 group-hover:text-blue-600"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={cn(
        "font-bold transition-colors",
        horizontal ? "text-[10px]" : "text-sm",
        active ? "text-white" : "text-slate-500 group-hover:text-slate-900"
      )}>
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className={cn(
          "absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-white",
          active ? "bg-white text-blue-600" : "bg-red-500 text-white"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}
