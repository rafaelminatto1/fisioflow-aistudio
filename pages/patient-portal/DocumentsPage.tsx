
// pages/patient-portal/DocumentsPage.tsx
import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Document } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import Skeleton from '../../components/ui/Skeleton';
import { FileText, Download, FileType, Receipt, TestTube2 } from 'lucide-react';
import { mockDocuments } from '../../data/mockData';

const getDocIcon = (type: Document['type']) => {
    switch(type) {
        case 'Atestado': return <FileType className="w-6 h-6 text-blue-500" />;
        case 'Recibo': return <Receipt className="w-6 h-6 text-green-500" />;
        case 'Exame': return <TestTube2 className="w-6 h-6 text-purple-500" />;
        default: return <FileText className="w-6 h-6 text-slate-500" />;
    }
}

const DocumentsPage: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const { showToast } = useToast();

    useEffect(() => {
        const fetchDocuments = async () => {
            if (!user?.patientId) return;
            setIsLoading(true);
            try {
                // Simulating API call
                await new Promise(res => setTimeout(res, 500));
                const data = mockDocuments.filter(d => d.patientId === user.patientId);
                setDocuments(data);
            } catch {
                showToast("Erro ao carregar seus documentos.", 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDocuments();
    }, [user, showToast]);

    return (
        <>
            <PageHeader
                title="Meus Documentos"
                subtitle="Acesse seus atestados, recibos e exames importantes."
            />

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Documento</th>
                                <th className="p-4 text-left text-xs font-medium text-slate-500 uppercase">Data de Emissão</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i}><td colSpan={3} className="p-4"><Skeleton className="h-10 w-full" /></td></tr>
                                ))
                            ) : documents.length > 0 ? (
                                documents.map(doc => (
                                    <tr key={doc.id} className="hover:bg-slate-50">
                                        <td className="p-4">
                                            <div className="flex items-center">
                                                {getDocIcon(doc.type)}
                                                <div className="ml-3">
                                                    <p className="font-semibold text-slate-800">{doc.name}</p>
                                                    <p className="text-sm text-slate-500">{doc.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600">{doc.issueDate}</td>
                                        <td className="p-4 text-right">
                                            <a href={doc.url} download className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-teal-500 hover:bg-teal-600">
                                                <Download className="w-4 h-4 mr-2" />
                                                Baixar
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="text-center p-12">
                                        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                                        <h3 className="text-lg font-semibold text-slate-700">Nenhum documento encontrado</h3>
                                        <p className="text-slate-500 mt-1">Seus documentos aparecerão aqui.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default DocumentsPage;