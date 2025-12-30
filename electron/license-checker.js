/**
 * ============================================
 * LICENSE CHECKER - Verificação de Licença por MAC/ID
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Sistema de verificação de licença usando MAC address
 * Bloqueia o app se licença inválida
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import os from 'os';
import crypto from 'crypto';

// URL do servidor de licenças (Railway)
const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL || 'https://smart-tech-server.up.railway.app';

/**
 * Obtém MAC address da primeira interface de rede válida
 * @returns {string|null} MAC address ou null se não encontrado
 */
export function getMacAddress() {
  try {
    const nets = os.networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      const interfaces = nets[name];
      if (!interfaces) continue;
      
      for (const net of interfaces) {
        // Ignorar interfaces internas e MACs inválidos
        if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
          return net.mac;
        }
      }
    }
    
    // Fallback: usar hostname como identificador único
    return os.hostname();
  } catch (error) {
    console.error('[License] Erro ao obter MAC address:', error);
    // Fallback: usar hostname
    return os.hostname();
  }
}

/**
 * Gera hash SHA256 do MAC address (segurança)
 * @param {string} mac - MAC address
 * @param {string} secret - Chave secreta
 * @returns {string} Hash SHA256
 */
export function hashMac(mac, secret = 'smart-tech-secret-key-2025') {
  return crypto.createHash('sha256')
    .update(mac + secret)
    .digest('hex');
}

/**
 * Verifica licença no servidor
 * @param {string} appName - Nome da aplicação
 * @param {string} appVersion - Versão da aplicação
 * @returns {Promise<{valid: boolean, reason?: string, message?: string, expires?: string}>}
 */
export async function checkLicense(appName = 'smart-tech', appVersion = '3.0.12') {
  try {
    const mac = getMacAddress();
    const macHash = hashMac(mac);
    
    console.log('[License] Verificando licença...');
    console.log('[License] MAC:', mac);
    console.log('[License] MAC Hash:', macHash.substring(0, 16) + '...');
    
    const url = `${LICENSE_SERVER_URL}/license/check`;
    
    // Timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mac: macHash, // Enviar hash, não MAC puro
        macOriginal: mac, // Para debug (remover em produção)
        app: appName,
        version: appVersion
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('[License] Resposta do servidor:', {
      valid: data.valid,
      reason: data.reason,
      expires: data.expires
    });
    
    return {
      valid: data.valid === true,
      reason: data.reason || null,
      message: data.message || null,
      expires: data.expires || null,
      daysRemaining: data.daysRemaining || null
    };
  } catch (error) {
    console.error('[License] Erro ao verificar licença:', error);
    
    // Se for erro de rede, bloquear por segurança
    if (error.name === 'AbortError' || error.message.includes('fetch')) {
      return {
        valid: false,
        reason: 'NETWORK_ERROR',
        message: 'Não foi possível conectar ao servidor de licenças. Verifique sua conexão com a internet.'
      };
    }
    
    return {
      valid: false,
      reason: 'CHECK_ERROR',
      message: error.message || 'Erro ao verificar licença'
    };
  }
}

/**
 * Verifica licença e bloqueia app se inválida
 * @param {object} app - Objeto app do Electron
 * @param {string} appName - Nome da aplicação
 * @param {string} appVersion - Versão da aplicação
 * @returns {Promise<boolean>} true se licença válida, false se bloqueado
 */
export async function validateLicenseAndBlock(app, appName = 'smart-tech', appVersion = '3.0.12') {
  const result = await checkLicense(appName, appVersion);
  
  if (!result.valid) {
    console.error('[License] Licença inválida! Bloqueando aplicação...');
    console.error('[License] Motivo:', result.reason);
    console.error('[License] Mensagem:', result.message);
    
    // Emitir evento para mostrar tela de licença inválida
    // (será tratado no main.js)
    
    // Bloquear app
    app.quit();
    return false;
  }
  
  console.log('[License] Licença válida! Aplicação autorizada.');
  if (result.expires) {
    console.log('[License] Expira em:', result.expires);
  }
  if (result.daysRemaining) {
    console.log('[License] Dias restantes:', result.daysRemaining);
  }
  
  return true;
}

