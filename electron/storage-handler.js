/**
 * Sistema de persistência de dados em arquivo para Electron
 * Salva dados em arquivo JSON permanente em C:\Users\Public\SmartTechRolandia\data\
 * SEM usar localStorage, sessionStorage ou dados em memória
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

const STORAGE_FILENAME = 'database.json';
const BACKUP_FILENAME = 'database-backup.json';
const LOG_FILENAME = 'logs.txt';

/**
 * Obtém o caminho do diretório de dados do aplicativo
 * Usa C:\Users\Public\SmartTechRolandia\data\ (acessível a todos os usuários)
 */
function getDataDirectory() {
  let publicPath;
  
  if (process.platform === 'win32') {
    // Windows: C:\Users\Public\SmartTechRolandia\data
    const publicDir = path.join('C:', 'Users', 'Public', 'SmartTechRolandia', 'data');
    publicPath = publicDir;
  } else {
    // Linux/Mac: ~/.smarttechrolandia/data
    publicPath = path.join(os.homedir(), '.smarttechrolandia', 'data');
  }
  
  // Criar diretório se não existir
  if (!fs.existsSync(publicPath)) {
    try {
      fs.mkdirSync(publicPath, { recursive: true });
      writeLog(`Diretório criado: ${publicPath}`, 'info');
    } catch (error) {
      writeLog(`Erro ao criar diretório ${publicPath}: ${error.message}`, 'error');
      // Se falhar, tentar criar em local alternativo
      const fallbackPath = path.join(os.tmpdir(), 'SmartTechRolandia', 'data');
      if (!fs.existsSync(fallbackPath)) {
        try {
          fs.mkdirSync(fallbackPath, { recursive: true });
          writeLog(`Usando diretório alternativo: ${fallbackPath}`, 'warn');
        } catch (fallbackError) {
          writeLog(`Erro ao criar diretório alternativo: ${fallbackError.message}`, 'error');
        }
      }
      return fallbackPath;
    }
  }
  
  return publicPath;
}

/**
 * Obtém o caminho completo do arquivo de dados
 */
function getDataFilePath() {
  return path.join(getDataDirectory(), STORAGE_FILENAME);
}

/**
 * Obtém o caminho completo do arquivo de backup
 */
function getBackupFilePath() {
  return path.join(getDataDirectory(), BACKUP_FILENAME);
}

/**
 * Obtém o caminho completo do arquivo de logs
 */
function getLogFilePath() {
  return path.join(getDataDirectory(), LOG_FILENAME);
}

/**
 * Escreve log no arquivo de logs
 */
function writeLog(message, type = 'info') {
  try {
    const logPath = getLogFilePath();
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
    
    // Append ao arquivo de log
    fs.appendFileSync(logPath, logMessage, 'utf8');
  } catch (error) {
    // Ignorar erros de log silenciosamente
    console.error('Erro ao escrever log:', error);
  }
}

/**
 * Salva dados no arquivo JSON
 */
function saveData(data) {
  try {
    const dataPath = getDataFilePath();
    const backupPath = getBackupFilePath();
    
    // DEBUG: Log para verificar dados recebidos
    writeLog(`Tentando salvar dados. Tipo: ${typeof data}, Keys: ${data && typeof data === 'object' ? Object.keys(data).join(', ') : 'N/A'}`, 'info');
    
    // Criar backup do arquivo atual se existir
    if (fs.existsSync(dataPath)) {
      try {
        const currentData = fs.readFileSync(dataPath, 'utf8');
        fs.writeFileSync(backupPath, currentData, 'utf8');
        writeLog('Backup criado antes de salvar novos dados', 'info');
      } catch (backupError) {
        writeLog(`Erro ao criar backup: ${backupError.message}`, 'warn');
      }
    }
    
    // Salvar novos dados
    const jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync(dataPath, jsonData, 'utf8');
    
    writeLog(`Dados salvos com sucesso. Tamanho: ${jsonData.length} bytes`, 'info');
    writeLog(`Caminho: ${dataPath}`, 'info');
    
    return {
      success: true,
      path: dataPath,
      size: jsonData.length
    };
  } catch (error) {
    writeLog(`Erro ao salvar dados: ${error.message}`, 'error');
    writeLog(`Stack: ${error.stack}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Carrega dados do arquivo JSON
 */
function loadData() {
  try {
    const dataPath = getDataFilePath();
    
    // Se arquivo não existe, retornar null
    if (!fs.existsSync(dataPath)) {
      writeLog('Arquivo de dados não encontrado. Primeira execução.', 'info');
      return {
        success: true,
        data: null,
        isFirstRun: true
      };
    }
    
    // Ler arquivo
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    
    // Validar que não está vazio
    if (!fileContent || fileContent.trim() === '') {
      writeLog('Arquivo de dados está vazio', 'warn');
      return {
        success: true,
        data: null,
        isFirstRun: true
      };
    }
    
    // Parse JSON
    const data = JSON.parse(fileContent);
    
    writeLog(`Dados carregados com sucesso. Tamanho: ${fileContent.length} bytes`, 'info');
    
    return {
      success: true,
      data: data,
      isFirstRun: false
    };
  } catch (error) {
    writeLog(`Erro ao carregar dados: ${error.message}`, 'error');
    
    // Tentar carregar backup se houver erro
    try {
      const backupPath = getBackupFilePath();
      if (fs.existsSync(backupPath)) {
        writeLog('Tentando carregar backup...', 'warn');
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        const backupData = JSON.parse(backupContent);
        writeLog('Backup carregado com sucesso', 'info');
        return {
          success: true,
          data: backupData,
          isFirstRun: false,
          fromBackup: true
        };
      }
    } catch (backupError) {
      writeLog(`Erro ao carregar backup: ${backupError.message}`, 'error');
    }
    
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * Limpa todos os dados (reset completo)
 */
function clearData() {
  try {
    const dataPath = getDataFilePath();
    const backupPath = getBackupFilePath();
    
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
      writeLog('Arquivo de dados removido', 'info');
    }
    
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      writeLog('Arquivo de backup removido', 'info');
    }
    
    return {
      success: true
    };
  } catch (error) {
    writeLog(`Erro ao limpar dados: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtém informações sobre o armazenamento
 */
function getStorageInfo() {
  try {
    const dataPath = getDataFilePath();
    const dataDir = getDataDirectory();
    
    let size = 0;
    let exists = false;
    let lastModified = null;
    
    if (fs.existsSync(dataPath)) {
      const stats = fs.statSync(dataPath);
      size = stats.size;
      exists = true;
      lastModified = stats.mtime.toISOString();
    }
    
    return {
      path: dataPath,
      directory: dataDir,
      exists: exists,
      size: size,
      lastModified: lastModified
    };
  } catch (error) {
    return {
      error: error.message
    };
  }
}

// Exportar funções
export {
  saveData,
  loadData,
  clearData,
  getStorageInfo,
  initializeStorage
};

/**
 * Inicializa o sistema de storage (chamado na inicialização do app)
 */
function initializeStorage() {
  try {
    const dataDir = getDataDirectory();
    writeLog(`Sistema de storage inicializado. Diretório: ${dataDir}`, 'info');
    return {
      success: true,
      directory: dataDir
    };
  } catch (error) {
    writeLog(`Erro ao inicializar storage: ${error.message}`, 'error');
    return {
      success: false,
      error: error.message
    };
  }
}

