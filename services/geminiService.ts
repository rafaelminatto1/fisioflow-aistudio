

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClinicalMaterialData, Patient, SoapNote } from "../types";

if (!process.env.API_KEY) {
  throw new Error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenerativeAI(process.env.API_KEY);

const PROMPT_TEMPLATE = `
# Persona
Você é um Fisioterapeuta Especialista em Documentação Clínica, com vasta experiência em terminologia técnica e na elaboração de laudos cinesiofuncionais. Sua escrita é precisa, objetiva e estruturada.

# Contexto
Você está criando o laudo de avaliação inicial para o paciente {{nome_paciente}}, um(a) {{profissao_paciente}} de {{idade_paciente}} anos. Esta é a primeira consulta dele(a) na clínica e este documento será a base para todo o plano de tratamento. A data da avaliação é {{data_atual}}.

# Tarefa
Com base nas informações brutas coletadas durante a avaliação, redija um Laudo Fisioterapêutico completo e profissional. Organize as informações nas seções especificadas, formule um diagnóstico cinesiofuncional claro e proponha um plano de tratamento inicial baseado em evidências.

# Informações Coletadas
- Queixa Principal: "{{queixa_principal}}"
- Histórico da Doença Atual (HDA): "{{hda}}"
- Histórico Médico Pregresso (HMP): "{{hmp}}"
- Exame Físico - Inspeção e Palpação: "{{inspecao_palpacao}}"
- Exame Físico - Amplitude de Movimento (ADM): "{{adm}}"
- Exame Físico - Teste de Força Muscular (0-5): "{{teste_forca}}"
- Exame Físico - Testes Especiais: "{{testes_especiais}}"
- Escala Visual Analógica de Dor (EVA 0-10): "{{escala_dor}}"
- Objetivos do Paciente: "{{objetivos_paciente}}"

# Formato de Saída (Obrigatório em Markdown)
## LAUDO DE AVALIAÇÃO FISIOTERAPÊUTICA

**DATA:** {{data_atual}}

**1. DADOS DO PACIENTE**
   - **Nome:** {{nome_paciente}}
   - **Idade:** {{idade_paciente}} anos
   - **Profissão:** {{profissao_paciente}}

**2. ANAMNESE**
   - **Queixa Principal (QP):** {{queixa_principal}}
   - **História da Doença Atual (HDA):** (Elaborar um parágrafo coeso a partir da informação bruta do HDA).
   - **História Médica Pregressa (HMP):** (Listar os pontos relevantes do HMP).
   - **Objetivos do Paciente:** (Descrever os objetivos relatados).

**3. EXAME FÍSICO**
   - **Inspeção e Palpação:** (Descrever os achados clínicos).
   - **Amplitude de Movimento (ADM):** (Descrever as limitações de movimento de forma técnica).
   - **Força Muscular:** (Listar os principais músculos avaliados e seus graus de força).
   - **Testes Especiais:** (Listar os testes realizados e seus resultados. Ex: "Teste de Neer: Positivo à direita para impacto subacromial").
   - **Escala de Dor (EVA):** O paciente relata dor nível {{escala_dor}}/10 no momento da avaliação.

**4. DIAGNÓSTICO CINESIOFUNCIONAL**
   (Com base em todos os dados, formule um diagnóstico fisioterapêutico preciso, descrevendo a disfunção em termos de movimento e função. Ex: "Disfunção do ombro direito caracterizada por síndrome do impacto subacromial, com limitação da ADM de flexão e abdução, e fraqueza dos músculos do manguito rotador, resultando em dificuldade para atividades de vida diária acima da linha do ombro.")

**5. PLANO DE TRATAMENTO INICIAL (4 SEMANAS)**
   - **Objetivos a Curto Prazo:**
      1. Reduzir quadro álgico de {{escala_dor}}/10 para < 3/10.
      2. Restaurar pelo menos 80% da ADM fisiológica para os movimentos afetados.
      3. Melhorar a ativação neuromuscular dos músculos estabilizadores.
   - **Condutas Propostas:**
      - **Cinesioterapia:** (Listar 2-3 tipos de exercícios iniciais).
      - **Terapia Manual:** (Listar 1-2 técnicas, ex: "Mobilização articular grau I e II").
      - **Eletrotermofototerapia:** (Especificar recursos, ex: "TENS para analgesia").
      - **Orientações Domiciliares:** (Descrever orientações gerais).
`;

export interface EvaluationFormData {
    nome_paciente: string;
    profissao_paciente: string;
    idade_paciente: string;
    queixa_principal: string;
    hda: string;
    hmp: string;
    inspecao_palpacao: string;
    adm: string;
    teste_forca: string;
    testes_especiais: string;
    escala_dor: string;
    objetivos_paciente: string;
}

export const generateEvaluationReport = async (data: EvaluationFormData): Promise<string> => {
    let prompt = PROMPT_TEMPLATE;
    const today = new Date().toLocaleDateString('pt-BR');

    // Create a new object for replacements to avoid modifying the original data
    const replacements: { [key: string]: string } = {
        ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value || 'Não informado'])),
        data_atual: today,
    };
    
    for (const key in replacements) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }
    
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating evaluation report:", error);
        throw new Error("Falha ao gerar o laudo com a IA. Por favor, tente novamente.");
    }
};

