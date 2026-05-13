import { cn } from '@/lib/utils/cn';

export type BadgeVariant = 'emerald' | 'red' | 'amber' | 'blue' | 'violet' | 'gray';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-400 dark:ring-emerald-500/20',
  red:     'bg-red-50 text-red-700 ring-1 ring-red-600/20 dark:bg-red-950 dark:text-red-400 dark:ring-red-500/20',
  amber:   'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-400 dark:ring-amber-500/20',
  blue:    'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20 dark:bg-blue-950 dark:text-blue-400 dark:ring-blue-500/20',
  violet:  'bg-violet-50 text-violet-700 ring-1 ring-violet-600/20 dark:bg-violet-950 dark:text-violet-400 dark:ring-violet-500/20',
  gray:    'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-600/20',
};

const dotClasses: Record<BadgeVariant, string> = {
  emerald: 'bg-emerald-500 dark:bg-emerald-400',
  red:     'bg-red-500 dark:bg-red-400',
  amber:   'bg-amber-500 dark:bg-amber-400',
  blue:    'bg-blue-500 dark:bg-blue-400',
  violet:  'bg-violet-500 dark:bg-violet-400',
  gray:    'bg-zinc-400 dark:bg-zinc-500',
};

export function Badge({ variant = 'gray', children, className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[variant])} />
      )}
      {children}
    </span>
  );
}

// Helper para determinar variante según cantidad en stock
export function stockVariant(cantidad: number): BadgeVariant {
  if (cantidad === 0) return 'red';
  if (cantidad <= 5) return 'amber';
  return 'emerald';
}

export function stockLabel(cantidad: number): string {
  if (cantidad === 0) return 'Sin stock';
  if (cantidad <= 5) return 'Stock bajo';
  return 'Disponible';
}
