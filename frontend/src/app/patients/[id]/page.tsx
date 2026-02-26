'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { NavigationBar } from '@/components/shared/navigation-bar';
import { PatientDetailPage } from '@/components/patients/patient-detail-page';

interface PatientDetailPageProps {
  params: {
    id: string;
  };
}

export default function PatientDetailRoute({ params }: PatientDetailPageProps) {
  const router = useRouter();
  const { isAuthenticated, isInitializing, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isInitializing, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavigationBar />
      <div className="flex-1">
        <PatientDetailPage patientId={params.id} />
      </div>
    </div>
  );
}