const PROMPT_TEMPLATE_EVOLUTION = `
# Persona
Você é um assistente de prontuário eletrônico, treinado para ser conciso e preciso. Sua função é transformar as anotações rápidas de um fisioterapeuta em uma nota de evolução profissional no formato SOAP.

# Contexto
O fisioterapeuta acaba de finalizar a sessão de número {{numero_sessao}} com o paciente {{nome_paciente}} na data de hoje, {{data_atual}}. É preciso documentar a evolução de forma estruturada.

# Tarefa
Converta as anotações do fisioterapeuta para o formato SOAP (Subjetivo, Objetivo, Avaliação, Plano). Utilize os dados fornecidos para preencher cada seção de forma clara e objetiva.

# Anotações da Sessão
- Relato do Paciente: "{{relato_paciente}}"
- Escala de Dor Hoje (0-10): "{{escala_dor_hoje}}"
- Dados Objetivos (Goniometria, Testes, etc.): "{{dados_objetivos}}"
- Intervenções Realizadas: "{{intervencoes}}"
- Análise do Fisioterapeuta: "{{analise_fisio}}"
- Próximos Passos: "{{proximos_passos}}"

# Formato de Saída (Obrigatório em Markdown)
### EVOLUÇÃO FISIOTERAPÊUTICA - SESSÃO {{numero_sessao}}

**DATA:** {{data_atual}}
**PACIENTE:** {{nome_paciente}}

**S (Subjetivo):** Paciente relata "{{relato_paciente}}". Refere dor em {{escala_dor_hoje}}/10.

**O (Objetivo):** Ao exame, apresenta {{dados_objetivos}}. Na sessão de hoje, foram realizadas as seguintes intervenções: {{intervencoes}}.

**A (Avaliação):** {{analise_fisio}}. Paciente demonstra boa tolerância às condutas e apresenta evolução positiva em relação aos objetivos de curto prazo.

**P (Plano):** {{proximos_passos}}. Manter frequência de [X] vezes por semana. Entregue e orientado novo plano de exercícios domiciliares. Próxima sessão agendada para [dd/mm/aaaa].
`;

export interface SessionEvolutionFormData {
    nome_paciente: string;
    numero_sessao: string;
    relato_paciente: string;
    escala_dor_hoje: string;
    dados_objetivos: string;
    intervencoes: string;
    analise_fisio: string;
    proximos_passos: string;
}

export const generateSessionEvolution = async (data: SessionEvolutionFormData): Promise<string> => {
    let prompt = PROMPT_TEMPLATE_EVOLUTION;
    const today = new Date().toLocaleDateString('pt-BR');

    const replacements: { [key: string]: string } = {
        ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value || 'Não informado'])),
        data_atual: today,
    };
    
    for (const key in replacements) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }
    
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating session evolution:", error);
        throw new Error("Falha ao gerar a evolução com a IA. Por favor, tente novamente.");
    }
};

