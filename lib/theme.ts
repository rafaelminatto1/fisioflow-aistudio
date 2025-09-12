/**
 * @constant fisioTheme
 * @description Objeto de configuração centralizado para o tema da aplicação FisioFlow.
 * Inclui cores, espaçamentos, bordas, sombras e animações.
 */
export const fisioTheme = {
  colors: {
    // Cores principais da fisioterapia
    primary: {
      green: 'hsl(142, 69%, 58%)', // Verde saúde/bem-estar
      blue: 'hsl(200, 95%, 45%)',  // Azul confiança/profissional
      mint: 'hsl(160, 50%, 85%)',  // Verde menta suave
      sage: 'hsl(120, 20%, 70%)',  // Verde sálvia
    },
    
    // Cores de apoio
    secondary: {
      purple: 'hsl(260, 30%, 65%)', // Roxo bem-estar
      orange: 'hsl(25, 85%, 60%)',  // Laranja recuperação
      gray: 'hsl(210, 11%, 15%)',   // Cinza texto
    },
    
    // Estados e feedback
    status: {
      success: 'hsl(142, 69%, 58%)', // Verde sucesso
      warning: 'hsl(38, 92%, 50%)',  // Laranja alerta
      error: 'hsl(0, 84%, 60%)',     // Vermelho erro
      info: 'hsl(200, 95%, 45%)',    // Azul informação
    },
    
    // Gradientes temáticos
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142, 69%, 58%) 0%, hsl(200, 95%, 45%) 100%)',
      wellness: 'linear-gradient(135deg, hsl(160, 50%, 85%) 0%, hsl(260, 30%, 65%) 100%)',
      recovery: 'linear-gradient(135deg, hsl(25, 85%, 60%) 0%, hsl(142, 69%, 58%) 100%)',
      professional: 'linear-gradient(135deg, hsl(200, 95%, 45%) 0%, hsl(210, 11%, 15%) 100%)',
    }
  },
  
  // Espaçamentos específicos para fisioterapia
  spacing: {
    card: '1.5rem',      // Espaçamento interno de cards
    section: '3rem',     // Espaçamento entre seções
    component: '1rem',   // Espaçamento entre componentes
    element: '0.5rem',   // Espaçamento entre elementos
  },
  
  // Bordas arredondadas
  borderRadius: {
    small: '0.5rem',
    medium: '0.75rem',
    large: '1rem',
    xl: '1.5rem',
  },
  
  // Sombras específicas
  shadows: {
    card: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    elevated: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    therapy: '0 4px 20px -2px hsl(142, 69%, 58%, 0.2)',
    wellness: '0 4px 20px -2px hsl(260, 30%, 65%, 0.2)',
  },
  
  // Animações suaves para fisioterapia
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  }
};

/**
 * Utilitário para obter um valor de cor do tema a partir de um caminho de string.
 * @param {string} path - O caminho para a cor no objeto de tema (ex: 'primary.green').
 * @returns {string} O valor da cor ou uma string vazia se não for encontrada.
 */
export const getThemeColor = (path: string) => {
  const keys = path.split('.');
  let value: unknown = fisioTheme.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '';
};

/**
 * @constant themeClasses
 * @description Mapeamento de classes utilitárias do Tailwind CSS para as cores do tema.
 * Facilita o uso consistente do tema em componentes React.
 */
export const themeClasses = {
  // Backgrounds com cores do tema
  bg: {
    primary: 'bg-therapy-green',
    secondary: 'bg-therapy-blue',
    accent: 'bg-therapy-mint',
    wellness: 'bg-wellness-purple',
    recovery: 'bg-recovery-orange',
  },
  
  // Textos com cores do tema
  text: {
    primary: 'text-therapy-green',
    secondary: 'text-therapy-blue',
    accent: 'text-therapy-sage',
    wellness: 'text-wellness-purple',
    recovery: 'text-recovery-orange',
  },
  
  // Bordas com cores do tema
  border: {
    primary: 'border-therapy-green',
    secondary: 'border-therapy-blue',
    accent: 'border-therapy-mint',
    wellness: 'border-wellness-purple',
    recovery: 'border-recovery-orange',
  },
  
  // Gradientes
  gradient: {
    primary: 'bg-gradient-to-r from-therapy-green to-therapy-blue',
    wellness: 'bg-gradient-to-r from-therapy-mint to-wellness-purple',
    recovery: 'bg-gradient-to-r from-recovery-orange to-therapy-green',
  }
};

export default fisioTheme;