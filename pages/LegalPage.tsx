
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
            <ShieldCheck className="w-6 h-6 mr-3 text-sky-500" /> {title}
        </h2>
        <div className="prose prose-slate max-w-none">
            {children}
        </div>
    </div>
);

const LegalPage: React.FC = () => {
    return (
        <>
            <PageHeader
                title="Termos e Privacidade"
                subtitle="Nossa política de privacidade e termos de uso do FisioFlow."
            />

            <div className="bg-white p-8 rounded-2xl shadow-sm">
                <Section title="Política de Privacidade">
                    <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                    <h4>1. INFORMAÇÕES QUE COLETAMOS</h4>
                    <ul>
                        <li><strong>Dados pessoais:</strong> nome, CPF, telefone, email</li>
                        <li><strong>Dados de saúde:</strong> histórico médico, evolução do tratamento</li>
                        <li><strong>Dados de uso:</strong> interações com o app, preferências</li>
                    </ul>
                    <h4>2. COMO USAMOS SUAS INFORMAÇÕES</h4>
                    <ul>
                        <li>Fornecer serviços de gestão de tratamento</li>
                        <li>Comunicação sobre consultas e exercícios</li>
                        <li>Melhorar nossos serviços</li>
                        <li>Cumprir obrigações legais</li>
                    </ul>
                    <h4>3. COMPARTILHAMENTO DE DADOS</h4>
                    <ul>
                        <li>Com seu fisioterapeuta responsável</li>
                        <li>Com parceiros de saúde autorizados por você</li>
                        <li>Nunca vendemos seus dados</li>
                    </ul>
                    <h4>4. SEGURANÇA</h4>
                    <ul>
                        <li>Criptografia AES-256</li>
                        <li>Servidores seguros no Brasil</li>
                        <li>Conformidade com LGPD</li>
                    </ul>
                    <h4>5. SEUS DIREITOS</h4>
                    <ul>
                        <li>Acessar seus dados</li>
                        <li>Corrigir informações</li>
                        <li>Solicitar exclusão</li>
                        <li>Portabilidade dos dados</li>
                    </ul>
                    <h4>6. CONTATO</h4>
                    <p>Email: privacidade@fisioflow.com.br</p>
                    <p>DPO: João Silva - dpo@fisioflow.com.br</p>
                </Section>
                
                <Section title="Termos de Uso">
                    <p>Ao utilizar o FisioFlow, você concorda com estes termos. Este aplicativo é uma ferramenta para auxiliar no gerenciamento de tratamentos fisioterapêuticos e não substitui o julgamento clínico profissional. O uso indevido da plataforma pode resultar na suspensão da sua conta.</p>
                </Section>
            </div>
        </>
    );
};

export default LegalPage;
