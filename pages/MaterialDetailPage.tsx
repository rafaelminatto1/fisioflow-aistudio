
// pages/MaterialDetailPage.tsx
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { getMaterialById } from '../services/clinicalMaterialService';
import { generateClinicalMaterialContent } from '../services/geminiService';
import { ClinicalMaterialData } from '../types';
import PageHeader from '../components/PageHeader';
import MarkdownRenderer from '../components/ui/MarkdownRenderer';
import Skeleton from '../components/ui/Skeleton';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const mapCategoryToType = (categoryName: string): ClinicalMaterialData['tipo_material'] => {
  if (categoryName.includes('Avaliação')) return 'Escala de Avaliação';
  if (categoryName.includes('Protocolo')) return 'Protocolo Clínico';
  return 'Material de Orientação';
};

const MaterialDetailPage: React.FC = () => {
    const { id } = ReactRouterDOM.useParams<{ id: string }>();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [content, setContent] = useState('');
    const [pageTitle, setPageTitle] = useState('Carregando material...');

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            showToast('ID do material não encontrado.', 'error');
            setPageTitle('Erro');
            setContent('## Material não encontrado.');
            return;
        }

        const fetchMaterialContent = async () => {
            setIsLoading(true);
            try {
                const materialDetails = await getMaterialById(id);
                if (!materialDetails) {
                    throw new Error('Material não encontrado.');
                }
                setPageTitle(materialDetails.name);

                const materialType = mapCategoryToType(materialDetails.category.name);

                const generatedContent = await generateClinicalMaterialContent({
                    nome_material: materialDetails.name,
                    tipo_material: materialType,
                });
                setContent(generatedContent);

            } catch (err: any) {
                showToast(err.message || 'Falha ao carregar conteúdo do material.', 'error');
                setPageTitle('Erro ao carregar');
                setContent(`## Erro ao carregar conteúdo\n\nNão foi possível carregar os detalhes para este material. Por favor, tente novamente.`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMaterialContent();
    }, [id, showToast]);

    const renderLoading = () => (
         <div className="bg-white p-8 rounded-2xl shadow-sm animate-pulse">
            <Skeleton className="h-8 w-3/4 mb-6" />
            <Skeleton className="h-6 w-1/4 mb-4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6 mt-2" />
            <hr className="my-6 border-slate-100" />
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-20 w-full" />
             <hr className="my-6 border-slate-100" />
            <Skeleton className="h-6 w-1/2 mb-4" />
            <Skeleton className="h-16 w-full" />
        </div>
    );

    return (
        <>
            <PageHeader
                title={pageTitle}
                subtitle="Conteúdo detalhado do material da biblioteca clínica."
            >
                <ReactRouterDOM.Link
                    to="/materials"
                    className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <ChevronLeft className="-ml-1 mr-2 h-5 w-5" />
                    Voltar para Biblioteca
                </ReactRouterDOM.Link>
            </PageHeader>
            {isLoading ? renderLoading() : (
                 <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm">
                    <MarkdownRenderer content={content} />
                 </div>
            )}
        </>
    );
};

export default MaterialDetailPage;