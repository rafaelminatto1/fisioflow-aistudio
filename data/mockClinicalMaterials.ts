import { MaterialCategory } from '../types';

export const mockMaterialCategories: MaterialCategory[] = [
  {
    id: 'cat1',
    name: 'Avaliação e Diagnóstico',
    materials: [
      { id: 'mat1', name: 'Escala Visual Analógica de Dor (EVA)' },
      { id: 'mat2', name: 'Questionário de Incapacidade Roland-Morris' },
      { id: 'mat3', name: 'Teste de Força Muscular de Oxford' },
      { id: 'mat4', name: 'Goniometria - Principais Articulações' },
    ],
  },
  {
    id: 'cat2',
    name: 'Materiais de Prescrição',
    materials: [
      { id: 'mat5', name: 'Template de Plano de Exercícios Domiciliar (HEP)' },
      { id: 'mat6', name: 'Guia de Progressão de Carga' },
      { id: 'mat7', name: 'Orientações Posturais para Home Office' },
    ],
  },
  {
    id: 'cat3',
    name: 'Protocolos Clínicos',
    materials: [
      {
        id: 'mat8',
        name: 'Protocolo Pós-operatório de LCA (Ligamento Cruzado Anterior)',
      },
      {
        id: 'mat9',
        name: 'Protocolo de Tratamento para Síndrome do Impacto do Ombro',
      },
      { id: 'mat10', name: 'Diretrizes para Tratamento de Lombalgia Aguda' },
    ],
  },
  {
    id: 'cat4',
    name: 'Recursos Educacionais para Pacientes',
    materials: [
      { id: 'mat11', name: 'Folder: O que é Hérnia de Disco?' },
      { id: 'mat12', name: 'Vídeo: Ergonomia no Trabalho' },
      {
        id: 'mat13',
        name: 'Infográfico: Benefícios da Atividade Física Regular',
      },
    ],
  },
];
