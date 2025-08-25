// components/forms/SportsAssessmentForm.tsx
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, Trash2, Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const sportsAssessmentSchema = z.object({
  patientId: z.string(),
  height: z.string().optional(),
  weight: z.string().optional(),
  sport: z.string().min(2, "Modalidade é obrigatória."),
  position: z.string().optional(),
  trainingFrequency: z.string().optional(),
  injuryHistory: z.object({
    startDate: z.string().optional(),
    triggerEvent: z.string().optional(),
    painLevel: z.number().min(0).max(10).default(0),
    aggravatingFactors: z.string().optional(),
  }),
  functionalTests: z.array(z.object({
    testName: z.string().min(1, "Nome do teste é obrigatório"),
    result: z.string().min(1, "Resultado é obrigatório"),
  })).optional(),
});

type SportsAssessmentFormData = z.infer<typeof sportsAssessmentSchema>;

const inputStyle = "block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm";
const fieldsetStyle = "p-4 border border-slate-200 rounded-xl bg-white";
const legendStyle = "px-2 font-semibold text-md text-teal-700";

interface SportsAssessmentFormProps {
    patientId: string;
    onBack: () => void;
}

const SportsAssessmentForm: React.FC<SportsAssessmentFormProps> = ({ patientId, onBack }) => {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<SportsAssessmentFormData>({
    resolver: zodResolver(sportsAssessmentSchema),
    defaultValues: { patientId, functionalTests: [], injuryHistory: { painLevel: 0 } },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "functionalTests",
  });

  const { showToast } = useToast();

  const onSubmit = (data: SportsAssessmentFormData) => {
    return new Promise(resolve => {
        setTimeout(() => {
            // Dados da Avaliação Esportiva Salvos
            showToast("Avaliação esportiva salva com sucesso!", 'success');
            onBack();
            resolve(data);
        }, 1000);
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in-fast">
      <div className="p-6 bg-white rounded-2xl shadow-sm">
        <div className="space-y-6">
            {/* Seção de Identificação */}
            <fieldset className={fieldsetStyle}>
                <legend className={legendStyle}>Identificação do Atleta</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                    <input type="text" placeholder="Modalidade Esportiva*" {...register("sport")} className={inputStyle} />
                    <input type="text" placeholder="Posição/Função" {...register("position")} className={inputStyle} />
                    <input type="text" placeholder="Frequência de treinos/sem" {...register("trainingFrequency")} className={inputStyle} />
                    <input type="text" placeholder="Altura (m)" {...register("height")} className={inputStyle} />
                    <input type="text" placeholder="Peso (kg)" {...register("weight")} className={inputStyle} />
                </div>
            </fieldset>

            {/* Seção de Histórico da Lesão */}
            <fieldset className={fieldsetStyle}>
                <legend className={legendStyle}>Histórico da Lesão (se aplicável)</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <textarea placeholder="Quando iniciou e como?" {...register("injuryHistory.startDate")} className={`${inputStyle} md:col-span-2`} rows={2} />
                    <textarea placeholder="Houve algum evento específico associado?" {...register("injuryHistory.triggerEvent")} className={`${inputStyle} md:col-span-2`} rows={2}/>
                    <textarea placeholder="Movimentos/Fatores que agravam a dor" {...register("injuryHistory.aggravatingFactors")} className={`${inputStyle} md:col-span-2`} rows={2} />
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Intensidade da dor (0 a 10)</label>
                        <input type="range" min="0" max="10" defaultValue="0" {...register("injuryHistory.painLevel", { valueAsNumber: true })} className="w-full mt-1" />
                    </div>
                </div>
            </fieldset>

            {/* Seção de Testes Funcionais */}
            <fieldset className={fieldsetStyle}>
                <legend className={legendStyle}>Testes Funcionais</legend>
                <div className="space-y-4 mt-2">
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-2 animate-fade-in-fast">
                        <input {...register(`functionalTests.${index}.testName`)} placeholder="Nome do Teste" className={`${inputStyle} flex-1`} />
                        <input {...register(`functionalTests.${index}.result`)} placeholder="Resultado/Observação" className={`${inputStyle} flex-1`} />
                        <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="w-5 h-5" /></button>
                    </div>
                ))}
                <button type="button" onClick={() => append({ testName: '', result: '' })} className="flex items-center text-sm font-semibold text-teal-600 hover:text-teal-700">
                    <PlusCircle className="mr-2 w-5 h-5" /> Adicionar Teste Funcional
                </button>
                </div>
            </fieldset>
        </div>
      </div>
      
      <div className="flex justify-end p-4 bg-white rounded-2xl shadow-sm">
        <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto inline-flex items-center justify-center bg-teal-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-600 transition-colors disabled:bg-teal-300">
            <Save className="w-5 h-5 mr-2" />
            {isSubmitting ? 'Salvando...' : 'Salvar Avaliação'}
        </button>
      </div>
       <style>{`
            @keyframes fade-in-fast {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .animate-fade-in-fast { animation: fade-in-fast 0.5s ease-out forwards; }
        `}</style>
    </form>
  );
};

export default SportsAssessmentForm;
