/**
 * ============================================
 * GERADOR DE LICENÇAS
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Script para gerar chaves de licença para clientes
 * 
 * Uso:
 *   node scripts/gerador-licenca.js <MACHINE_ID> <LICENSE_KEY>
 * 
 * Exemplo:
 *   node scripts/gerador-licenca.js abc123def456 LICENSE-KEY-123
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import crypto from 'crypto';

// Chave secreta (DEVE SER A MESMA DO license-manager.js)
const SECRET_KEY = process.env.SECRET_KEY || 'PROD_SECRET_KEY_SMART_TECH_ROLANDIA_2025_ENCRYPTED';

/**
 * Gera uma licença válida para um Machine ID específico
 */
function generateLicense(machineId, licenseKey) {
  if (!machineId || !licenseKey) {
    throw new Error('Machine ID e License Key são obrigatórios');
  }
  
  // Combinar Machine ID + License Key + Secret Key
  const combined = `${machineId}:${licenseKey}:${SECRET_KEY}`;
  
  // Gerar hash SHA256
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  return hash;
}

// Obter argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Erro: Argumentos insuficientes');
  console.log('');
  console.log('Uso: node scripts/gerador-licenca.js <MACHINE_ID> <LICENSE_KEY>');
  console.log('');
  console.log('Exemplo:');
  console.log('  node scripts/gerador-licenca.js abc123def456 LICENSE-KEY-123');
  console.log('');
  process.exit(1);
}

const machineId = args[0];
const licenseKey = args[1];

try {
  console.log('🔐 Gerador de Licença - Smart Tech Rolândia 2.0');
  console.log('================================================');
  console.log('');
  console.log('📌 Machine ID:', machineId);
  console.log('🔑 License Key:', licenseKey);
  console.log('');
  
  // Gerar hash da licença
  const licenseHash = generateLicense(machineId, licenseKey);
  
  console.log('✅ Licença gerada com sucesso!');
  console.log('');
  console.log('📋 Hash da Licença:');
  console.log(licenseHash);
  console.log('');
  console.log('📝 Informações para o cliente:');
  console.log('   Machine ID:', machineId);
  console.log('   Chave de Licença:', licenseKey);
  console.log('');
  console.log('⚠️  IMPORTANTE:');
  console.log('   - A chave de licença é específica para este Machine ID');
  console.log('   - Não compartilhe a chave secreta');
  console.log('   - Guarde o hash gerado para validação futura');
  console.log('');
} catch (error) {
  console.error('❌ Erro ao gerar licença:', error.message);
  process.exit(1);
}