const PROMPT_TEMPLATE_HEP = `
# Persona
Você é um Fisioterapeuta especialista em Cinesiologia e Biomecânica. Sua habilidade é criar programas de exercícios seguros, eficazes e fáceis de entender para pacientes leigos.

# Contexto
O paciente {{nome_paciente}}, com diagnóstico de {{diagnostico_paciente}}, precisa de um plano de exercícios para realizar em casa, a fim de acelerar sua recuperação.

# Tarefa
Crie um plano de exercícios domiciliar (HEP - Home Exercise Program) detalhado e de fácil compreensão. O plano deve ser baseado nos objetivos e limitações do paciente. Para cada exercício da lista, forneça instruções claras de como fazer e uma dica de segurança ou foco.

# Parâmetros do Plano
- Objetivo Principal: "{{objetivo_hep}}"
- Exercícios (separados por vírgula): "{{lista_exercicios}}"
- Séries por exercício: "{{series}}"
- Repetições por exercício: "{{repeticoes}}"
- Frequência: "{{frequencia}}"
- Observações e Contraindicações: "{{observacoes}}"

# Formato de Saída (Obrigatório em Markdown e em Português do Brasil)
## Plano de Exercícios Domiciliar - {{nome_paciente}}

Olá, {{nome_paciente}}! Este é o seu plano de exercícios para fazer em casa. Lembre-se que a consistência é a chave para a sua melhora!

**Frequência:** Realizar os exercícios {{frequencia}}.

---

### Seus Exercícios

{{#each lista_exercicios}}
**{{@index + 1}}. {{this}}**
*   **Como fazer:** (Descreva aqui o passo a passo do exercício de forma simples e clara para um leigo).
*   **Séries e Repetições:** {{../series}} séries de {{../repeticoes}} repetições.
*   **Dica:** (Adicione aqui uma dica de execução ou foco, ex: "Mantenha o abdômen contraído durante todo o movimento").
{{/each}}

---

**⚠️ Atenção!**
- **NÃO FAÇA** os exercícios se sentir dor aguda. Um leve desconforto pode ser normal, mas dor forte é um sinal para parar.
- {{observacoes}}
- Em caso de dúvidas, entre em contato conosco.

**Fisioterapeuta Responsável:**
{{nome_fisio}}
CREFITO: {{crefito_fisio}}
`;

export interface HepFormData {
    nome_paciente: string;
    diagnostico_paciente: string;
    objetivo_hep: string;
    lista_exercicios: string;
    series: string;
    repeticoes: string;
    frequencia: string;
    observacoes: string;
}

export const generateHep = async (data: HepFormData): Promise<string> => {
    // This is a simplified replacement logic. A real implementation would use a templating engine like Handlebars.
    // The prompt is written with a pseudo-templating syntax for clarity.
    // The AI is expected to understand the structure and fill it in accordingly.
    const exerciseList = data.lista_exercicios.split(',').map(e => e.trim());
    const exercisesFormatted = exerciseList.map((ex, i) => `${i+1}. **${ex}**\n * **Como fazer:** ...`).join('\n\n');
    
    let prompt = `
# Persona
Você é um Fisioterapeuta especialista em Cinesiologia e Biomecânica. Sua habilidade é criar programas de exercícios seguros, eficazes e fáceis de entender para pacientes leigos.

# Contexto
O paciente ${data.nome_paciente}, com diagnóstico de ${data.diagnostico_paciente}, precisa de um plano de exercícios para realizar em casa, a fim de acelerar sua recuperação.

# Tarefa
Crie um plano de exercícios domiciliar (HEP - Home Exercise Program) detalhado e de fácil compreensão. O plano deve ser baseado nos objetivos e limitações do paciente. Para cada um dos seguintes exercícios, crie um item de lista numerado. Para cada item, descreva o passo a passo do exercício de forma simples ("Como fazer"), adicione os parâmetros de execução ("Séries e Repetições"), e forneça uma dica de segurança ou foco ("Dica").

# Parâmetros do Plano
- Objetivo Principal: "${data.objetivo_hep}"
- Exercícios (lista): ${data.lista_exercicios}
- Séries por exercício: "${data.series}"
- Repetições por exercício: "${data.repeticoes}"
- Frequência: "${data.frequencia}"
- Observações e Contraindicações: "${data.observacoes}"
- Nome do Fisioterapeuta: "Dr. Roberto"
- CREFITO do Fisioterapeuta: "12345-F"

# Formato de Saída (Obrigatório em Markdown e em Português do Brasil)
Use exatamente este formato, preenchendo as seções.

## Plano de Exercícios Domiciliar - ${data.nome_paciente}

Olá, ${data.nome_paciente}! Este é o seu plano de exercícios para fazer em casa. Lembre-se que a consistência é a chave para a sua melhora!

**Frequência:** Realizar os exercícios ${data.frequencia}.

---

### Seus Exercícios

(Gere aqui a lista numerada de exercícios, com "Como fazer", "Séries e Repetições", e "Dica" para cada um)

---

**⚠️ Atenção!**
- **NÃO FAÇA** os exercícios se sentir dor aguda. Um leve desconforto pode ser normal, mas dor forte é um sinal para parar.
- ${data.observacoes}
- Em caso de dúvidas, entre em contato conosco.

**Fisioterapeuta Responsável:**
Dr. Roberto
CREFITO: 12345-F
`;

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating HEP:", error);
        throw new Error("Falha ao gerar o plano de exercícios com a IA. Por favor, tente novamente.");
    }
};


