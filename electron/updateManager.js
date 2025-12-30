import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { app } from 'electron';
import https from 'https';
import http from 'http';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);

const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

/**
 * Detecta unidades removíveis (pendrives) no Windows
 */
export async function detectRemovableDrives() {
  const drives = [];
  
  if (process.platform !== 'win32') {
    return drives;
  }

  try {
    // No Windows, unidades removíveis geralmente são D:, E:, F:, etc.
    const driveLetters = 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    for (const letter of driveLetters) {
      const drivePath = `${letter}:\\`;
      try {
        const stats = await stat(drivePath);
        if (stats.isDirectory()) {
          // Verificar se é uma unidade removível
          // Tentar acessar o diretório raiz
          try {
            const files = await readdir(drivePath);
            drives.push({
              letter: letter,
              path: drivePath,
              label: `Unidade ${letter}:`,
              accessible: true
            });
          } catch (err) {
            // Unidade existe mas não é acessível
          }
        }
      } catch (err) {
        // Unidade não existe ou não é acessível
      }
    }
  } catch (error) {
    console.error('Erro ao detectar unidades removíveis:', error);
  }

  return drives;
}

/**
 * Verifica se existe um arquivo de atualização no pendrive
 */
export async function checkForUpdate(updatePath) {
  try {
    const updateInfoPath = path.join(updatePath, 'update-info.json');
    
    if (!fs.existsSync(updateInfoPath)) {
      return null;
    }

    const updateInfo = JSON.parse(await readFile(updateInfoPath, 'utf8'));
    
    // Verificar se existe a pasta de atualização
    const updateFolder = path.join(updatePath, 'update');
    if (!fs.existsSync(updateFolder)) {
      return null;
    }

    return {
      version: updateInfo.version,
      description: updateInfo.description || '',
      files: updateInfo.files || [],
      date: updateInfo.date || new Date().toISOString(),
      updatePath: updateFolder
    };
  } catch (error) {
    console.error('Erro ao verificar atualização:', error);
    return null;
  }
}

/**
 * Obtém a versão atual do aplicativo
 */
export function getCurrentVersion() {
  try {
    const packagePath = isDev 
      ? path.join(process.cwd(), 'package.json')
      : path.join(process.resourcesPath, 'app.asar.unpacked', 'package.json');
    
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      return packageJson.version || '2.0.0';
    }
    
    // Fallback: tentar ler do package.json no app.asar
    try {
      const appPath = app.getAppPath();
      const fallbackPath = path.join(appPath, 'package.json');
      if (fs.existsSync(fallbackPath)) {
        const packageJson = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        return packageJson.version || '2.0.0';
      }
    } catch (e) {
      // Ignorar erro
    }
    
    return '2.0.0';
  } catch (error) {
    console.error('Erro ao obter versão atual:', error);
    return '2.0.0';
  }
}

/**
 * Compara versões usando semver (x.y.z)
 * Retorna: 1 se v1 > v2, -1 se v1 < v2, 0 se v1 === v2
 * NUNCA compara como string, sempre usa semver
 */
export function compareVersions(version1, version2) {
  // Validar formato semver
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(version1) || !semverRegex.test(version2)) {
    console.warn(`[UpdateManager] Versão inválida: v1=${version1}, v2=${version2}. Usando fallback.`);
    // Fallback: tentar parse mesmo assim
  }
  
  // Dividir em partes numéricas (semver: MAJOR.MINOR.PATCH)
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  // Garantir 3 partes (MAJOR, MINOR, PATCH)
  while (v1Parts.length < 3) v1Parts.push(0);
  while (v2Parts.length < 3) v2Parts.push(0);
  
  // Comparar MAJOR primeiro
  if (v1Parts[0] !== v2Parts[0]) {
    return v1Parts[0] > v2Parts[0] ? 1 : -1;
  }
  
  // Se MAJOR igual, comparar MINOR
  if (v1Parts[1] !== v2Parts[1]) {
    return v1Parts[1] > v2Parts[1] ? 1 : -1;
  }
  
  // Se MINOR igual, comparar PATCH
  if (v1Parts[2] !== v2Parts[2]) {
    return v1Parts[2] > v2Parts[2] ? 1 : -1;
  }
  
  // Versões iguais
  return 0;
}

/**
 * Cria backup dos arquivos antes da atualização
 */
