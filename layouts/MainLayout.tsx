

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AiAssistant from '@/components/AiAssistant';
import ToastContainer from '@/components/ui/Toast';
import MedicalDisclaimerModal from '@/components/MedicalDisclaimerModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const hasSeenDisclaimer = sessionStorage.getItem('disclaimer_seen');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const handleDisclaimerAgree = () => {
    sessionStorage.setItem('disclaimer_seen', 'true');
    setShowDisclaimer(false);
  };


  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
            {children}
        </div>
        <ToastContainer />
        <AiAssistant />
        <MedicalDisclaimerModal isOpen={showDisclaimer} onAgree={handleDisclaimerAgree} />
      </main>
    </div>
  );
};

export default MainLayout;