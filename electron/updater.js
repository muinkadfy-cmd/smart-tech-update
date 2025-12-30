/**
 * Sistema de Atualização Manual via GitHub Raw Content
 * Smart Tech Rolândia 2.0
 * 
 * Busca atualizações SOMENTE em: https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update/update.json
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

// Endpoint remoto único: GitHub raw content
const UPDATE_JSON_URL = 'https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update/update.json';

// Verificar se está rodando em EXE (não em dev/web)
const isPackaged = app.isPackaged;
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !isPackaged;

/**
 * Compara duas versões usando semver (x.y.z)
 * Retorna: 1 se v1 > v2, -1 se v1 < v2, 0 se v1 === v2
 * NUNCA compara como string, sempre usa semver
 */
function compareVersions(v1, v2) {
  // Validar formato semver
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(v1) || !semverRegex.test(v2)) {
    console.warn(`[Updater] Versão inválida: v1=${v1}, v2=${v2}. Usando fallback.`);
    // Fallback: tentar parse mesmo assim
  }
  
  // Dividir em partes numéricas (semver: MAJOR.MINOR.PATCH)
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  // Garantir 3 partes (MAJOR, MINOR, PATCH)
  while (parts1.length < 3) parts1.push(0);
  while (parts2.length < 3) parts2.push(0);
  
  // Comparar MAJOR primeiro
  if (parts1[0] !== parts2[0]) {
    return parts1[0] > parts2[0] ? 1 : -1;
  }
  
  // Se MAJOR igual, comparar MINOR
  if (parts1[1] !== parts2[1]) {
    return parts1[1] > parts2[1] ? 1 : -1;
  }
  
  // Se MINOR igual, comparar PATCH
  if (parts1[2] !== parts2[2]) {
    return parts1[2] > parts2[2] ? 1 : -1;
  }
  
  // Versões iguais
  return 0;
}

/**
 * Obtém a versão atual do app dinamicamente (síncrono)
 * NUNCA usa versão hardcoded - sempre lê do package.json ou app.getVersion()
 */
