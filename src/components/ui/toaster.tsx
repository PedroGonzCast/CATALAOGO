'use client';

import { useToast, type Toast } from '@/contexts/toast-context';
import { cn } from '@/lib/utils/cn';

const CONFIG = {
  success: {
    bar: 'bg-emerald-500',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    colors: 'bg-white border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  error: {
    bar: 'bg-red-500',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    colors: 'bg-white border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400',
  },
  warning: {
    bar: 'bg-amber-500',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    colors: 'bg-white border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
  info: {
    bar: 'bg-blue-500',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    colors: 'bg-white border border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100',
    iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
} as const;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const cfg = CONFIG[toast.type];
  return (
    <div className={cn(
      'animate-slide-up relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl px-4 py-3 shadow-lg',
      cfg.colors
    )}>
      <div className={cn('absolute left-0 top-0 h-full w-1', cfg.bar)} />
      <div className={cn('mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full', cfg.iconBg)}>
        {cfg.icon}
      </div>
      <p className="flex-1 text-sm font-medium leading-5">{toast.message}</p>
      <button
        onClick={onDismiss}
        className="mt-0.5 flex-shrink-0 rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
        aria-label="Cerrar"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}