const PROMPT_TEMPLATE_RISK_ANALYSIS = `
# Persona
Você é um Analista de Dados da Saúde, especializado em comportamento de pacientes. Seu trabalho é analisar dados de prontuário e agendamento para prever riscos e sugerir ações preventivas.

# Contexto
A gestão da clínica precisa identificar proativamente pacientes com risco de abandonar o tratamento para que a equipe possa intervir.

# Tarefa
Analise os dados do paciente {{nome_paciente}} e calcule o nível de risco de abandono (Baixo, Médio, Alto). Justifique sua análise com base nos fatores de risco e sugira 2 ações concretas e personalizadas para a equipe de atendimento.

# Dados do Paciente
- Total de Sessões Realizadas: {{sessoes_realizadas}}
- Total de Sessões Prescritas: {{sessoes_prescritas}}
- Faltas não justificadas (últimos 30 dias): {{faltas}}
- Cancelamentos/Remarcações (últimos 30 dias): {{remarcacoes}}
- Último feedback registrado (qualitativo): "{{ultimo_feedback}}"
- Aderência ao plano de exercícios domiciliar (relatado): "{{aderencia_hep}}"

# Formato de Saída (Obrigatório em Markdown)
### Análise de Risco de Abandono - {{nome_paciente}}

**Nível de Risco:** (Calcular e exibir: **Baixo**, **Médio** ou **Alto**)

**Justificativa da Análise:**
(Apresente uma análise concisa baseada nos dados. Ex: "O risco é considerado **Médio** devido ao aumento no número de remarcações e ao feedback recente indicando 'pouca melhora', o que pode levar à desmotivação.")

**Fatores de Risco Identificados:**
- (Listar os pontos negativos dos dados de entrada. Ex: "2 remarcações no último mês").
- (Ex: "Relato de baixa aderência ao HEP").

**Plano de Ação Sugerido:**
1.  **Contato Proativo:** A recepção deve ligar para o paciente para confirmar a próxima consulta e perguntar ativamente se o horário ainda é o melhor para ele, oferecendo flexibilidade.
2.  **Revisão Clínica:** O fisioterapeuta responsável deve, no início da próxima sessão, reavaliar os objetivos de curto prazo junto ao paciente e discutir a percepção de melhora, ajustando o plano de tratamento se necessário para aumentar a motivação.
`;

export interface RiskAnalysisFormData {
    nome_paciente: string;
    sessoes_realizadas: string;
    sessoes_prescritas: string;
    faltas: string;
    remarcacoes: string;
    ultimo_feedback: string;
    aderencia_hep: 'Alta' | 'Média' | 'Baixa' | 'Não informada';
}

export const generateRiskAnalysis = async (data: RiskAnalysisFormData): Promise<string> => {
    let prompt = PROMPT_TEMPLATE_RISK_ANALYSIS;
    
    const replacements: { [key: string]: string } = {
        ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value || 'Não informado'])),
    };
    
    for (const key in replacements) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }
    
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating risk analysis:", error);
        throw new Error("Falha ao gerar a análise de risco com a IA. Por favor, tente novamente.");
    }
};

