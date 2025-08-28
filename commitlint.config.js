module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nova funcionalidade
        'fix', // Correção de bug
        'docs', // Documentação
        'style', // Formatação, ponto e vírgula, etc
        'refactor', // Refatoração de código
        'perf', // Melhoria de performance
        'test', // Adição ou correção de testes
        'chore', // Tarefas de build, configuração, etc
        'ci', // Mudanças no CI/CD
        'build', // Mudanças no sistema de build
        'revert', // Reversão de commit
        'wip', // Work in progress
        'hotfix', // Correção crítica
        'release', // Release/versioning
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [
      2,
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
  prompt: {
    questions: {
      type: {
        description: 'Selecione o tipo de mudança que você está commitando:',
        enum: {
          feat: {
            description: 'Uma nova funcionalidade',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'Uma correção de bug',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Mudanças apenas na documentação',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description:
              'Mudanças que não afetam o significado do código (espaços em branco, formatação, ponto e vírgula, etc)',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description:
              'Uma mudança de código que não corrige um bug nem adiciona uma funcionalidade',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'Uma mudança de código que melhora a performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description:
              'Adicionando testes ausentes ou corrigindo testes existentes',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description:
              'Mudanças que afetam o sistema de build ou dependências externas (escopos de exemplo: gulp, broccoli, npm)',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description:
              'Mudanças nos arquivos e scripts de configuração de CI (escopos de exemplo: Travis, Circle, BrowserStack, SauceLabs)',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description:
              'Outras mudanças que não modificam arquivos src ou test',
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: 'Reverte um commit anterior',
            title: 'Reverts',
            emoji: '🗑',
          },
        },
      },
      scope: {
        description:
          'Qual é o escopo desta mudança (ex: componente ou nome do arquivo)',
      },
      subject: {
        description: 'Escreva uma descrição curta e imperativa da mudança',
      },
      body: {
        description: 'Forneça uma descrição mais longa da mudança',
      },
      isBreaking: {
        description: 'Existem mudanças que quebram a compatibilidade?',
      },
      breakingBody: {
        description:
          'Um commit BREAKING CHANGE requer um corpo. Por favor, insira uma descrição mais longa do próprio commit',
      },
      breaking: {
        description: 'Descreva as mudanças que quebram a compatibilidade',
      },
      isIssueAffected: {
        description: 'Esta mudança afeta alguma issue aberta?',
      },
      issuesBody: {
        description:
          'Se as issues são fechadas, o commit requer um corpo. Por favor, insira uma descrição mais longa do próprio commit',
      },
      issues: {
        description:
          'Adicione referências de issues (ex: "fix #123", "re #123".)',
      },
    },
  },
};
