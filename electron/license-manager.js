/**
 * ============================================
 * LICENSE MANAGER - Sistema de Licença Offline
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Sistema profissional de licenciamento offline baseado em:
 * - ID único do hardware (node-machine-id)
 * - Validação SHA256 com chave secreta
 * - Armazenamento criptografado local
 * - Bloqueio de execução se licença inválida
 * - Detecção de cópia para outro PC
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import machineId from 'node-machine-id';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detectar modo de desenvolvimento
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

// Chave secreta para validação (ofuscada em múltiplas camadas)
// IMPORTANTE: Esta chave é ofuscada para dificultar engenharia reversa
function getSecretKey() {
  if (isDev) {
    return 'DEV_SECRET_KEY_SMART_TECH_ROLANDIA_2025';
  }
  
  // Produção: chave ofuscada usando múltiplas camadas
  // Base64 + reversão + substituição
  const obfuscated = 'W1RZQ0hfU01BUlRfVEVDSCBST0xBTkRJQV8yMDI1X0VOQ1JZUFRFRF9QUk9EX1NFQ1JFVF9LRVk=';
  const decoded = Buffer.from(obfuscated, 'base64').toString('utf8');
  const reversed = decoded.split('').reverse().join('');
  const parts = reversed.split('_').reverse();
  return parts.join('_');
}

const SECRET_KEY = getSecretKey();

// Caminho do arquivo de licença
const userDataPath = app.getPath('userData');
const licenseFilePath = path.join(userDataPath, 'license.dat');

/**
 * Gera um ID único do hardware do PC
 * @returns {Promise<string>} ID único do hardware
 */
export async function getMachineId() {
  try {
    const id = await machineId.machineId();
    return id;
  } catch (error) {
    console.error('[License] Erro ao obter Machine ID:', error);
    // Fallback: usar informações do sistema
    const fallbackId = `${process.platform}-${process.arch}-${app.getPath('home')}`;
    return crypto.createHash('sha256').update(fallbackId).digest('hex').substring(0, 32);
  }
}

/**
 * Gera um ID único do hardware de forma síncrona (fallback)
 * @returns {string} ID único do hardware
 */
export function getMachineIdSync() {
  try {
    return machineId.machineIdSync();
  } catch (error) {
    console.error('[License] Erro ao obter Machine ID (sync):', error);
    const fallbackId = `${process.platform}-${process.arch}-${app.getPath('home')}`;
    return crypto.createHash('sha256').update(fallbackId).digest('hex').substring(0, 32);
  }
}

/**
 * Gera uma licença válida para um Machine ID específico
 * @param {string} machineId - ID único do hardware
 * @param {string} licenseKey - Chave de licença fornecida pelo usuário
 * @returns {string} Licença gerada (hash SHA256)
 */
export function generateLicense(machineId, licenseKey) {
  if (!machineId || !licenseKey) {
    throw new Error('Machine ID e License Key são obrigatórios');
  }
  
  // Combinar Machine ID + License Key + Secret Key
  const combined = `${machineId}:${licenseKey}:${SECRET_KEY}`;
  
  // Gerar hash SHA256
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  
  return hash;
}

/**
 * Valida uma licença
 * @param {string} licenseHash - Hash da licença armazenada
 * @param {string} machineId - ID único do hardware atual
 * @param {string} licenseKey - Chave de licença fornecida pelo usuário
 * @returns {boolean} true se a licença for válida
 */
export function validateLicense(licenseHash, machineId, licenseKey) {
  if (!licenseHash || !machineId || !licenseKey) {
    return false;
  }
  
  // Gerar hash esperado
  const expectedHash = generateLicense(machineId, licenseKey);
  
  // Comparar hashes (timing-safe)
  return crypto.timingSafeEqual(
    Buffer.from(licenseHash),
    Buffer.from(expectedHash)
  );
}

/**
 * Criptografa dados usando AES-256-GCM
 * @param {string} text - Texto a ser criptografado
 * @param {string} key - Chave de criptografia (derivada do SECRET_KEY)
 * @returns {string} Dados criptografados (base64)
 */
function encrypt(text, key) {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Retornar: IV + AuthTag + Encrypted (tudo em base64)
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex')
  ]);
  
  return combined.toString('base64');
}

/**
 * Descriptografa dados usando AES-256-GCM
 * @param {string} encryptedData - Dados criptografados (base64)
 * @param {string} key - Chave de descriptografia
 * @returns {string} Texto descriptografado
 */
function decrypt(encryptedData, key) {
  try {
    const algorithm = 'aes-256-gcm';
    const combined = Buffer.from(encryptedData, 'base64');
    
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(16, 32);
    const encrypted = combined.slice(32);
    
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[License] Erro ao descriptografar:', error);
    throw new Error('Falha ao descriptografar licença');
  }
}

/**
 * Deriva uma chave de criptografia do SECRET_KEY
 * @returns {string} Chave derivada (hex)
 */
function deriveKey() {
  return crypto.createHash('sha256').update(SECRET_KEY).digest('hex');
}

/**
 * Salva a licença em arquivo criptografado
 * @param {string} licenseHash - Hash da licença
 * @param {string} machineId - ID único do hardware
 * @param {string} licenseKey - Chave de licença
 * @returns {Promise<boolean>} true se salvo com sucesso
 */