export async function createBackup(backupPath) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(backupPath, `backup-${timestamp}`);
    
    await mkdir(backupDir, { recursive: true });
    
    const appPath = isDev ? process.cwd() : app.getAppPath();
    const distPath = path.join(appPath, 'dist');
    
    const filesToBackup = [];
    
    // Listar arquivos do dist (se existir)
    if (fs.existsSync(distPath)) {
      await copyDirectory(distPath, path.join(backupDir, 'dist'), filesToBackup);
    }
    
    // Backup do package.json
    const packagePath = path.join(appPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const backupPackagePath = path.join(backupDir, 'package.json');
      await copyFile(packagePath, backupPackagePath);
      filesToBackup.push('package.json');
    }
    
    return {
      success: true,
      backupPath: backupDir,
      files: filesToBackup,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Copia diretório recursivamente
 */
async function copyDirectory(src, dest, filesList = []) {
  await mkdir(dest, { recursive: true });
  
  const entries = await readdir(src);
  
  for (const entryName of entries) {
    const srcPath = path.join(src, entryName);
    const destPath = path.join(dest, entryName);
    const entryStats = await stat(srcPath);
    
    if (entryStats.isDirectory()) {
      await copyDirectory(srcPath, destPath, filesList);
    } else {
      await copyFile(srcPath, destPath);
      filesList.push(path.relative(src, srcPath));
    }
  }
}

/**
 * Aplica a atualização copiando arquivos do pendrive
 */
export async function applyUpdate(updatePath, appPath) {
  const results = {
    success: false,
    filesUpdated: [],
    errors: [],
    newVersion: null
  };

  try {
    // Verificar se o caminho de atualização existe
    if (!fs.existsSync(updatePath)) {
      results.errors.push('Caminho de atualização não encontrado');
      return results;
    }

    // Ler informações da atualização para obter a versão
    const updateInfoPath = path.join(updatePath, '..', 'update-info.json');
    if (fs.existsSync(updateInfoPath)) {
      try {
        const updateInfo = JSON.parse(await readFile(updateInfoPath, 'utf8'));
        results.newVersion = updateInfo.version;
      } catch (error) {
        console.warn('Erro ao ler update-info.json:', error);
      }
    }

    const targetPath = isDev ? process.cwd() : appPath;
    const distTargetPath = path.join(targetPath, 'dist');
    
    // Criar diretório dist se não existir
    if (!fs.existsSync(distTargetPath)) {
      await mkdir(distTargetPath, { recursive: true });
    }

    // Copiar arquivos da pasta update
    const updateFiles = await readdir(updatePath);
    
    for (const fileName of updateFiles) {
      const srcPath = path.join(updatePath, fileName);
      const destPath = path.join(distTargetPath, fileName);
      
      try {
        const stats = await stat(srcPath);
        if (stats.isDirectory()) {
          await copyDirectory(srcPath, destPath);
          results.filesUpdated.push(`${fileName}/`);
        } else {
          await copyFile(srcPath, destPath);
          results.filesUpdated.push(fileName);
        }
      } catch (error) {
        results.errors.push(`Erro ao copiar ${fileName}: ${error.message}`);
      }
    }

    // Atualizar package.json se existir no update
    const updatePackagePath = path.join(updatePath, '..', 'package.json');
    if (fs.existsSync(updatePackagePath)) {
      try {
        const packagePath = path.join(targetPath, 'package.json');
        await copyFile(updatePackagePath, packagePath);
        results.filesUpdated.push('package.json');
      } catch (error) {
        results.errors.push(`Erro ao atualizar package.json: ${error.message}`);
      }
    }

    results.success = results.errors.length === 0;
    return results;
  } catch (error) {
    results.errors.push(`Erro geral na atualização: ${error.message}`);
    return results;
  }
}

/**
 * Restaura backup
 */
export async function restoreBackup(backupPath, appPath) {
  const results = {
    success: false,
    filesRestored: [],
    errors: []
  };

  try {
    if (!fs.existsSync(backupPath)) {
      results.errors.push('Caminho de backup não encontrado');
      return results;
    }

    const targetPath = isDev ? process.cwd() : appPath;
    const distTargetPath = path.join(targetPath, 'dist');
    const backupDistPath = path.join(backupPath, 'dist');

    // Restaurar dist se existir no backup
    if (fs.existsSync(backupDistPath)) {
      // Remover dist atual
      if (fs.existsSync(distTargetPath)) {
        await removeDirectory(distTargetPath);
      }
      
      // Copiar dist do backup
      await copyDirectory(backupDistPath, distTargetPath, results.filesRestored);
    }

    // Restaurar package.json
    const backupPackagePath = path.join(backupPath, 'package.json');
    if (fs.existsSync(backupPackagePath)) {
      const packagePath = path.join(targetPath, 'package.json');
      await copyFile(backupPackagePath, packagePath);
      results.filesRestored.push('package.json');
    }

    results.success = results.errors.length === 0;
    return results;
  } catch (error) {
    results.errors.push(`Erro ao restaurar backup: ${error.message}`);
    return results;
  }
}

/**
 * Remove diretório recursivamente
 */
async function removeDirectory(dirPath) {
  try {
    const entries = await readdir(dirPath);
    
    for (const entryName of entries) {
      const entryPath = path.join(dirPath, entryName);
      const entryStats = await stat(entryPath);
      
      if (entryStats.isDirectory()) {
        await removeDirectory(entryPath);
      } else {
        await unlink(entryPath);
      }
    }
    
    await rmdir(dirPath);
  } catch (error) {
    // Ignorar erros de arquivos bloqueados
    if (error.code !== 'EBUSY' && error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Salva log de atualização
 */
export async function saveUpdateLog(logData) {
  try {
    const userDataPath = app.getPath('userData');
    const logsDir = path.join(userDataPath, 'update-logs');
    await mkdir(logsDir, { recursive: true });
    
    const logFile = path.join(logsDir, `update-${Date.now()}.json`);
    await writeFile(logFile, JSON.stringify(logData, null, 2), 'utf8');
    
    return logFile;
  } catch (error) {
    console.error('Erro ao salvar log de atualização:', error);
    return null;
  }
}

/**
 * Lê logs de atualização
 */
export async function readUpdateLogs() {
  try {
    const userDataPath = app.getPath('userData');
    const logsDir = path.join(userDataPath, 'update-logs');
    
    if (!fs.existsSync(logsDir)) {
      return [];
    }

    const files = await readdir(logsDir);
    const logs = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const logPath = path.join(logsDir, file);
          const logData = JSON.parse(await readFile(logPath, 'utf8'));
          logs.push({
            ...logData,
            logFile: file
          });
        } catch (error) {
          console.error(`Erro ao ler log ${file}:`, error);
        }
      }
    }

    // Ordenar por data (mais recente primeiro)
    logs.sort((a, b) => {
      const dateA = new Date(a.date || a.timestamp || 0);
      const dateB = new Date(b.date || b.timestamp || 0);
      return dateB - dateA;
    });

    return logs;
  } catch (error) {
    console.error('Erro ao ler logs de atualização:', error);
    return [];
  }
}

// ========== SISTEMA DE ATUALIZAÇÃO ONLINE ==========

/**
 * URL base do servidor de atualizações via GitHub
 * Repositório: https://github.com/muinkadfy-cmd/smart-tech-update
 */
/**
 * URL base para atualizações
 * IMPORTANTE: Usa SOMENTE /update como fonte oficial
 * O app consome EXCLUSIVAMENTE /update/update.json
 */
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update';

/**
 * Verifica se há conexão com a internet
 */
export async function checkOnlineStatus() {
  try {
    // Tentar fazer uma requisição simples para verificar conectividade
    return new Promise((resolve) => {
      const url = new URL('https://www.google.com');
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, { timeout: 5000 }, (res) => {
        resolve(true);
        res.destroy();
      });
      
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  } catch (error) {
    return false;
  }
}

/**
 * Verifica atualizações online disponíveis
 * @param {Function} onProgress - Callback para progresso (opcional)
 * @returns {Promise<Object>} Informações da atualização ou null
 */
export async function checkForUpdatesOnline(onProgress) {
  try {
    // Verificar se está online
    const isOnline = await checkOnlineStatus();
    if (!isOnline) {
      return {
        available: false,
        online: false,
        error: 'Sem conexão com a internet'
      };
    }

    const currentVersion = getCurrentVersion();
    // Usar SOMENTE /update/update.json (fonte oficial única)
    const updateInfoUrl = `${UPDATE_SERVER_URL}/update.json`;

    // Fazer requisição para obter informações da atualização
    const updateInfo = await fetchJSON(updateInfoUrl);

    if (!updateInfo || !updateInfo.version) {
      return {
        available: false,
        online: true,
        error: 'Resposta inválida do servidor'
      };
    }

    // Comparar versões
    const comparison = compareVersions(updateInfo.version, currentVersion);

    return {
      available: comparison > 0,
      online: true,
      version: updateInfo.version,
      currentVersion: currentVersion,
      description: updateInfo.description || '',
      date: updateInfo.date || new Date().toISOString(),
      downloadUrl: updateInfo.downloadUrl || `${UPDATE_SERVER_URL}/update-${updateInfo.version}.zip`,
      size: updateInfo.size || 0,
      checksum: updateInfo.checksum || null
    };
  } catch (error) {
    console.error('Erro ao verificar atualização online:', error);
    return {
      available: false,
      online: false,
      error: error.message || 'Erro ao verificar atualização'
    };
  }
}

/**
 * Faz download da atualização
 * @param {string} downloadUrl - URL do arquivo de atualização
 * @param {Function} onProgress - Callback para progresso (percent: number)
 * @returns {Promise<Object>} Caminho do arquivo baixado ou erro
 */
export async function downloadUpdate(downloadUrl, onProgress) {
  try {
    const userDataPath = app.getPath('userData');
    const updatesDir = path.join(userDataPath, 'updates');
    await mkdir(updatesDir, { recursive: true });

    const url = new URL(downloadUrl);
    const fileName = path.basename(url.pathname) || `update-${Date.now()}.zip`;
    const downloadPath = path.join(updatesDir, fileName);

    // Se já existe, remover
    if (fs.existsSync(downloadPath)) {
      await unlink(downloadPath);
    }

    return new Promise((resolve, reject) => {
      const client = url.protocol === 'https:' ? https : http;
      
      client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Erro HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;
        const fileStream = fs.createWriteStream(downloadPath);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (onProgress && totalSize > 0) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            onProgress(percent);
          }
        });

        response.on('end', () => {
          fileStream.end();
          resolve({
            success: true,
            downloadPath: downloadPath,
            size: downloadedSize
          });
        });

        response.on('error', (error) => {
          fileStream.destroy();
          fs.unlinkSync(downloadPath).catch(() => {});
          reject(error);
        });

        response.pipe(fileStream);
      }).on('error', (error) => {
        reject(error);
      });
    });
  } catch (error) {
    console.error('Erro ao baixar atualização:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Aplica atualização baixada (extrai e copia arquivos)
 * @param {string} downloadPath - Caminho do arquivo ZIP baixado
 * @param {string} appPath - Caminho da aplicação
 * @returns {Promise<Object>} Resultado da aplicação
 */
export async function applyUpdateOnline(downloadPath, appPath) {
  const results = {
    success: false,
    filesUpdated: [],
    errors: [],
    newVersion: null
  };

  try {
    // Por enquanto, assumimos que o arquivo baixado é um ZIP
    // Em produção, você pode usar uma biblioteca como 'adm-zip' ou 'yauzl'
    // Por simplicidade, vamos assumir que o servidor fornece um diretório descompactado
    // ou que você tem uma biblioteca de descompactação instalada
    
    // Se o downloadPath é um diretório (atualização já descompactada)
    if (fs.existsSync(downloadPath) && (await stat(downloadPath)).isDirectory()) {
      const targetPath = isDev ? process.cwd() : appPath;
      const distTargetPath = path.join(targetPath, 'dist');
      
      // Criar diretório dist se não existir
      if (!fs.existsSync(distTargetPath)) {
        await mkdir(distTargetPath, { recursive: true });
      }

      // Copiar arquivos
      await copyDirectory(downloadPath, distTargetPath, results.filesUpdated);
      
      // Verificar se há update-info.json para obter versão
      const updateInfoPath = path.join(downloadPath, '..', 'update-info.json');
      if (fs.existsSync(updateInfoPath)) {
        try {
          const updateInfo = JSON.parse(await readFile(updateInfoPath, 'utf8'));
          results.newVersion = updateInfo.version;
        } catch (error) {
          console.warn('Erro ao ler update-info.json:', error);
        }
      }

      results.success = true;
      return results;
    }

    // Se for um arquivo ZIP, você precisaria descompactá-lo primeiro
    // Por enquanto, retornamos erro se não for diretório
    results.errors.push('Formato de atualização não suportado. Esperado diretório descompactado.');
    return results;
  } catch (error) {
    results.errors.push(`Erro ao aplicar atualização: ${error.message}`);
    return results;
  }
}

/**
 * Helper para fazer requisição HTTP/HTTPS e retornar JSON
 */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
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
          reject(new Error('Resposta inválida do servidor'));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout na requisição'));
    });
  });
}

