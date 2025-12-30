/**
 * ============================================
 * UPDATE CHECKER - Verificação de Atualizações
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Sistema de verificação de atualizações via API
 * Consome endpoint /update/latest do servidor Railway
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

// URL do servidor de atualizações (Railway)
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://smart-tech-server.up.railway.app';

/**
 * Compara duas versões (semver básico)
 * @param {string} v1 - Versão atual
 * @param {string} v2 - Versão remota
 * @returns {number} -1 se v1 < v2, 0 se iguais, 1 se v1 > v2
 */
export function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Verifica se há atualização disponível
 * @param {string} currentVersion - Versão atual do app
 * @returns {Promise<{available: boolean, version?: string, url?: string, notes?: string, error?: string}>}
 */
export async function checkForUpdates(currentVersion) {
  try {
    const url = `${UPDATE_SERVER_URL}/update/latest`;
    
    console.log('[Update Check] Verificando atualizações...');
    console.log('[Update Check] URL:', url);
    console.log('[Update Check] Versão atual:', currentVersion);
    
    // Timeout de 10 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('[Update Check] Resposta do servidor:', data);
    
    if (!data.version) {
      throw new Error('Resposta do servidor não contém versão');
    }
    
    // Comparar versões
    const comparison = compareVersions(currentVersion, data.version);
    const available = comparison < 0;
    
    console.log('[Update Check] Comparação:', {
      current: currentVersion,
      latest: data.version,
      comparison,
      available
    });
    
    if (available) {
      return {
        available: true,
        version: data.version,
        url: data.url,
        notes: data.notes || 'Correções e melhorias'
      };
    }
    
    return {
      available: false,
      version: currentVersion,
      latestVersion: data.version
    };
  } catch (error) {
    console.error('[Update Check] Erro ao verificar atualizações:', error);
    
    // Se for erro de rede, não bloquear o app
    if (error.name === 'AbortError' || error.message.includes('fetch')) {
      return {
        available: false,
        error: 'NETWORK_ERROR',
        message: 'Não foi possível conectar ao servidor de atualizações'
      };
    }
    
    return {
      available: false,
      error: 'CHECK_ERROR',
      message: error.message || 'Erro ao verificar atualizações'
    };
  }
}

// Nota: downloadUpdate foi movido para main.js via IPC handler
// A função downloadUpdate não é mais necessária aqui
// O download é feito diretamente no main.js usando shell.openExternal

