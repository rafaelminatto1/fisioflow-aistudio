// data/mockExerciseLibrary.ts
import { ExerciseCategory, Protocol } from '../types';

export const mockProtocols: Protocol[] = [
  {
    id: 'protocolo-joelho-lca',
    name: 'Protocolo Pós-operatório de Joelho (LCA)',
    description:
      'Reabilitação completa com foco em ganho de ADM, força e retorno seguro ao esporte.',
  },
  {
    id: 'protocolo-ombro-impacto',
    name: 'Protocolo para Síndrome do Impacto do Ombro',
    description:
      'Fortalecimento do manguito rotador e reeducação escapular para alívio da dor.',
  },
  {
    id: 'protocolo-lombalgia',
    name: 'Protocolo para Lombalgia (Fase Aguda)',
    description:
      'Diretrizes para manejo da dor aguda, mobilidade e ativação do core.',
  },
];

export const mockExerciseGroups: ExerciseCategory[] = [
  {
    id: 'cat-neural',
    name: 'Mobilização Neural',
    exercises: [
      {
        id: 'exn1',
        name: 'Mobilização neural do nervo ciático - Ênfase no ramo fibular',
        duration: '00:51',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exn2',
        name: 'Mobilização neural do nervo ciático',
        duration: '00:43',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exn3',
        name: 'Mobilização neural do nervo mediano',
        duration: '00:55',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exn4',
        name: 'Mobilização neural do nervo radial',
        duration: '00:31',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exn5',
        name: 'Mobilização neural do nervo ulnar',
        duration: '00:41',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exn6',
        name: 'Deslizamento do nervo femoral',
        duration: '00:48',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'cat-cervical',
    name: 'Cervical',
    exercises: [
      {
        id: 'exc1',
        name: 'Retração cervical (Chin Tuck)',
        duration: '00:35',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exc2',
        name: 'Alongamento de trapézio superior',
        duration: '00:40',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exc3',
        name: 'Fortalecimento de flexores profundos do pescoço',
        duration: '01:02',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exc4',
        name: 'Mobilidade em rotação cervical ativa',
        duration: '00:50',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'cat-membros-superiores',
    name: 'Membros Superiores',
    exercises: [
      {
        id: 'exms1',
        name: 'Estabilização e mobilidade escapular',
        duration: '01:01',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms2',
        name: 'Abdução e retração escapular na máquina de remada',
        duration: '00:27',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms3',
        name: 'Remada baixa pegada fechada',
        duration: '00:26',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms4',
        name: 'Remada baixa pegada supinada',
        duration: '00:25',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms5',
        name: 'Remada baixa pegada pronada',
        duration: '00:29',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms6',
        name: 'Puxada supinada',
        duration: '00:37',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms7',
        name: 'Elevação em Y com elástico',
        duration: '00:46',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms8',
        name: 'Elevação em Y com halteres',
        duration: '00:30',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms9',
        name: 'Rotação externa de ombro com elástico',
        duration: '00:24',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms10',
        name: 'Rotação externa de ombro em diagonal com elástico',
        duration: '00:25',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms11',
        name: 'Elevação lateral de ombro com elástico',
        duration: '00:19',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms12',
        name: 'Elevação lateral de ombro com halter',
        duration: '00:16',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms13',
        name: 'Wall Ball Slide',
        duration: '00:25',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms14',
        name: 'Push-up Plus',
        duration: '00:25',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exms15',
        name: 'Abdução do ombro ativo-assistida com bastão',
        duration: '00:29',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'cat-tronco',
    name: 'Tronco',
    exercises: [
      {
        id: 'ext1',
        name: 'Abdominal reto',
        duration: '00:16',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'ext2',
        name: 'Extensão lombar',
        duration: '00:18',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'ext3',
        name: 'Abdominal inferior',
        duration: '00:24',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'ext4',
        name: 'Superman (4 apoios)',
        duration: '00:31',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'ext5',
        name: 'Rotação do quadril e lombar com bola',
        duration: '00:33',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'ext6',
        name: 'Prancha lateral',
        duration: '00:45',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'ext7',
        name: 'Ponte de glúteos',
        duration: '00:38',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'cat-membros-inferiores',
    name: 'Membros Inferiores',
    exercises: [
      {
        id: 'exmi1',
        name: 'Agachamento sumô com KTB',
        duration: '00:28',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmi2',
        name: 'Monster walking com theraband',
        duration: '00:30',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmi3',
        name: 'Agachamento búlgaro',
        duration: '00:40',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmi4',
        name: 'Agachamento pistol no TRX',
        duration: '00:35',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmi5',
        name: 'Step up no caixote',
        duration: '00:32',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmi6',
        name: 'Y balance test (adaptação)',
        duration: '01:10',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmi7',
        name: 'Elevação pélvica',
        duration: '00:25',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmi8',
        name: 'Flexão plantar (panturrilha)',
        duration: '00:20',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'cat-mobilidade',
    name: 'Mobilidade',
    exercises: [
      {
        id: 'exmo1',
        name: 'Mobilidade torácica com rolo',
        duration: '00:55',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmo2',
        name: 'Mobilidade de quadril (90/90)',
        duration: '01:15',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmo3',
        name: 'Mobilidade de tornozelo na parede',
        duration: '00:45',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'exmo4',
        name: 'Alongamento Gato-Camelo',
        duration: '00:50',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'protocolo-joelho-lca-group',
    name: 'Protocolo Pós-operatório de Joelho (LCA)',
    exercises: [
      {
        id: 'plca1',
        name: 'Elevação da perna estendida (Isometria)',
        duration: '00:30',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plca2',
        name: 'Flexão passiva do joelho (ganho de ADM)',
        duration: '00:45',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plca3',
        name: 'Ativação de quadríceps com toalha',
        duration: '00:25',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plca4',
        name: 'Mini-agachamento isométrico',
        duration: '00:40',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plca5',
        name: 'Descarga de peso parcial com muletas',
        duration: '01:00',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'protocolo-ombro-impacto-group',
    name: 'Protocolo para Síndrome do Impacto do Ombro',
    exercises: [
      {
        id: 'pimp1',
        name: 'Pêndulo de Codman',
        duration: '00:50',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'pimp2',
        name: 'Rotação externa com elástico (isometria)',
        duration: '00:35',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'pimp3',
        name: 'Remada baixa com foco em serrátil',
        duration: '00:45',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'pimp4',
        name: 'Elevação no plano da escápula (polegar para cima)',
        duration: '00:40',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'pimp5',
        name: 'Alongamento da cápsula posterior',
        duration: '00:55',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
  {
    id: 'protocolo-lombalgia-group',
    name: 'Protocolo para Lombalgia (Fase Aguda)',
    exercises: [
      {
        id: 'plom1',
        name: 'Exercício de McKenzie (Extensão deitado)',
        duration: '00:45',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plom2',
        name: 'Abraçar os joelhos (Flexão suave)',
        duration: '00:40',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plom3',
        name: 'Ativação de transverso do abdômen',
        duration: '01:05',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plom4',
        name: 'Alongamento de Piriforme',
        duration: '00:50',
        videoUrl: 'https://youtube.com',
      },
      {
        id: 'plom5',
        name: 'Báscula pélvica',
        duration: '00:35',
        videoUrl: 'https://youtube.com',
      },
    ],
  },
];
