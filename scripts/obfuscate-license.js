/**
 * ============================================
 * SCRIPT DE OFUSCAÇÃO - LICENSE MANAGER
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Ofusca o arquivo license-manager.js para produção
 * 
 * Uso:
 *   node scripts/obfuscate-license.js
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import JavaScriptObfuscator from 'javascript-obfuscator';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceFile = path.join(__dirname, '../electron/license-manager.js');
const outputFile = path.join(__dirname, '../electron/license-manager.obfuscated.js');
const backupFile = path.join(__dirname, '../electron/license-manager.backup.js');

console.log('🔐 Ofuscador de Código - License Manager');
console.log('==========================================');
console.log('');

try {
  // Ler arquivo original
  console.log('📖 Lendo arquivo original...');
  const sourceCode = fs.readFileSync(sourceFile, 'utf8');
  
  // Criar backup
  console.log('💾 Criando backup...');
  fs.copyFileSync(sourceFile, backupFile);
  console.log(`✅ Backup criado: ${backupFile}`);
  
  // Configuração de ofuscação
  const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false, // Desabilitado para não quebrar em produção
    debugProtectionInterval: 0,
    disableConsoleOutput: false, // Manter console para logs de erro
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
  };
  
  // Ofuscar código
  console.log('🔒 Ofuscando código...');
  const obfuscationResult = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions);
  const obfuscatedCode = obfuscationResult.getObfuscatedCode();
  
  // Salvar arquivo ofuscado
  console.log('💾 Salvando arquivo ofuscado...');
  fs.writeFileSync(outputFile, obfuscatedCode, 'utf8');
  
  // Estatísticas
  const originalSize = Buffer.byteLength(sourceCode, 'utf8');
  const obfuscatedSize = Buffer.byteLength(obfuscatedCode, 'utf8');
  const sizeIncrease = ((obfuscatedSize - originalSize) / originalSize * 100).toFixed(2);
  
  console.log('');
  console.log('✅ Ofuscação concluída com sucesso!');
  console.log('');
  console.log('📊 Estatísticas:');
  console.log(`   Tamanho original: ${(originalSize / 1024).toFixed(2)} KB`);
  console.log(`   Tamanho ofuscado: ${(obfuscatedSize / 1024).toFixed(2)} KB`);
  console.log(`   Aumento: ${sizeIncrease}%`);
  console.log('');
  console.log('📁 Arquivos:');
  console.log(`   Original: ${sourceFile}`);
  console.log(`   Ofuscado: ${outputFile}`);
  console.log(`   Backup: ${backupFile}`);
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('   - O arquivo ofuscado será usado automaticamente em produção');
  console.log('   - Mantenha o backup seguro');
  console.log('   - Não commite o arquivo ofuscado no repositório');
  console.log('');
} catch (error) {
  console.error('❌ Erro ao ofuscar código:', error);
  process.exit(1);
}