const PROMPT_TEMPLATE_PATIENT_PROGRESS = `
# Persona
Você é o assistente de saúde pessoal do paciente na FisioFlow. Sua comunicação é positiva, encorajadora e foca nos ganhos e conquistas, simplificando dados técnicos.

# Contexto
O cliente {{nome_paciente}} clicou na opção "Ver meu progresso" no aplicativo. Ele está buscando entender e se motivar com sua evolução.

# Tarefa
Acesse o histórico de dados do paciente e crie um resumo claro e visual do progresso dele. Compare os dados da avaliação inicial com os dados da última sessão. Finalize com uma mensagem de incentivo e peça um feedback rápido.

# Dados do Paciente
- Dor Inicial (EVA 0-10): {{dor_inicial}}
- Dor Atual (EVA 0-10): {{dor_atual}}
- Principal Limitação Inicial: "{{limitacao_inicial}}"
- Status da Limitação Atual: "{{status_atual}}"
- Conquista Recente Registrada: "{{conquista_recente}}"
- Nome do Fisioterapeuta: "{{nome_fisio}}"

# Formato de Saída (Obrigatório em Markdown)
## Olá, {{nome_paciente}}! Veja o quanto você já avançou!

É uma alegria ver sua dedicação ao tratamento. Preparamos um resumo especial para você acompanhar sua jornada de recuperação:

---

### **Sua Evolução em Números:**

📉 **Alívio da Dor**
- Quando você começou: **{{dor_inicial}}/10**
- Como você está agora: **{{dor_atual}}/10**
- **Isso é uma melhora de {{calculo_percentual_melhora}}%!**

💪 **Ganhos de Função**
- **Seu desafio inicial era:** {{limitacao_inicial}}.
- **Sua conquista agora é:** {{status_atual}}.

🏆 **Sua última grande conquista:**
> "{{conquista_recente}}"

---

Continue assim! Cada exercício e cada sessão te deixam mais perto do seu objetivo. O(A) Dr(a). {{nome_fisio}} está muito orgulhoso(a) do seu progresso.
`;

export interface PatientProgressData {
    nome_paciente: string;
    dor_inicial: string;
    dor_atual: string;
    limitacao_inicial: string;
    status_atual: string;
    conquista_recente: string;
    nome_fisio: string;
}

export const generatePatientProgressSummary = async (data: PatientProgressData): Promise<string> => {
    let prompt = PROMPT_TEMPLATE_PATIENT_PROGRESS;
    
    const initialPain = parseInt(data.dor_inicial, 10);
    const currentPain = parseInt(data.dor_atual, 10);
    let improvementPercentage = '0';

    if (!isNaN(initialPain) && !isNaN(currentPain) && initialPain > 0) {
        const improvement = ((initialPain - currentPain) / initialPain) * 100;
        improvementPercentage = Math.max(0, Math.round(improvement)).toString();
    } else if (initialPain === 0 && currentPain === 0) {
        improvementPercentage = '100'; // Maintained perfect score
    }

    const replacements: { [key: string]: string } = {
        ...Object.fromEntries(Object.entries(data).map(([key, value]) => [key, value || 'Não informado'])),
        calculo_percentual_melhora: improvementPercentage,
    };
    
    for (const key in replacements) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    }

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating patient progress summary:", error);
        throw new Error("Falha ao gerar o resumo de progresso com a IA.");
    }
};

export interface AppointmentReminderData {
    nome_paciente: string;
    data_consulta: Date;
    hora_consulta: string;
    nome_fisio: string;
}