export function getCurrentVersionSync() {
  try {
    // Tentar obter do app.getVersion() primeiro (mais confiável)
    if (app && typeof app.getVersion === 'function') {
      const version = app.getVersion();
      if (version && version !== '0.0.0') {
        return version;
      }
    }
    
    // Fallback: ler do package.json
    const packagePath = path.join(app.getAppPath(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      if (packageJson.version) {
        return packageJson.version;
      }
    }
  } catch (error) {
    console.error('[Updater] Erro ao ler versão atual:', error);
  }
  
  // Último fallback: tentar obter do app novamente
  try {
    if (app && typeof app.getVersion === 'function') {
      return app.getVersion();
    }
  } catch (e) {
    console.error('[Updater] Erro ao obter versão do app:', e);
  }
  
  // Se tudo falhar, retornar versão genérica (não deve acontecer em produção)
  console.warn('[Updater] ⚠️ Não foi possível determinar versão atual, usando fallback');
  return '0.0.0'; // Versão genérica que sempre será menor que qualquer versão real
}

/**
 * Obtém a versão atual do app dinamicamente (assíncrono - mantido para compatibilidade)
 * NUNCA usa versão hardcoded - sempre lê do package.json ou app.getVersion()
 */
function getCurrentVersion() {
  // Reutilizar função síncrona
  return getCurrentVersionSync();
}

/**
 * Faz requisição HTTP/HTTPS e retorna JSON
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, { timeout: 10000 }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Resposta inválida do servidor (não é JSON)'));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Erro de rede: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout na requisição (10s)'));
    });
  });
}

/**
 * Verifica se há conexão com a internet
 * Tenta múltiplos métodos para garantir detecção correta
 */
export async function checkOnlineStatus() {
  // Bloquear em modo dev/web
  if (!isPackaged) {
    return false;
  }

  try {
    // Tentar conectar com o servidor de atualizações diretamente (mais rápido)
    return new Promise((resolve) => {
      let resolved = false;
      
      // Tentar primeiro com o servidor de atualizações (mais relevante)
      const testUrl = new URL('https://muinkadfy-cmd.github.io');
      const req = https.get(testUrl, { 
        timeout: 5000, // Reduzido para 5s para ser mais rápido
        headers: {
          'User-Agent': 'SmartTechRolandia/2.0'
        }
      }, (res) => {
        if (!resolved) {
          resolved = true;
          console.log('[Updater] ✅ Conexão detectada (GitHub)');
          resolve(true);
        }
        res.destroy();
      });
      
      req.on('error', (error) => {
        if (!resolved) {
          console.log('[Updater] Erro ao verificar GitHub:', error.message);
          // Tentar método alternativo: Google (mais confiável)
          const googleReq = https.get('https://www.google.com', { timeout: 3000 }, (googleRes) => {
            if (!resolved) {
              resolved = true;
              console.log('[Updater] ✅ Conexão detectada (Google)');
              resolve(true);
            }
            googleRes.destroy();
          });
          
          googleReq.on('error', () => {
            if (!resolved) {
              resolved = true;
              console.log('[Updater] ❌ Sem conexão com a internet');
              resolve(false);
            }
          });
          
          googleReq.on('timeout', () => {
            if (!resolved) {
              resolved = true;
              googleReq.destroy();
              console.log('[Updater] ❌ Timeout - Sem conexão');
              resolve(false);
            }
          });
          
          googleReq.setTimeout(3000);
        }
      });
      
      req.on('timeout', () => {
        if (!resolved) {
          req.destroy();
          // Tentar Google como fallback
          const googleReq = https.get('https://www.google.com', { timeout: 3000 }, (googleRes) => {
            if (!resolved) {
              resolved = true;
              console.log('[Updater] ✅ Conexão detectada (Google fallback)');
              resolve(true);
            }
            googleRes.destroy();
          });
          
          googleReq.on('error', () => {
            if (!resolved) {
              resolved = true;
              console.log('[Updater] ❌ Sem conexão (timeout + erro)');
              resolve(false);
            }
          });
          
          googleReq.on('timeout', () => {
            if (!resolved) {
              resolved = true;
              googleReq.destroy();
              console.log('[Updater] ❌ Sem conexão (timeout duplo)');
              resolve(false);
            }
          });
          
          googleReq.setTimeout(3000);
        }
      });
      
      req.setTimeout(5000);
    });
  } catch (error) {
    console.log('[Updater] Erro geral ao verificar conexão:', error);
    return false;
  }
}

/**
 * Verifica atualizações disponíveis
 */
export async function checkForUpdates() {
  // Permitir verificação mesmo em dev para testes
  console.log('[Updater] 🔍 Iniciando verificação de atualizações...');
  console.log('[Updater] Modo:', isPackaged ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
  console.log('[Updater] URL:', UPDATE_JSON_URL);

  try {
    console.log('[Updater] Verificando atualizações em:', UPDATE_JSON_URL);
    
    // Verificar conexão
    const isOnline = await checkOnlineStatus();
    if (!isOnline) {
      console.error('[Updater] Sem conexão com a internet');
      return {
        available: false,
        online: false,
        error: 'Sem conexão com a internet'
      };
    }

    // Buscar update.json
    const updateInfo = await fetchJSON(UPDATE_JSON_URL);
    console.log('[Updater] Resposta do servidor:', updateInfo);

    if (!updateInfo || !updateInfo.version) {
      console.error('[Updater] Resposta inválida do servidor');
      return {
        available: false,
        online: true,
        error: 'Resposta inválida do servidor'
      };
    }

    const currentVersion = getCurrentVersion();
    const remoteVersion = updateInfo.version;
    const minVersion = updateInfo.minVersion || '0.0.0'; // Se não houver minVersion, assume 0.0.0
    
    // Comparações usando semver
    const comparisonWithRemote = compareVersions(remoteVersion, currentVersion);
    const comparisonWithMin = compareVersions(minVersion, currentVersion);

    console.log(`[Updater] Versão atual: ${currentVersion}`);
    console.log(`[Updater] Versão remota: ${remoteVersion}`);
    console.log(`[Updater] Versão mínima requerida: ${minVersion}`);
    console.log(`[Updater] Comparação com remota: ${comparisonWithRemote}`);
    console.log(`[Updater] Comparação com mínima: ${comparisonWithMin}`);

    // Verificar se versão atual é menor que a mínima requerida (atualização OBRIGATÓRIA)
    if (comparisonWithMin > 0) {
      console.log('[Updater] ⚠️ ATUALIZAÇÃO OBRIGATÓRIA: Versão atual é menor que a mínima requerida!');
      return {
        available: true,
        required: true, // Flag de atualização obrigatória
        online: true,
        version: remoteVersion,
        minVersion: minVersion,
        currentVersion: currentVersion,
        description: updateInfo.description || `Atualização obrigatória ${remoteVersion}`,
        date: updateInfo.date || new Date().toISOString(),
        downloadUrl: updateInfo.downloadUrl,
        size: updateInfo.size || 0,
        changelog: updateInfo.changelog || [],
        reason: `Sua versão (${currentVersion}) é menor que a versão mínima requerida (${minVersion}). Atualização obrigatória por segurança.`
      };
    }

    // Verificar se versão atual é menor que a remota (atualização OPCIONAL)
    if (comparisonWithRemote > 0) {
      console.log('[Updater] ✅ Atualização opcional disponível!');
      return {
        available: true,
        required: false, // Atualização opcional
        online: true,
        version: remoteVersion,
        minVersion: minVersion,
        currentVersion: currentVersion,
        description: updateInfo.description || `Atualização ${remoteVersion}`,
        date: updateInfo.date || new Date().toISOString(),
        downloadUrl: updateInfo.downloadUrl,
        size: updateInfo.size || 0,
        changelog: updateInfo.changelog || []
      };
    } else {
      console.log('[Updater] ✅ Sistema atualizado');
      return {
        available: false,
        required: false,
        online: true,
        version: remoteVersion,
        minVersion: minVersion,
        currentVersion: currentVersion,
        message: 'Sistema atualizado'
      };
    }
  } catch (error) {
    console.error('[Updater] Erro ao verificar atualização:', error);
    return {
      available: false,
      online: false,
      error: error.message || 'Erro ao verificar atualização'
    };
  }
}

/**
 * Faz download da atualização
 */
export async function downloadUpdate(downloadUrl, onProgress) {
  // Bloquear em modo dev/web
  if (!isPackaged) {
    throw new Error('Download disponível apenas no aplicativo instalado (EXE)');
  }

  return new Promise((resolve, reject) => {
    const userDataPath = app.getPath('userData');
    const updatesDir = path.join(userDataPath, 'updates');
    
    // Criar diretório de updates
    mkdir(updatesDir, { recursive: true }).then(() => {
      const url = new URL(downloadUrl);
      const filename = path.basename(url.pathname) || `update-${Date.now()}.zip`;
      const filePath = path.join(updatesDir, filename);

      console.log('[Updater] Iniciando download:', downloadUrl);
      console.log('[Updater] Salvando em:', filePath);

      const client = url.protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(filePath);

      let downloadedBytes = 0;
      let totalBytes = 0;

      const req = client.get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          unlink(filePath).catch(() => {});
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        totalBytes = parseInt(res.headers['content-length'] || '0', 10);
        console.log(`[Updater] Tamanho do arquivo: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          // Chamar callback apenas para indicar loading (sem porcentagem)
          if (onProgress) {
            onProgress();
          }
        });

        res.on('end', () => {
          file.close();
          console.log('[Updater] ✅ Download concluído');
          resolve({
            success: true,
            filePath: filePath,
            size: downloadedBytes
          });
        });
      });

      req.on('error', (error) => {
        file.close();
        unlink(filePath).catch(() => {});
        console.error('[Updater] Erro no download:', error);
        reject(new Error(`Erro no download: ${error.message}`));
      });

      req.setTimeout(300000, () => { // 5 minutos
        req.destroy();
        file.close();
        unlink(filePath).catch(() => {});
        reject(new Error('Timeout no download (5 minutos)'));
      });

      req.pipe(file);
    }).catch(reject);
  });
}

/**
 * Aplica a atualização (extrai e copia arquivos)
 */
export async function applyUpdate(zipPath) {
  // Bloquear em modo dev/web
  if (!isPackaged) {
    throw new Error('Aplicação de atualização disponível apenas no aplicativo instalado (EXE)');
  }

  // Por enquanto, apenas retorna o caminho do arquivo
  // A aplicação real será feita pelo sistema de atualização existente
  console.log('[Updater] Arquivo de atualização baixado:', zipPath);
  
  return {
    success: true,
    filePath: zipPath,
    message: 'Arquivo baixado com sucesso. Reinicie o aplicativo para aplicar a atualização.'
  };
}

// getCurrentVersionSync já está definida acima (linha 75)

