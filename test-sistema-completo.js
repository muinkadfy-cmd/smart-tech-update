/**
 * Script de Teste Completo do Sistema
 * Simula uso real como usuário final em produção
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const APP_DATA_PATH = path.join(os.homedir(), 'AppData', 'Roaming', 'SmartTechRolandia', 'data');
const DATA_FILE = path.join(APP_DATA_PATH, 'smart-tech-data.json');
const LOG_FILE = path.join(APP_DATA_PATH, 'smart-tech-logs.txt');

console.log('🧪 TESTE COMPLETO DO SISTEMA - SIMULAÇÃO DE USO REAL\n');
console.log('='.repeat(80));

// Resultados dos testes
const resultados = {
  estrutura: { passou: false, erros: [] },
  persistencia: { passou: false, erros: [] },
  vendas: { passou: false, erros: [] },
  financeiro: { passou: false, erros: [] },
  backup: { passou: false, erros: [] },
  navegacao: { passou: false, erros: [] },
};

// TESTE 1: Verificar Estrutura de Dados
console.log('\n📋 TESTE 1: Estrutura de Dados e Arquivos');
console.log('-'.repeat(80));

try {
  // Verificar diretório
  if (!fs.existsSync(APP_DATA_PATH)) {
    resultados.estrutura.erros.push('Diretório de dados não existe');
    console.log('⚠️  Diretório não existe (será criado na primeira execução)');
  } else {
    console.log('✅ Diretório de dados existe:', APP_DATA_PATH);
    resultados.estrutura.passou = true;
  }

  // Verificar arquivo de dados
  if (fs.existsSync(DATA_FILE)) {
    const stats = fs.statSync(DATA_FILE);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Arquivo de dados existe: ${sizeKB} KB`);
    
    // Validar estrutura JSON
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(content);
      
      // Verificar campos obrigatórios
      const camposObrigatorios = [
        'clientes', 'produtos', 'vendas', 'transacoes',
        'ordensServico', 'tecnicos', 'configuracao'
      ];
      
      const camposFaltando = camposObrigatorios.filter(campo => !(campo in data));
      
      if (camposFaltando.length > 0) {
        resultados.estrutura.erros.push(`Campos faltando: ${camposFaltando.join(', ')}`);
        console.log(`⚠️  Campos faltando: ${camposFaltando.join(', ')}`);
      } else {
        console.log('✅ Todos os campos obrigatórios presentes');
        resultados.estrutura.passou = true;
      }
      
      // Verificar se não há dados mock
      const temDadosMock = 
        (data.clientes && data.clientes.length > 0 && data.clientes.some(c => c.nome?.includes('Test'))) ||
        (data.produtos && data.produtos.length > 0 && data.produtos.some(p => p.nome?.includes('Test')));
      
      if (temDadosMock) {
        resultados.estrutura.erros.push('Dados de teste/mock encontrados');
        console.log('⚠️  Dados de teste encontrados no arquivo');
      } else {
        console.log('✅ Nenhum dado de teste encontrado');
      }
      
    } catch (parseError) {
      resultados.estrutura.erros.push(`Erro ao parsear JSON: ${parseError.message}`);
      console.log(`❌ Erro ao parsear JSON: ${parseError.message}`);
    }
  } else {
    console.log('⚠️  Arquivo de dados não existe (primeira execução)');
  }

  // Verificar logs
  if (fs.existsSync(LOG_FILE)) {
    const stats = fs.statSync(LOG_FILE);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`✅ Arquivo de logs existe: ${sizeKB} KB`);
    
    // Mostrar últimas 5 linhas
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const lastLines = lines.slice(-5);
    console.log('\n   Últimas operações:');
    lastLines.forEach(line => {
      console.log(`   • ${line.substring(0, 70)}...`);
    });
  } else {
    console.log('⚠️  Arquivo de logs não existe ainda');
  }
} catch (error) {
  resultados.estrutura.erros.push(`Erro geral: ${error.message}`);
  console.log(`❌ Erro: ${error.message}`);
}

// TESTE 2: Verificar Persistência
console.log('\n💾 TESTE 2: Sistema de Persistência');
console.log('-'.repeat(80));

try {
  if (fs.existsSync(DATA_FILE)) {
    const stats = fs.statSync(DATA_FILE);
    const lastModified = new Date(stats.mtime);
    const now = new Date();
    const diffMinutes = (now - lastModified) / (1000 * 60);
    
    console.log(`📅 Última modificação: ${lastModified.toLocaleString('pt-BR')}`);
    console.log(`⏱️  Há ${Math.round(diffMinutes)} minutos`);
    
    if (diffMinutes < 60) {
      console.log('✅ Arquivo foi modificado recentemente (persistência ativa)');
      resultados.persistencia.passou = true;
    } else {
      console.log('⚠️  Arquivo não foi modificado recentemente');
      resultados.persistencia.erros.push('Arquivo não foi modificado recentemente');
    }
    
    // Verificar backup
    const backupFile = path.join(APP_DATA_PATH, 'smart-tech-data-backup.json');
    if (fs.existsSync(backupFile)) {
      console.log('✅ Backup automático existe');
    } else {
      console.log('⚠️  Backup automático não existe');
    }
  } else {
    resultados.persistencia.erros.push('Arquivo de dados não existe');
    console.log('⚠️  Arquivo de dados não existe');
  }
} catch (error) {
  resultados.persistencia.erros.push(`Erro: ${error.message}`);
  console.log(`❌ Erro: ${error.message}`);
}

// TESTE 3: Validar Estrutura de Dados Financeiros
console.log('\n💰 TESTE 3: Estrutura de Dados Financeiros');
console.log('-'.repeat(80));

try {
  if (fs.existsSync(DATA_FILE)) {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(content);
    
    // Verificar transações
    if (data.transacoes && Array.isArray(data.transacoes)) {
      console.log(`✅ Transações: ${data.transacoes.length} registros`);
      
      // Validar estrutura de transações
      const transacoesInvalidas = data.transacoes.filter(t => 
        !t.id || !t.tipo || !t.valor || !t.status
      );
      
      if (transacoesInvalidas.length > 0) {
        resultados.financeiro.erros.push(`${transacoesInvalidas.length} transações inválidas`);
        console.log(`⚠️  ${transacoesInvalidas.length} transações com estrutura inválida`);
      } else {
        console.log('✅ Todas as transações têm estrutura válida');
        resultados.financeiro.passou = true;
      }
    } else {
      resultados.financeiro.erros.push('Transações não é um array');
      console.log('⚠️  Transações não é um array válido');
    }
    
    // Verificar vendas
    if (data.vendas && Array.isArray(data.vendas)) {
      console.log(`✅ Vendas: ${data.vendas.length} registros`);
      
      // Validar estrutura de vendas
      const vendasInvalidas = data.vendas.filter(v => 
        !v.id || !v.numero || !v.total
      );
      
      if (vendasInvalidas.length > 0) {
        resultados.vendas.erros.push(`${vendasInvalidas.length} vendas inválidas`);
        console.log(`⚠️  ${vendasInvalidas.length} vendas com estrutura inválida`);
      } else {
        console.log('✅ Todas as vendas têm estrutura válida');
        resultados.vendas.passou = true;
      }
    } else {
      resultados.vendas.erros.push('Vendas não é um array');
      console.log('⚠️  Vendas não é um array válido');
    }
  }
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// TESTE 4: Verificar Integridade dos Dados
console.log('\n🔍 TESTE 4: Integridade dos Dados');
console.log('-'.repeat(80));

try {
  if (fs.existsSync(DATA_FILE)) {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(content);
    
    // Verificar IDs únicos
    const idsClientes = data.clientes?.map(c => c.id) || [];
    const idsUnicosClientes = new Set(idsClientes);
    if (idsClientes.length !== idsUnicosClientes.size) {
      resultados.estrutura.erros.push('IDs duplicados em clientes');
      console.log('⚠️  IDs duplicados encontrados em clientes');
    } else {
      console.log('✅ IDs de clientes são únicos');
    }
    
    // Verificar IDs de produtos
    const idsProdutos = data.produtos?.map(p => p.id) || [];
    const idsUnicosProdutos = new Set(idsProdutos);
    if (idsProdutos.length !== idsUnicosProdutos.size) {
      resultados.estrutura.erros.push('IDs duplicados em produtos');
      console.log('⚠️  IDs duplicados encontrados em produtos');
    } else {
      console.log('✅ IDs de produtos são únicos');
    }
    
    // Verificar números de venda únicos
    if (data.vendas && data.vendas.length > 0) {
      const numerosVenda = data.vendas.map(v => v.numero);
      const numerosUnicos = new Set(numerosVenda);
      if (numerosVenda.length !== numerosUnicos.size) {
        resultados.vendas.erros.push('Números de venda duplicados');
        console.log('⚠️  Números de venda duplicados encontrados');
      } else {
        console.log('✅ Números de venda são únicos');
      }
    }
  }
} catch (error) {
  console.log(`❌ Erro: ${error.message}`);
}

// RESUMO FINAL
console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO DOS TESTES');
console.log('='.repeat(80));

const todosTestes = Object.entries(resultados);
let totalPassou = 0;
let totalErros = 0;

todosTestes.forEach(([teste, resultado]) => {
  const status = resultado.passou ? '✅ PASSOU' : '❌ FALHOU';
  console.log(`\n${teste.toUpperCase()}: ${status}`);
  
  if (resultado.passou) {
    totalPassou++;
  } else {
    totalErros++;
  }
  
  if (resultado.erros.length > 0) {
    console.log('   Erros encontrados:');
    resultado.erros.forEach(erro => {
      console.log(`   • ${erro}`);
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log(`✅ Testes que passaram: ${totalPassou}/${todosTestes.length}`);
console.log(`❌ Testes que falharam: ${totalErros}/${todosTestes.length}`);
console.log('='.repeat(80));

// Status geral
if (totalErros === 0) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM!');
} else {
  console.log('\n⚠️  ALGUNS TESTES FALHARAM - REVISAR ERROS ACIMA');
}

console.log('\n');

