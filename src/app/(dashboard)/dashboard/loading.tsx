import { DashboardSkeleton } from '@/components/ui/skeleton';

// Next.js muestra este componente automáticamente mientras
// el Server Component (page.tsx) está haciendo fetch a FileMaker.
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
