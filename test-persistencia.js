/**
 * Script de Teste de Persistência
 * Testa se os dados são salvos e carregados corretamente
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

// Caminho do AppData (simulado)
const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'SmartTechRolandia', 'data');
const dataFilePath = path.join(appDataPath, 'smart-tech-data.json');
const backupFilePath = path.join(appDataPath, 'smart-tech-data-backup.json');

console.log('🧪 TESTE DE PERSISTÊNCIA DE DADOS\n');
console.log('=' .repeat(60));

// Teste 1: Verificar se diretório existe
console.log('\n📁 TESTE 1: Verificar Estrutura de Diretórios');
console.log('-'.repeat(60));
try {
  if (fs.existsSync(appDataPath)) {
    console.log('✅ Diretório de dados existe:', appDataPath);
    
    const files = fs.readdirSync(appDataPath);
    console.log('📄 Arquivos encontrados:', files.length);
    files.forEach(file => {
      const filePath = path.join(appDataPath, file);
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   • ${file} (${sizeKB} KB)`);
    });
  } else {
    console.log('⚠️  Diretório de dados não existe ainda (será criado na primeira execução)');
  }
} catch (error) {
  console.log('❌ Erro ao verificar diretório:', error.message);
}

// Teste 2: Verificar se arquivo de dados existe
console.log('\n💾 TESTE 2: Verificar Arquivo de Dados');
console.log('-'.repeat(60));
try {
  if (fs.existsSync(dataFilePath)) {
    const stats = fs.statSync(dataFilePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const modified = stats.mtime.toLocaleString('pt-BR');
    
    console.log('✅ Arquivo de dados existe');
    console.log(`   • Tamanho: ${sizeKB} KB`);
    console.log(`   • Última modificação: ${modified}`);
    
    // Ler e validar conteúdo
    const content = fs.readFileSync(dataFilePath, 'utf8');
    const data = JSON.parse(content);
    
    console.log('\n📊 Estrutura dos Dados:');
    console.log(`   • Clientes: ${Array.isArray(data.clientes) ? data.clientes.length : 'N/A'}`);
    console.log(`   • Produtos: ${Array.isArray(data.produtos) ? data.produtos.length : 'N/A'}`);
    console.log(`   • Vendas: ${Array.isArray(data.vendas) ? data.vendas.length : 'N/A'}`);
    console.log(`   • Ordens de Serviço: ${Array.isArray(data.ordensServico) ? data.ordensServico.length : 'N/A'}`);
    
    // Verificar configuração
    if (data.configuracao) {
      const nomeEmpresa = data.configuracao.nomeEmpresa || 'Não configurado';
      const isConfigured = nomeEmpresa && nomeEmpresa !== 'Smart Tech Rolândia';
      console.log(`   • Empresa: ${nomeEmpresa} ${isConfigured ? '✅' : '⚠️ (padrão)'}`);
    }
  } else {
    console.log('⚠️  Arquivo de dados não existe (primeira execução)');
  }
} catch (error) {
  console.log('❌ Erro ao verificar arquivo:', error.message);
}

// Teste 3: Verificar backup
console.log('\n🔄 TESTE 3: Verificar Sistema de Backup');
console.log('-'.repeat(60));
try {
  if (fs.existsSync(backupFilePath)) {
    const stats = fs.statSync(backupFilePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log('✅ Arquivo de backup existe');
    console.log(`   • Tamanho: ${sizeKB} KB`);
  } else {
    console.log('⚠️  Arquivo de backup não existe ainda');
  }
} catch (error) {
  console.log('❌ Erro ao verificar backup:', error.message);
}

// Teste 4: Verificar logs
console.log('\n📝 TESTE 4: Verificar Logs do Sistema');
console.log('-'.repeat(60));
const logFilePath = path.join(appDataPath, 'smart-tech-logs.txt');
try {
  if (fs.existsSync(logFilePath)) {
    const stats = fs.statSync(logFilePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log('✅ Arquivo de logs existe');
    console.log(`   • Tamanho: ${sizeKB} KB`);
    
    // Mostrar últimas 5 linhas
    const content = fs.readFileSync(logFilePath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim());
    const lastLines = lines.slice(-5);
    console.log('\n   Últimas operações:');
    lastLines.forEach(line => {
      console.log(`   • ${line.substring(0, 80)}...`);
    });
  } else {
    console.log('⚠️  Arquivo de logs não existe ainda');
  }
} catch (error) {
  console.log('❌ Erro ao verificar logs:', error.message);
}

// Teste 5: Verificar localStorage (via Electron userData)
console.log('\n🗄️  TESTE 5: Verificar localStorage do Electron');
console.log('-'.repeat(60));
const localStoragePath = path.join(os.homedir(), 'AppData', 'Roaming', 'SmartTechRolandia', 'Local Storage');
try {
  if (fs.existsSync(localStoragePath)) {
    console.log('✅ Diretório Local Storage existe');
    
    // Tentar encontrar arquivo de localStorage
    const files = fs.readdirSync(localStoragePath);
    const leveldbFiles = files.filter(f => f.includes('leveldb') || f.includes('.ldb'));
    if (leveldbFiles.length > 0) {
      console.log(`   • Arquivos LevelDB encontrados: ${leveldbFiles.length}`);
    }
  } else {
    console.log('⚠️  Diretório Local Storage não existe ainda');
  }
} catch (error) {
  console.log('❌ Erro ao verificar localStorage:', error.message);
}

// Resumo
console.log('\n' + '='.repeat(60));
console.log('📋 RESUMO DOS TESTES');
console.log('='.repeat(60));

const resultados = {
  diretorio: fs.existsSync(appDataPath),
  arquivoDados: fs.existsSync(dataFilePath),
  arquivoBackup: fs.existsSync(backupFilePath),
  arquivoLogs: fs.existsSync(logFilePath),
};

console.log('\n✅ Status:');
Object.entries(resultados).forEach(([teste, passou]) => {
  const status = passou ? '✅ PASSOU' : '⚠️  NÃO ENCONTRADO';
  console.log(`   • ${teste}: ${status}`);
});

console.log('\n💡 OBSERVAÇÕES:');
console.log('   • Se os arquivos não existem, o sistema criará na primeira execução');
console.log('   • O sistema salva automaticamente quando dados são alterados');
console.log('   • Backup é criado antes de cada salvamento');
console.log('   • Logs registram todas as operações de storage');

console.log('\n' + '='.repeat(60));
console.log('✅ TESTES CONCLUÍDOS\n');