export async function saveLicense(licenseHash, machineId, licenseKey) {
  try {
    // Criar objeto de licença
    const licenseData = {
      hash: licenseHash,
      machineId: machineId,
      licenseKey: licenseKey,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Criptografar dados
    const key = deriveKey();
    const encrypted = encrypt(JSON.stringify(licenseData), key);
    
    // Salvar em arquivo
    fs.writeFileSync(licenseFilePath, encrypted, { encoding: 'utf8', mode: 0o600 });
    
    if (isDev) {
      console.log('[License] ✅ Licença salva com sucesso');
    }
    
    return true;
  } catch (error) {
    console.error('[License] ❌ Erro ao salvar licença:', error);
    return false;
  }
}

/**
 * Carrega a licença do arquivo criptografado
 * @returns {Promise<Object|null>} Dados da licença ou null se não encontrada
 */
export async function loadLicense() {
  try {
    if (!fs.existsSync(licenseFilePath)) {
      if (isDev) {
        console.log('[License] Arquivo de licença não encontrado');
      }
      return null;
    }
    
    // Ler arquivo criptografado
    const encrypted = fs.readFileSync(licenseFilePath, 'utf8');
    
    // Descriptografar
    const key = deriveKey();
    const decrypted = decrypt(encrypted, key);
    
    // Parse JSON
    const licenseData = JSON.parse(decrypted);
    
    if (isDev) {
      console.log('[License] ✅ Licença carregada com sucesso');
    }
    
    return licenseData;
  } catch (error) {
    console.error('[License] ❌ Erro ao carregar licença:', error);
    return null;
  }
}

/**
 * Verifica se a licença é válida
 * @returns {Promise<{valid: boolean, reason?: string, machineId?: string}>}
 */
export async function checkLicense() {
  try {
    // Obter Machine ID atual
    const currentMachineId = await getMachineId();
    
    // Carregar licença salva
    const licenseData = await loadLicense();
    
    if (!licenseData) {
      return {
        valid: false,
        reason: 'LICENSE_NOT_FOUND',
        machineId: currentMachineId
      };
    }
    
    // Verificar se o Machine ID corresponde
    if (licenseData.machineId !== currentMachineId) {
      return {
        valid: false,
        reason: 'MACHINE_ID_MISMATCH',
        machineId: currentMachineId,
        savedMachineId: licenseData.machineId
      };
    }
    
    // Validar hash da licença
    const isValid = validateLicense(
      licenseData.hash,
      licenseData.machineId,
      licenseData.licenseKey
    );
    
    if (!isValid) {
      return {
        valid: false,
        reason: 'LICENSE_INVALID',
        machineId: currentMachineId
      };
    }
    
    return {
      valid: true,
      machineId: currentMachineId,
      licenseKey: licenseData.licenseKey
    };
  } catch (error) {
    console.error('[License] ❌ Erro ao verificar licença:', error);
    return {
      valid: false,
      reason: 'CHECK_ERROR',
      error: error.message
    };
  }
}

/**
 * Ativa uma nova licença
 * @param {string} licenseKey - Chave de licença fornecida pelo usuário
 * @returns {Promise<{success: boolean, message: string, machineId?: string}>}
 */
export async function activateLicense(licenseKey) {
  try {
    if (!licenseKey || licenseKey.trim().length === 0) {
      return {
        success: false,
        message: 'Chave de licença não pode estar vazia'
      };
    }
    
    // Obter Machine ID atual
    const machineId = await getMachineId();
    
    // Gerar hash da licença
    const licenseHash = generateLicense(machineId, licenseKey.trim());
    
    // Salvar licença
    const saved = await saveLicense(licenseHash, machineId, licenseKey.trim());
    
    if (!saved) {
      return {
        success: false,
        message: 'Erro ao salvar licença'
      };
    }
    
    // Verificar se a licença salva é válida
    const validation = await checkLicense();
    
    if (!validation.valid) {
      return {
        success: false,
        message: 'Licença ativada mas validação falhou',
        reason: validation.reason
      };
    }
    
    return {
      success: true,
      message: 'Licença ativada com sucesso!',
      machineId: machineId
    };
  } catch (error) {
    console.error('[License] ❌ Erro ao ativar licença:', error);
    return {
      success: false,
      message: `Erro ao ativar licença: ${error.message}`
    };
  }
}

/**
 * Remove a licença (desativação)
 * @returns {Promise<boolean>} true se removida com sucesso
 */
export async function removeLicense() {
  try {
    if (fs.existsSync(licenseFilePath)) {
      fs.unlinkSync(licenseFilePath);
      if (isDev) {
        console.log('[License] ✅ Licença removida');
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('[License] ❌ Erro ao remover licença:', error);
    return false;
  }
}

/**
 * Obtém informações da licença atual (sem validar)
 * @returns {Promise<Object|null>} Informações da licença ou null
 */
export async function getLicenseInfo() {
  try {
    const licenseData = await loadLicense();
    if (!licenseData) {
      return null;
    }
    
    // Não retornar a licenseKey por segurança
    return {
      machineId: licenseData.machineId,
      createdAt: licenseData.createdAt,
      version: licenseData.version
    };
  } catch (error) {
    console.error('[License] ❌ Erro ao obter informações da licença:', error);
    return null;
  }
}

