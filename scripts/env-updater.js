#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class EnvFileUpdater {
  constructor(envPath) {
    this.envPath = envPath;
    this.content = '';
    this.variables = new Map();
    this.sections = [];
  }

  // Ler e parsear o arquivo .env
  read() {
    if (fs.existsSync(this.envPath)) {
      this.content = fs.readFileSync(this.envPath, 'utf8');
      this.parseContent();
    }
    return this;
  }

  // Parsear o conteúdo preservando comentários e estrutura
  parseContent() {
    const lines = this.content.split('\n');
    let currentSection = null;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Detectar seções (comentários com ===)
      if (trimmedLine.includes('='.repeat(10))) {
        const sectionMatch = trimmedLine.match(/# (.+)/);;
        if (sectionMatch) {
          currentSection = sectionMatch[1].trim();
          this.sections.push({
            name: currentSection,
            startLine: index,
            lines: []
          });
        }
      }
      
      // Detectar variáveis
      if (line.includes('=') && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          this.variables.set(key.trim(), {
            value: value,
            line: index,
            section: currentSection,
            originalLine: line
          });
        }
      }
      
      // Adicionar linha à seção atual
      if (currentSection && this.sections.length > 0) {
        this.sections[this.sections.length - 1].lines.push({
          content: line,
          index: index,
          isVariable: line.includes('=') && !line.trim().startsWith('#')
        });
      }
    });
  }

  // Atualizar uma variável específica
  updateVariable(key, value, comment = null) {
    if (this.variables.has(key)) {
      const variable = this.variables.get(key);
      variable.value = value;
      variable.updated = true;
      if (comment) {
        variable.comment = comment;
      }
    } else {
      // Adicionar nova variável
      this.variables.set(key, {
        value: value,
        line: -1,
        section: null,
        isNew: true,
        comment: comment
      });
    }
    return this;
  }

  // Atualizar múltiplas variáveis
  updateVariables(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      if (typeof value === 'object' && value.value !== undefined) {
        this.updateVariable(key, value.value, value.comment);
      } else {
        this.updateVariable(key, value);
      }
    });
    return this;
  }

  // Gerar o conteúdo atualizado
  generateContent() {
    const lines = this.content.split('\n');
    
    // Atualizar linhas existentes
    this.variables.forEach((variable, key) => {
      if (variable.line >= 0 && variable.updated) {
        const newLine = `${key}=${variable.value}`;
        lines[variable.line] = newLine;
      }
    });

    // Adicionar novas variáveis no final das seções apropriadas
    this.variables.forEach((variable, key) => {
      if (variable.isNew) {
        const newLine = `${key}=${variable.value}`;
        if (variable.comment) {
          lines.push(`# ${variable.comment}`);
        }
        lines.push(newLine);
      }
    });

    return lines.join('\n');
  }

  // Salvar o arquivo atualizado
  save() {
    const updatedContent = this.generateContent();
    fs.writeFileSync(this.envPath, updatedContent);
    return this;
  }

  // Fazer backup do arquivo original
  backup() {
    if (fs.existsSync(this.envPath)) {
      const backupPath = `${this.envPath}.backup.${Date.now()}`;
      fs.copyFileSync(this.envPath, backupPath);
      console.log(`✅ Backup criado: ${backupPath}`);
    }
    return this;
  }

  // Validar se as variáveis obrigatórias estão presentes
  validate(requiredVars = []) {
    const missing = [];
    const invalid = [];

    requiredVars.forEach(varName => {
      if (!this.variables.has(varName)) {
        missing.push(varName);
      } else {
        const value = this.variables.get(varName).value;
        if (!value || value.includes('your_') || value.includes('_here')) {
          invalid.push(varName);
        }
      }
    });

    return {
      isValid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid
    };
  }

  // Mostrar resumo das mudanças
  showSummary() {
    console.log('\n📋 Resumo das atualizações:');
    
    let updatedCount = 0;
    let newCount = 0;
    
    this.variables.forEach((variable, key) => {
      if (variable.updated) {
        console.log(`   ✏️  ${key}: atualizado`);
        updatedCount++;
      } else if (variable.isNew) {
        console.log(`   ➕ ${key}: adicionado`);
        newCount++;
      }
    });

    console.log(`\n📊 Total: ${updatedCount} atualizadas, ${newCount} adicionadas`);
    return this;
  }

  // Método estático para atualização rápida
  static updateEnvFile(envPath, updates, options = {}) {
    const updater = new EnvFileUpdater(envPath);
    
    if (options.backup !== false) {
      updater.backup();
    }
    
    updater
      .read()
      .updateVariables(updates)
      .save();
    
    if (options.showSummary !== false) {
      updater.showSummary();
    }
    
    if (options.validate) {
      const validation = updater.validate(options.validate);
      if (!validation.isValid) {
        console.log('\n⚠️  Validação:');
        if (validation.missing.length > 0) {
          console.log(`   ❌ Variáveis faltando: ${validation.missing.join(', ')}`);
        }
        if (validation.invalid.length > 0) {
          console.log(`   ⚠️  Variáveis com valores padrão: ${validation.invalid.join(', ')}`);
        }
      } else {
        console.log('\n✅ Todas as variáveis obrigatórias estão configuradas!');
      }
    }
    
    return updater;
  }
}

module.exports = EnvFileUpdater;