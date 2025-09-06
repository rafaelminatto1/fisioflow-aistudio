import React from 'react';
import PartnerSidebar from '../src/components/partner-portal/PartnerSidebar';
import ToastContainer from '../src/components/ui/Toast';

interface PartnerLayoutProps {
  children: React.ReactNode;
}

const PartnerLayout: React.FC<PartnerLayoutProps> = ({ children }) => {
  return (
    <div className='flex h-screen bg-slate-50'>
      <PartnerSidebar />
      <main className='flex-1 flex flex-col overflow-hidden'>
        <div className='flex-1 overflow-x-hidden overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8'>
          {children}
        </div>
        <ToastContainer />
      </main>
    </div>
  );
};

export default PartnerLayout;