export const generateAppointmentReminder = async (data: AppointmentReminderData): Promise<string> => {
    const formattedDate = data.data_consulta.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

    const prompt = `
# Persona
Você é o coordenador de cuidados da FisioFlow. Sua comunicação é cuidadosa, informativa e focada em garantir que o paciente tenha a melhor experiência possível.

# Contexto
O paciente ${data.nome_paciente} tem uma consulta agendada com o(a) Dr(a). ${data.nome_fisio} para ${formattedDate}, às ${data.hora_consulta}.

# Tarefa
Escreva uma mensagem de lembrete amigável e informativa no formato de texto para WhatsApp. A mensagem deve:
1.  Confirmar os detalhes da consulta (dia, hora, profissional).
2.  Dar dicas de preparação, como usar roupas confortáveis.
3.  Incentivar o paciente a refletir sobre sua semana (melhoras, pioras, dificuldades) para otimizar a sessão.
4.  Incluir uma saudação amigável ("Olá, [Nome]! 👋") e uma despedida cordial ("Até breve!").
5.  Mencionar como remarcar, se necessário ("Se precisar remarcar, por favor, nos avise...").
6.  Finalize com "*Equipe FisioFlow*".
7.  O tom deve ser positivo e encorajador.
`;
    
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating appointment reminder:", error);
        throw new Error("Falha ao gerar o lembrete com a IA.");
    }
};

export interface InactivePatientEmailData {
    dias_inatividade: string;
}

export const generateInactivePatientEmail = async (data: InactivePatientEmailData): Promise<string> => {
    const prompt = `
# Persona
Você é um especialista em Marketing de Relacionamento para a área da saúde. Sua comunicação é empática, pessoal e focada em reativar o vínculo com o paciente, sem ser excessivamente comercial.

# Contexto
Precisamos criar um template de e-mail para ser enviado automaticamente para pacientes que não agendam uma consulta há mais de ${data.dias_inatividade} dias. O objetivo é trazê-los de volta à clínica.

# Tarefa
Escreva o corpo de um e-mail de reengajamento. O tom deve ser de cuidado e preocupação com o bem-estar do paciente. O e-mail deve:
1.  Começar de forma pessoal, usando o nome do paciente.
2.  Mencionar o nome do último fisioterapeuta que o atendeu para criar uma conexão.
3.  Perguntar como ele tem se sentido desde a última visita.
4.  Lembrá-lo da importância de dar continuidade ao tratamento para evitar o retorno dos sintomas.
5.  Finalizar com um call-to-action (CTA) amigável para agendar uma consulta de reavaliação, incluindo um link para o portal de agendamento.

# Variáveis a serem usadas no e-mail
- \`{{nome_paciente}}\`
- \`{{nome_ultimo_fisio}}\`
- \`{{link_agendamento}}\`

# Formato de Saída (Obrigatório em HTML)
O resultado deve ser **APENAS o código HTML** do corpo do e-mail, sem \`\`\`html, markdown ou qualquer outra formatação. Utilize exatamente o seguinte HTML como base:

<p>Olá, {{nome_paciente}}, tudo bem?</p>
<p>Faz um tempinho que não nos vemos aqui na FisioFlow e ficamos pensando em você. Eu e o(a) Dr(a). {{nome_ultimo_fisio}} estávamos comentando sobre a sua evolução e gostaríamos de saber como você tem passado.</p>
<p>Lembre-se que a continuidade do tratamento é fundamental para manter os resultados que conquistamos juntos e prevenir que o desconforto retorne. O cuidado com seu corpo é um investimento contínuo na sua qualidade de vida!</p>
<p>Que tal agendar uma consulta de reavaliação para vermos como você está? Será ótimo te rever e garantir que tudo continua bem.</p>
<p><a href="{{link_agendamento}}" style="background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Horários Disponíveis</a></p>
<p>Um grande abraço,<br>
Equipe FisioFlow</p>
`;
    
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        let htmlContent = response.text();
        
        // Cleanup response in case the model adds markdown fences
        htmlContent = htmlContent.replace(/^```html\n/, '').replace(/\n```$/, '').trim();

        return htmlContent;
    } catch (error) {
        console.error("Error generating inactive patient email:", error);
        throw new Error("Falha ao gerar o e-mail com a IA. Por favor, tente novamente.");
    }
};


