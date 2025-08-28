// lib/hooks/use-patient-form.ts
'use client';

import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { PatientFormData } from '../validations/patient';

/**
 * Hook customizado para gerenciar a lógica do formulário de paciente,
 * incluindo a busca automática de CEP.
 * @param form - A instância do formulário de react-hook-form.
 */
export function usePatientForm(form: any) {
  const { control, setValue } = form;
  const [isCepLoading, setIsCepLoading] = useState(false);

  // useWatch para observar o campo do CEP de forma otimizada
  const cep = useWatch({
    control,
    name: 'addressZip',
  });

  useEffect(() => {
    const fetchCep = async () => {
      const cepClean = cep?.replace(/\D/g, ''); // Remove caracteres não numéricos

      if (cepClean?.length !== 8) {
        return; // CEP deve ter 8 dígitos
      }

      setIsCepLoading(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cepClean}/json/`
        );
        if (!response.ok) throw new Error('CEP não encontrado');

        const data = await response.json();
        if (data.erro) throw new Error('CEP inválido');

        // Preenche os campos do formulário com os dados do CEP
        setValue('addressStreet', data.logradouro, { shouldValidate: true });
        setValue('addressCity', data.localidade, { shouldValidate: true });
        setValue('addressState', data.uf, { shouldValidate: true });
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        // Opcional: Adicionar um toast de erro aqui
      } finally {
        setIsCepLoading(false);
      }
    };

    // Atraso para evitar chamadas excessivas enquanto o usuário digita
    const debounceTimer = setTimeout(() => {
      fetchCep();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [cep, setValue]);

  return { isCepLoading };
}
