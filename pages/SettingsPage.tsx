

import React from 'react';
import { Link } from 'react-router-dom';
import { User, Shield, Bell, KeyRound, FileText, CreditCard, ExternalLink, Video } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const SettingsCard: React.FC<{ icon: React.ReactNode; title: string; description: string; children: React.ReactNode }> = ({ icon, title, description, children }) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6">
            <div className="flex items-center">
                <div className="flex-shrink-0 bg-sky-100 text-sky-600 rounded-lg p-3">
                    {icon}
                </div>
                <div className="ml-4">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{description}</p>
                </div>
            </div>
            <div className="mt-6">
                {children}
            </div>
        </div>
    </div>
);

const APP_SETTINGS_KEY = 'fisioflow_app_settings';

const getSettings = () => {
    try {
        const stored = localStorage.getItem(APP_SETTINGS_KEY);
        return stored ? JSON.parse(stored) : { teleconsultaEnabled: false };
    } catch {
        return { teleconsultaEnabled: false };
    }
};

const saveSettings = (settings: { teleconsultaEnabled: boolean }) => {
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('app-settings-changed'));
};


const SettingsPage: React.FC = () => {
    const [settings, setSettings] = React.useState(getSettings);
    
    const handleTeleconsultaToggle = (enabled: boolean) => {
        const newSettings = { ...settings, teleconsultaEnabled: enabled };
        setSettings(newSettings);
        saveSettings(newSettings);
    };

    return (
        <>
            <PageHeader
                title="Configurações"
                subtitle="Gerencie seu perfil, segurança e preferências de notificação."
            />

            <div className="space-y-8">
                <SettingsCard
                    icon={<User className="w-6 h-6" />}
                    title="Perfil"
                    description="Atualize suas informações pessoais e foto de perfil."
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-slate-700">Nome</label>
                            <input type="text" defaultValue="Dr. Roberto" className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email</label>
                            <input type="email" defaultValue="dr.roberto@fisioflow.com" className="mt-1 block w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md shadow-sm" />
                        </div>
                    </div>
                     <div className="text-right mt-4">
                        <button className="px-4 py-2 text-sm font-medium text-white bg-sky-500 border border-transparent rounded-lg hover:bg-sky-600">
                            Salvar Alterações
                        </button>
                    </div>
                </SettingsCard>
                
                <SettingsCard
                    icon={<Shield className="w-6 h-6" />}
                    title="Segurança"
                    description="Gerencie sua senha e autenticação de múltiplos fatores (MFA)."
                >
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <h4 className="font-semibold text-slate-800">Alterar Senha</h4>
                                <p className="text-sm text-slate-500">Recomendamos usar uma senha forte e única.</p>
                            </div>
                            <button className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                               <KeyRound className="w-4 h-4 mr-2"/> Alterar
                            </button>
                        </div>
                         <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <h4 className="font-semibold text-slate-800">Autenticação Multi-Fator (MFA)</h4>
                                <p className="text-sm text-slate-500">Adicione uma camada extra de segurança à sua conta. (Obrigatório por LGPD)</p>
                            </div>
                             <span className="text-sm font-semibold text-green-600">Ativado</span>
                        </div>
                    </div>
                </SettingsCard>

                 <SettingsCard
                    icon={<Video className="w-6 h-6" />}
                    title="Módulos"
                    description="Habilite ou desabilite funcionalidades opcionais da plataforma."
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                            <div>
                                <h4 className="font-semibold text-slate-800">Módulo de Teleconsulta</h4>
                                <p className="text-sm text-slate-500">Permite realizar atendimentos por vídeo. A ativação solicitará permissão de câmera e microfone.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={settings.teleconsultaEnabled}
                                    onChange={(e) => handleTeleconsultaToggle(e.target.checked)}
                                    className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard
                    icon={<CreditCard className="w-6 h-6" />}
                    title="Legal e Assinatura"
                    description="Consulte os termos de uso, política de privacidade e gerencie seu plano."
                >
                     <div className="space-y-4">
                        <Link to="/subscription" className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div>
                                <h4 className="font-semibold text-slate-800">Gerenciar Assinatura</h4>
                                <p className="text-sm text-slate-500">Visualize os detalhes do seu plano atual e opções de upgrade.</p>
                            </div>
                            <ExternalLink className="w-5 h-5 text-slate-500" />
                        </Link>
                         <Link to="/legal" className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div>
                                <h4 className="font-semibold text-slate-800">Termos e Privacidade</h4>
                                <p className="text-sm text-slate-500">Leia nossa Política de Privacidade e Termos de Uso.</p>
                            </div>
                             <ExternalLink className="w-5 h-5 text-slate-500" />
                        </Link>
                    </div>
                </SettingsCard>

                 <SettingsCard
                    icon={<Bell className="w-6 h-6" />}
                    title="Notificações"
                    description="Escolha como você deseja ser notificado sobre eventos importantes."
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Notificações por Email</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Lembretes de Consulta no App</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                            </label>
                        </div>
                    </div>
                </SettingsCard>
            </div>
        </>
    );
};

export default SettingsPage;
