#!/usr/bin/env node

/**
 * Sistema Integrado de Importação com IA - FisioFlow
 * Importação em massa de exercícios com categorização automática via IA
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const { performance } = require('perf_hooks');

class AIExerciseImporter {
  constructor() {
    this.prisma = new PrismaClient();
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      categorized: 0,
      approved: 0,
      duplicates: 0,
      errors: []
    };
    this.startTime = performance.now();
    this.batchSize = 50;
    this.confidenceThreshold = 75;
    this.apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  async start(filePath, options = {}) {
    console.log(`🚀 Iniciando importação com IA de exercícios...`);
    console.log(`📁 Arquivo: ${filePath}`);
    console.log(`🤖 Threshold de confiança: ${this.confidenceThreshold}%`);
    
    try {
      // Carregar dados
      const exercises = await this.loadData(filePath);
      console.log(`📊 ${exercises.length} exercícios carregados`);
      
      // Processar em lotes
      const batches = this.createBatches(exercises, this.batchSize);
      console.log(`📦 ${batches.length} lotes para processar`);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`\n🔄 Processando lote ${i + 1}/${batches.length} (${batch.length} exercícios)...`);
        
        await this.processBatch(batch, options);
        
        // Status update
        const progress = ((i + 1) / batches.length * 100).toFixed(1);
        console.log(`✅ Lote ${i + 1} concluído - Progresso: ${progress}%`);
        
        // Small delay between batches
        if (i < batches.length - 1) {
          await this.delay(1000);
        }
      }
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Erro na importação:', error);
      this.stats.errors.push(`Erro geral: ${error.message}`);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async loadData(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const data = await fs.readFile(filePath, 'utf8');
    
    if (ext === '.json') {
      return JSON.parse(data);
    } else if (ext === '.csv') {
      return this.parseCSV(data);
    } else {
      throw new Error(`Formato não suportado: ${ext}`);
    }
  }

  parseCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const exercises = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const exercise = {};
        headers.forEach((header, index) => {
          exercise[header] = values[index]?.trim() || '';
        });
        exercises.push(exercise);
      }
    }
    
    return exercises;
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  async processBatch(exercises, options) {
    const batchPromises = exercises.map(exercise => this.processExercise(exercise, options));
    const results = await Promise.allSettled(batchPromises);
    
    results.forEach((result, index) => {
      this.stats.processed++;
      
      if (result.status === 'fulfilled' && result.value.success) {
        this.stats.successful++;
        if (result.value.categorized) this.stats.categorized++;
        if (result.value.approved) this.stats.approved++;
      } else {
        this.stats.failed++;
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        this.stats.errors.push(`Exercício ${exercises[index].name}: ${error}`);
      }
    });
  }

  async processExercise(exercise, options) {
    try {
      // Validar dados básicos
      if (!exercise.name || !exercise.description) {
        return { success: false, error: 'Nome e descrição são obrigatórios' };
      }
      
      // Verificar duplicatas
      const existing = await this.checkDuplicate(exercise);
      if (existing) {
        this.stats.duplicates++;
        return { success: false, error: 'Exercício duplicado encontrado' };
      }
      
      // Normalizar dados
      const normalizedExercise = this.normalizeExercise(exercise);
      
      // Categorizar com IA
      const aiAnalysis = await this.categorizeWithAI(normalizedExercise);
      
      // Criar exercício no banco
      const exerciseId = await this.createExercise(normalizedExercise, aiAnalysis);
      
      // Determinar se deve ser auto-aprovado
      const shouldApprove = aiAnalysis.confidence >= this.confidenceThreshold && options.autoApprove;
      
      if (shouldApprove) {
        await this.approveExercise(exerciseId, aiAnalysis);
      } else {
        await this.createApprovalRequest(exerciseId, aiAnalysis);
      }
      
      return { 
        success: true, 
        categorized: true, 
        approved: shouldApprove,
        exerciseId: exerciseId
      };
      
    } catch (error) {
      console.error(`Erro ao processar exercício ${exercise.name}:`, error);
      return { success: false, error: error.message };
    }
  }

  async checkDuplicate(exercise) {
    // Check for exact name match
    const exactMatch = await this.prisma.exercises.findFirst({
      where: { name: { equals: exercise.name, mode: 'insensitive' } }
    });
    
    if (exactMatch) return exactMatch;
    
    // Check for similar names using basic similarity
    const similarExercises = await this.prisma.exercises.findMany({
      where: { name: { contains: exercise.name.split(' ')[0], mode: 'insensitive' } },
      select: { id: true, name: true }
    });
    
    for (const similar of similarExercises) {
      const similarity = this.calculateSimilarity(exercise.name, similar.name);
      if (similarity > 0.85) {
        return similar;
      }
    }
    
    return null;
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  normalizeExercise(exercise) {
    return {
      name: exercise.name.trim(),
      description: exercise.description?.trim() || '',
      instructions: exercise.instructions?.trim() || '',
      body_parts: this.parseArray(exercise.body_parts || exercise.bodyParts),
      equipment: this.parseArray(exercise.equipment),
      difficulty: this.normalizeDifficulty(exercise.difficulty),
      indications: this.parseArray(exercise.indications),
      contraindications: this.parseArray(exercise.contraindications),
      video_url: exercise.video_url || exercise.videoUrl,
      thumbnail_url: exercise.thumbnail_url || exercise.thumbnailUrl,
      duration: exercise.duration ? parseInt(exercise.duration) : null
    };
  }

  parseArray(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map(v => v.trim()).filter(v => v);
    }
    return [];
  }

  normalizeDifficulty(difficulty) {
    if (!difficulty) return 'intermediario';
    
    const normalized = difficulty.toLowerCase();
    if (normalized.includes('fácil') || normalized.includes('básico') || normalized.includes('iniciante')) {
      return 'iniciante';
    }
    if (normalized.includes('difícil') || normalized.includes('avançado') || normalized.includes('complexo')) {
      return 'avancado';
    }
    return 'intermediario';
  }

  async categorizeWithAI(exercise) {
    try {
      const response = await this.makeAPIRequest('/api/ai/categorize-exercise', {
        method: 'POST',
        body: JSON.stringify({
          name: exercise.name,
          description: exercise.description,
          instructions: exercise.instructions,
          bodyParts: exercise.body_parts,
          equipment: exercise.equipment,
          difficulty: exercise.difficulty
        })
      });
      
      if (response.success) {
        return response.analysis;
      } else {
        throw new Error(response.error || 'Falha na categorização');
      }
      
    } catch (error) {
      console.warn(`⚠️  Falha na categorização IA para ${exercise.name}:`, error.message);
      return this.getFallbackCategorization(exercise);
    }
  }

  getFallbackCategorization(exercise) {
    // Categorização básica sem IA
    return {
      categories: [{ category: 'geral', confidence: 50, reasoning: 'Categorização automática básica' }],
      suggestedBodyParts: exercise.body_parts || ['corpo todo'],
      suggestedEquipment: exercise.equipment || ['sem equipamento'],
      estimatedDifficulty: exercise.difficulty || 'intermediario',
      therapeuticGoals: ['fortalecimento muscular'],
      contraindications: [],
      confidence: 50
    };
  }

  async makeAPIRequest(endpoint, options) {
    return new Promise((resolve, reject) => {
      const url = `${this.apiUrl}${endpoint}`;
      const reqOptions = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      };
      
      const req = https.request(url, reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (error) {
            reject(new Error(`JSON parse error: ${error.message}`));
          }
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  }

  async createExercise(exercise, aiAnalysis) {
    const exerciseData = {
      id: `ex_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: exercise.name,
      description: exercise.description,
      category: aiAnalysis.categories[0]?.category,
      subcategory: aiAnalysis.categories[0]?.subcategory,
      body_parts: aiAnalysis.suggestedBodyParts,
      difficulty: aiAnalysis.estimatedDifficulty,
      equipment: aiAnalysis.suggestedEquipment,
      instructions: exercise.instructions ? [exercise.instructions] : [],
      video_url: exercise.video_url,
      thumbnail_url: exercise.thumbnail_url,
      duration: exercise.duration,
      indications: exercise.indications,
      contraindications: aiAnalysis.contraindications,
      therapeutic_goals: aiAnalysis.therapeuticGoals.join(','),
      status: 'pending_approval',
      ai_categorized: true,
      ai_confidence: aiAnalysis.confidence,
      ai_categorized_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const created = await this.prisma.exercises.create({
      data: exerciseData
    });
    
    return created.id;
  }

  async createApprovalRequest(exerciseId, aiAnalysis) {
    await this.prisma.exercise_approvals.create({
      data: {
        id: `approval_${exerciseId}_${Date.now()}`,
        exercise_id: exerciseId,
        status: 'pending',
        ai_analysis: JSON.stringify(aiAnalysis),
        submitted_by: 'ai_importer',
        submitted_at: new Date(),
        metadata: JSON.stringify({
          confidence: aiAnalysis.confidence,
          categories: aiAnalysis.categories,
          import_batch: new Date().toISOString()
        })
      }
    });
  }

  async approveExercise(exerciseId, aiAnalysis) {
    // Update exercise status
    await this.prisma.exercises.update({
      where: { id: exerciseId },
      data: { status: 'approved' }
    });
    
    // Create approval record
    await this.prisma.exercise_approvals.create({
      data: {
        id: `approval_${exerciseId}_${Date.now()}`,
        exercise_id: exerciseId,
        status: 'approved',
        ai_analysis: JSON.stringify(aiAnalysis),
        submitted_by: 'ai_importer',
        submitted_at: new Date(),
        reviewed_at: new Date(),
        comments: `Auto-aprovado pela IA com confiança de ${aiAnalysis.confidence}%`,
        metadata: JSON.stringify({
          auto_approved: true,
          confidence: aiAnalysis.confidence,
          threshold: this.confidenceThreshold
        })
      }
    });
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateReport() {
    const endTime = performance.now();
    const duration = (endTime - this.startTime) / 1000;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO DE IMPORTAÇÃO COM IA');
    console.log('='.repeat(80));
    console.log(`⏱️  Tempo total: ${duration.toFixed(2)}s`);
    console.log(`📊 Exercícios processados: ${this.stats.processed}`);
    console.log(`✅ Sucessos: ${this.stats.successful}`);
    console.log(`❌ Falhas: ${this.stats.failed}`);
    console.log(`🤖 Categorizados pela IA: ${this.stats.categorized}`);
    console.log(`✅ Auto-aprovados: ${this.stats.approved}`);
    console.log(`🔄 Duplicatas encontradas: ${this.stats.duplicates}`);
    console.log(`⚡ Taxa de sucesso: ${(this.stats.successful / this.stats.processed * 100).toFixed(1)}%`);
    console.log(`🔥 Velocidade: ${(this.stats.processed / duration).toFixed(1)} exercícios/seg`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      this.stats.errors.slice(0, 10).forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      
      if (this.stats.errors.length > 10) {
        console.log(`... e mais ${this.stats.errors.length - 10} erros`);
      }
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, `../reports/import_${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      duration: duration,
      stats: this.stats,
      configuration: {
        batchSize: this.batchSize,
        confidenceThreshold: this.confidenceThreshold,
        apiUrl: this.apiUrl
      }
    }, null, 2));
    
    console.log(`\n📝 Relatório detalhado salvo em: ${reportPath}`);
    console.log('='.repeat(80));
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Uso: node import-pathologies-and-templates.js <arquivo> [opções]');
    console.log('');
    console.log('Opções:');
    console.log('  --auto-approve    Auto-aprovar exercícios com alta confiança');
    console.log('  --batch-size <n>  Tamanho do lote (padrão: 50)');
    console.log('  --confidence <n>  Threshold de confiança (padrão: 75)');
    console.log('');
    console.log('Exemplo:');
    console.log('  node import-pathologies-and-templates.js exercises.json --auto-approve --confidence 80');
    process.exit(1);
  }
  
  const filePath = args[0];
  const options = {
    autoApprove: args.includes('--auto-approve'),
    batchSize: args.includes('--batch-size') ? parseInt(args[args.indexOf('--batch-size') + 1]) || 50 : 50,
    confidenceThreshold: args.includes('--confidence') ? parseInt(args[args.indexOf('--confidence') + 1]) || 75 : 75
  };
  
  const importer = new AIExerciseImporter();
  importer.batchSize = options.batchSize;
  importer.confidenceThreshold = options.confidenceThreshold;
  
  importer.start(filePath, options).catch(console.error);
}

module.exports = { AIExerciseImporter };