import React from 'react';

interface PacientesLayoutProps {
  children: React.ReactNode;
}

const PacientesLayout: React.FC<PacientesLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
};

export default PacientesLayout;