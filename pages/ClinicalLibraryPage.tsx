// pages/ClinicalLibraryPage.tsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle2, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import useMaterialCategories from '../hooks/useMaterialCategories';
import PageLoader from '../components/ui/PageLoader';
import PageHeader from '../components/PageHeader';
import { MaterialCategory } from '../types';

interface AccordionItemProps {
    category: MaterialCategory;
    isOpen: boolean;
    onToggle: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ category, isOpen, onToggle }) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <button
            onClick={onToggle}
            className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors duration-200"
            aria-expanded={isOpen}
            aria-controls={`category-panel-${category.id}`}
        >
            <h2 className="text-lg font-semibold text-slate-800">{category.name}</h2>
            <ChevronDown className={`transform transition-transform duration-300 text-teal-600 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <ul
                id={`category-panel-${category.id}`}
                role="region"
                className="p-4 bg-white"
            >
                {category.materials.map(material => (
                    <li key={material.id}>
                        <Link
                            to={`/materials/${material.id}`}
                            className="flex items-center p-3 hover:bg-slate-50 rounded-md cursor-pointer transition-colors duration-200 w-full"
                        >
                            <CheckCircle2 className="text-teal-500 mr-3 flex-shrink-0" />
                            <span className="text-slate-700">{material.name}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        )}
    </div>
);


const ClinicalLibraryPage: React.FC = () => {
  const { categories, isLoading } = useMaterialCategories();
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  useEffect(() => {
      // Open the first category by default on load if not searching
      if(!isLoading && categories.length > 0 && !searchTerm) {
          setOpenCategoryId(categories[0].id);
      }
  }, [isLoading, categories, searchTerm]);

  const toggleCategory = (categoryId: string) => {
    setOpenCategoryId(openCategoryId === categoryId ? null : categoryId);
  };

  const filteredCategories = React.useMemo(() => {
      if (!categories) return [];
      if (!searchTerm.trim()) return categories;

      const lowercasedFilter = searchTerm.toLowerCase();
      
      return categories.map(category => ({
        ...category,
        materials: category.materials.filter(material =>
          material.name.toLowerCase().includes(lowercasedFilter)
        ),
      })).filter(category => category.materials.length > 0);
  }, [categories, searchTerm]);

  useEffect(() => {
    // If search filters down to one category, open it.
    if(searchTerm && filteredCategories && filteredCategories.length > 0) {
        setOpenCategoryId(filteredCategories[0].id);
    } else if (!searchTerm && categories.length > 0) {
        setOpenCategoryId(categories[0].id);
    } else {
        setOpenCategoryId(null);
    }
  }, [searchTerm, filteredCategories, categories]);


  if (isLoading) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Biblioteca de Materiais"
        subtitle="Seu centro de conhecimento clínico. Encontre protocolos, escalas e materiais para otimizar seus atendimentos."
      />
      
      <div className="mb-6 bg-white p-4 rounded-2xl shadow-sm">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
                type="text"
                placeholder="Pesquisar materiais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
        </div>
      </div>

      <div className="space-y-4">
        {filteredCategories?.map(category => (
          <AccordionItem
            key={category.id}
            category={category}
            isOpen={openCategoryId === category.id}
            onToggle={() => toggleCategory(category.id)}
          />
        ))}
        {filteredCategories?.length === 0 && (
            <div className="text-center p-10 text-slate-500 bg-white rounded-2xl shadow-sm">
                Nenhum material encontrado para "{searchTerm}".
            </div>
        )}
      </div>
    </>
  );
};

export default ClinicalLibraryPage;