import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { Notification, Role } from '../types';
import * as notificationService from '../services/notificationService';
import { useToast } from '../contexts/ToastContext';
import { Bell, Send, CheckCheck, Loader, MessageSquare, Inbox, CalendarClock, ClipboardList, Megaphone, Dumbbell } from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';

// A simple time ago function for display
const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "agora mesmo";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
};

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'task_assigned': return <ClipboardList className="w-5 h-5 text-purple-500" />;
        case 'announcement': return <Megaphone className="w-5 h-5 text-amber-500" />;
        case 'appointment_reminder': return <CalendarClock className="w-5 h-5 text-sky-500" />;
        case 'exercise_reminder': return <Dumbbell className="w-5 h-5 text-teal-500" />;
        default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
}

const NotificationItem: React.FC<{ notification: Notification; onMarkAsRead: (id: string) => void }> = ({ notification, onMarkAsRead }) => {
    return (
        <div
            onClick={() => !notification.isRead && onMarkAsRead(notification.id)}
            className={`flex items-start p-4 border-b border-slate-200 transition-colors duration-200 ${!notification.isRead ? 'bg-sky-50/50 hover:bg-sky-100 cursor-pointer' : 'bg-white'}`}
        >
            <div className="flex-shrink-0 relative">
                {!notification.isRead && <span className="absolute -left-1 top-2 h-2 w-2 rounded-full bg-sky-500"></span>}
                <div className="p-2 bg-slate-100 rounded-full ml-2">
                    {getNotificationIcon(notification.type)}
                </div>
            </div>
            <div className="ml-4 flex-grow">
                <p className="text-sm text-slate-700">{notification.message}</p>
                <p className="text-xs text-slate-500 mt-1">{timeAgo(notification.createdAt)}</p>
            </div>
        </div>
    );
};

const BroadcastForm: React.FC<{ onSent: () => void }> = ({ onSent }) => {
    const [message, setMessage] = useState('');
    const [targetGroup, setTargetGroup] = useState<Role>(Role.Therapist);
    const [isSending, setIsSending] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) {
            showToast('A mensagem não pode estar vazia.', 'error');
            return;
        }
        setIsSending(true);
        try {
            await notificationService.sendBroadcast(message, targetGroup);
            showToast('Comunicado enviado com sucesso!', 'success');
            setMessage('');
            onSent();
        } catch (error) {
            showToast('Falha ao enviar comunicado.', 'error');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label htmlFor="broadcast-message" className="block text-sm font-medium text-slate-700">Mensagem</label>
                <textarea
                    id="broadcast-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                    placeholder="Digite seu comunicado aqui..."
                />
            </div>
            <div>
                <label htmlFor="target-group" className="block text-sm font-medium text-slate-700">Destinatários</label>
                <select
                    id="target-group"
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value as Role)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                >
                    <option value={Role.Therapist}>Todos os Fisioterapeutas</option>
                    <option value={Role.Patient}>Todos os Pacientes</option>
                    <option value={Role.EducadorFisico}>Todos os Educadores Físicos</option>
                </select>
            </div>
            <div className="text-right">
                <button
                    type="submit"
                    disabled={isSending}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-600 disabled:bg-teal-300"
                >
                    {isSending ? <Loader className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                    {isSending ? 'Enviando...' : 'Enviar Comunicado'}
                </button>
            </div>
        </form>
    );
};


const NotificationCenterPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'my' | 'broadcast'>('my');
    const { user } = useAuth();
    const { notifications, isLoading, unreadCount, markAsRead, markAllAsRead, refetch } = useNotifications(user?.id);

    return (
        <>
            <PageHeader
                title="Centro de Notificações"
                subtitle="Acompanhe suas mensagens e envie comunicados para a equipe."
            />
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-200">
                    <nav className="flex space-x-4 px-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('my')} className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'my' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            <Bell className="w-5 h-5 mr-2" />
                            Minhas Notificações {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadCount}</span>}
                        </button>
                        {user?.role === Role.Admin && (
                            <button onClick={() => setActiveTab('broadcast')} className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'broadcast' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                                <MessageSquare className="w-5 h-5 mr-2" />
                                Enviar Comunicado
                            </button>
                        )}
                    </nav>
                </div>
                
                {activeTab === 'my' && (
                    <div>
                        <div className="p-4 flex justify-end border-b border-slate-200">
                            <button onClick={markAllAsRead} disabled={unreadCount === 0} className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-800 disabled:text-slate-400 disabled:cursor-not-allowed">
                                <CheckCheck className="w-5 h-5 mr-2" />
                                Marcar todas como lidas
                            </button>
                        </div>
                        {isLoading ? (
                             Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                        ) : notifications.length > 0 ? (
                            <div className="divide-y divide-slate-200">
                                {notifications.map(n => <NotificationItem key={n.id} notification={n} onMarkAsRead={markAsRead} />)}
                            </div>
                        ) : (
                            <div className="text-center p-12">
                                <Inbox className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-700">Caixa de entrada vazia</h3>
                                <p className="text-slate-500 mt-1">Você não tem nenhuma notificação no momento.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'broadcast' && user?.role === Role.Admin && (
                    <BroadcastForm onSent={refetch} />
                )}
            </div>
        </>
    );
};

export default NotificationCenterPage;