const PROMPT_TEMPLATE_MATERIAL_CONTENT = `
# Persona
Você é um Fisioterapeuta e Educador Clínico. Sua especialidade é pegar conceitos técnicos e materiais complexos e transformá-los em conteúdo didático, claro e aplicável para outros profissionais.

# Contexto
Um fisioterapeuta na plataforma FisioFlow selecionou o material "{{nome_material}}" da biblioteca para consulta. Precisamos gerar o conteúdo detalhado desta página.

# Tarefa
Com base no tipo e no nome do material, gere o conteúdo explicativo em formato Markdown. O conteúdo deve ser bem estruturado, informativo e prático.
- Se for uma **Escala de Avaliação** (ex: Escala Visual de Dor), explique o que é, como aplicar, como interpretar os resultados e inclua uma representação visual (pode ser uma tabela ou descrição).
- Se for um **Protocolo Clínico** (ex: Protocolo Pós-Artroplastia de Joelho), estruture o conteúdo em fases (ex: Pré-operatório, Pós-operatório 0-2 semanas, 2-6 semanas), detalhando os objetivos e condutas para cada fase.
- Se for um **Material de Orientação**, crie um texto claro e direto que o fisioterapeuta possa usar para educar o paciente.

# Detalhes do Material
- Nome do Material: "{{nome_material}}"
- Tipo do Material: "{{tipo_material}}"

# Formato de Saída (Obrigatório em Markdown)
## {{nome_material}}

### O que é?
(Gere uma explicação concisa sobre o propósito do material).

### Como Utilizar
(Gere um guia passo-a-passo sobre como aplicar o material na prática clínica).

### Interpretação / Fases do Protocolo
(Gere a seção principal. Se for uma escala, explique a pontuação. Se for um protocolo, detalhe as fases em subtítulos ###, como "Fase 1: 0-2 Semanas Pós-Operatório", incluindo **Objetivos:** e **Condutas Sugeridas:** para cada fase).

### Dicas Clínicas e Considerações
(Adicione 2-3 dicas práticas ou pontos de atenção para o fisioterapeuta).
`;

export const generateClinicalMaterialContent = async (data: ClinicalMaterialData): Promise<string> => {
    let prompt = PROMPT_TEMPLATE_MATERIAL_CONTENT;
    
    prompt = prompt.replace(new RegExp(`{{nome_material}}`, 'g'), data.nome_material);
    prompt = prompt.replace(new RegExp(`{{tipo_material}}`, 'g'), data.tipo_material);
    
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating clinical material content:", error);
        throw new Error("Falha ao gerar o conteúdo do material com a IA.");
    }
};

const PROMPT_TEMPLATE_PARSE_PROTOCOL = `
# TAREFA
Você é um assistente especialista em fisioterapia. Sua função é analisar o conteúdo de um protocolo clínico em Markdown e extrair informações estruturadas para preencher um plano de tratamento.

# CONTEÚDO DO PROTOCOLO (MARKDOWN)
\`\`\`markdown
{{protocolContent}}
\`\`\`

# INSTRUÇÕES
1. Leia o conteúdo do protocolo e identifique os objetivos principais e os exercícios propostos.
2. Formule um único parágrafo conciso para o campo "treatmentGoals" que resuma os objetivos gerais do protocolo.
3. Extraia os exercícios mencionados. Para cada exercício, capture seu nome, o número de séries e as repetições. Se séries ou repetições não forem explicitamente mencionadas para um exercício, use valores padrão de 3 séries e 12 repetições.
4. Retorne os dados EXCLUSIVAMENTE no formato JSON especificado. Não inclua texto ou explicações adicionais.
`;

export interface ParsedTreatmentPlan {
    treatmentGoals: string;
    exercises: { 
        exerciseName: string; 
        sets: number; 
        repetitions: string; 
    }[];
}

export const parseProtocolForTreatmentPlan = async (protocolContent: string): Promise<ParsedTreatmentPlan> => {
    const prompt = PROMPT_TEMPLATE_PARSE_PROTOCOL.replace('{{protocolContent}}', protocolContent);

    try {
        const model = ai.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;

        const jsonStr = response.text().trim();
        return JSON.parse(jsonStr) as ParsedTreatmentPlan;
    } catch (error) {
        console.error("Error parsing protocol with Gemini:", error);
        throw new Error("Falha ao analisar o protocolo com a IA.");
    }
};

