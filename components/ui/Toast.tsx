
import React, { useEffect, useState } from 'react';
import { useInternalToast } from '../../contexts/ToastContext';
import { ToastMessage } from '../../types';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastIcons = {
  success: <CheckCircle className="w-6 h-6 text-green-500" />,
  error: <AlertTriangle className="w-6 h-6 text-red-500" />,
  info: <Info className="w-6 h-6 text-blue-500" />,
};

const ToastMessageComponent: React.FC<{ toast: ToastMessage, onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300); // Allow time for exit animation
        }, 4700);

        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);
    
    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    }

    return (
        <div className={`
            flex items-start p-4 w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
            transition-all duration-300 ease-in-out
            ${isExiting ? 'animate-toast-exit' : 'animate-toast-enter'}
        `}>
            <div className="flex-shrink-0">{ToastIcons[toast.type]}</div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className="text-sm font-medium text-slate-900">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button onClick={handleRemove} className="bg-white rounded-md inline-flex text-slate-400 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};


const ToastContainer: React.FC = () => {
  const context = useInternalToast();

  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <>
      <div aria-live="assertive" className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-end sm:justify-end z-[100]">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {toasts.map(toast => (
            <ToastMessageComponent key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
       <style>{`
            @keyframes toast-enter {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            @keyframes toast-exit {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            .animate-toast-enter { animation: toast-enter 0.3s ease-out forwards; }
            .animate-toast-exit { animation: toast-exit 0.3s ease-in forwards; }
        `}</style>
    </>
  );
};

export default ToastContainer;
