import React from 'react';
import PatientSidebar from '../components/patient-portal/PatientSidebar';
import ToastContainer from '../components/ui/Toast';

interface PatientPortalLayoutProps {
  children: React.ReactNode;
}

const PatientPortalLayout: React.FC<PatientPortalLayoutProps> = ({
  children,
}) => {
  return (
    <div className='flex h-screen bg-slate-50'>
      <PatientSidebar />
      <main className='flex-1 flex flex-col overflow-hidden'>
        <div className='flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8'>
          {children}
        </div>
        <ToastContainer />
      </main>
    </div>
  );
};

export default PatientPortalLayout;