const PROMPT_TEMPLATE_CLINICAL_SUMMARY = `
# Persona
Você é um Fisioterapeuta Sênior, especialista em análise de dados clínicos e reabilitação. Sua tarefa é analisar o progresso de um paciente e fornecer um resumo conciso e acionável para o fisioterapeuta responsável.

# Contexto
Paciente: {{nome_paciente}}
Diagnóstico Principal: {{diagnostico}}
Histórico de Sessões (SOAP - Subjetivo, Avaliação):
{{historico_sessoes}}

# Tarefa
Analise o histórico de sessões e gere um resumo do progresso clínico do paciente. Organize a resposta nas seguintes seções em formato Markdown:

### Resumo da Evolução
(Um parágrafo conciso sobre a jornada geral do paciente, se está progredindo, estagnado ou regredindo.)

### Pontos-Chave de Melhora
(Liste 2-3 melhoras objetivas observadas. Ex: "Redução da dor de 8/10 para 3/10", "Aumento da ADM de flexão do joelho em 20 graus".)

### Pontos de Atenção
(Liste 1-2 pontos que requerem atenção ou que não estão evoluindo como esperado. Ex: "Persistência da dor ao final da ADM", "Relato de dificuldade com exercícios domiciliares".)

### Sugestões
(Sugira uma ou duas ações para a próxima fase do tratamento. Ex: "Progredir para exercícios de fortalecimento em cadeia cinética fechada", "Revisar e ajustar o plano de exercícios domiciliares".)
`;

export const generatePatientClinicalSummary = async (patient: Patient, notes: SoapNote[]): Promise<string> => {
    if (notes.length < 2) {
        return "Dados insuficientes para gerar um resumo. São necessárias pelo menos duas sessões registradas.";
    }

    const historico_sessoes = notes
        .slice(0, 5) // Use the 5 most recent notes
        .reverse() // Oldest first
        .map(n => `- Data: ${n.date}, Dor: ${n.painScale}/10, S: ${n.subjective}, A: ${n.assessment}`)
        .join('\n');

    let prompt = PROMPT_TEMPLATE_CLINICAL_SUMMARY
        .replace('{{nome_paciente}}', patient.name)
        .replace('{{diagnostico}}', patient.conditions?.[0]?.name || 'Não especificado')
        .replace('{{historico_sessoes}}', historico_sessoes);
        
    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating clinical summary:", error);
        throw new Error("Falha ao gerar o resumo clínico com a IA.");
    }
};

const PROMPT_TEMPLATE_RETENTION = `
# Persona
Você é um Coordenador de Cuidados ao Paciente, especialista em comunicação empática e reengajamento. Seu objetivo é ajudar fisioterapeutas a contatar pacientes em risco de abandono de forma proativa e acolhedora.

# Contexto
O paciente {{nome_paciente}} foi sinalizado no painel de acompanhamento pelo seguinte motivo: "{{motivo_alerta}}". Precisamos criar uma mensagem curta e amigável para ser enviada via WhatsApp.

# Tarefa
Crie uma sugestão de mensagem de WhatsApp para o fisioterapeuta enviar ao paciente. A mensagem deve:
1. Ser pessoal e amigável, usando o primeiro nome do paciente.
2. Reconhecer o motivo do alerta de forma sutil e sem culpa (ex: "Notei que não conseguimos encontrar um novo horário para você").
3. Mostrar preocupação com o bem-estar e a continuidade do tratamento do paciente.
4. Ser proativa, oferecendo ajuda para reagendar ou discutir o tratamento.
5. Ter um tom positivo e encorajador.
6. Finalizar com uma saudação cordial e o nome do fisioterapeuta responsável (use "Dr(a). [Seu Nome]").

# Formato de Saída (Obrigatório em Markdown, apenas o texto da mensagem)
`;

export interface RetentionSuggestionData {
    nome_paciente: string;
    motivo_alerta: string;
}

export const generateRetentionSuggestion = async (data: RetentionSuggestionData): Promise<string> => {
    let prompt = PROMPT_TEMPLATE_RETENTION
        .replace(new RegExp(`{{nome_paciente}}`, 'g'), data.nome_paciente.split(' ')[0])
        .replace(new RegExp(`{{motivo_alerta}}`, 'g'), data.motivo_alerta);

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error generating retention suggestion:", error);
        throw new Error("Falha ao gerar a sugestão com a IA.");
    }
};
