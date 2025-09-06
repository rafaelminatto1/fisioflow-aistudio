export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Básico',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      '1 profissional',
      '20 pacientes',
      'Agendamento básico',
      'Suporte por email',
    ],
  },
  {
    id: 'professional',
    name: 'Profissional',
    price_monthly: 97.9,
    price_yearly: 990.0,
    popular: true,
    features: [
      '3 profissionais',
      '100 pacientes',
      'Agendamento avançado',
      'Relatórios completos',
      'Integração com parceiros',
      'Suporte prioritário',
    ],
  },
  {
    id: 'clinic',
    name: 'Clínica',
    price_monthly: 297.9,
    price_yearly: 2990.0,
    features: [
      'Profissionais ilimitados',
      'Pacientes ilimitados',
      'Múltiplas unidades',
      'Acesso à API',
      'Suporte dedicado',
      'Treinamento incluso',
    ],
  },
];
