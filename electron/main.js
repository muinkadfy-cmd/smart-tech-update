import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';
import * as updateManager from './updateManager.js';
import * as updater from './updater.js';
import * as storageHandler from './storage-handler.js';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
// Usar fs.promises.rm que é a versão moderna (substitui rmdir)
const rm = fs.promises.rm || promisify(fs.rmdir);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detectar modo de desenvolvimento vs produção
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

// Caminho para salvar preferências da janela
const userDataPath = app.getPath('userData');
const windowStatePath = path.join(userDataPath, 'window-state.json');

// Carregar estado salvo da janela
function loadWindowState() {
  try {
    if (fs.existsSync(windowStatePath)) {
      const data = fs.readFileSync(windowStatePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    // Erro silencioso em produção
    if (isDev) console.warn('Erro ao carregar estado da janela:', error);
  }
  return null;
}

// Salvar estado da janela
function saveWindowState(win) {
  try {
    const state = {
      width: win.getSize()[0],
      height: win.getSize()[1],
      x: win.getPosition()[0],
      y: win.getPosition()[1],
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
    };
    fs.writeFileSync(windowStatePath, JSON.stringify(state, null, 2));
  } catch (error) {
    // Erro silencioso em produção
    if (isDev) console.warn('Erro ao salvar estado da janela:', error);
  }
}

function createWindow() {
  const savedState = loadWindowState();
  const defaultWidth = 1400;
  const defaultHeight = 900;
  const minWidth = 1000;
  const minHeight = 600;

  const win = new BrowserWindow({
    width: savedState?.width || defaultWidth,
    height: savedState?.height || defaultHeight,
    x: savedState?.x,
    y: savedState?.y,
    minWidth: minWidth,
    minHeight: minHeight,
    fullscreen: savedState?.isFullScreen || false,
    resizable: true,
    minimizable: true,
    maximizable: true,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Preload script: caminho correto para dev e produção
      preload: (() => {
        if (isDev) {
          return path.join(__dirname, 'preload.js');
        } else {
          // Em produção, o preload está em app.asar.unpacked conforme configurado no package.json
          const preloadPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'preload.js');
          // Fallback: tentar também no diretório do app
          if (!fs.existsSync(preloadPath)) {
            const fallbackPath = path.join(__dirname, 'preload.js');
            if (fs.existsSync(fallbackPath)) {
              return fallbackPath;
            }
          }
          return preloadPath;
        }
      })(),
      webSecurity: false,
      zoomFactor: 1.0, // Zoom padrão
    },
    title: 'Smart Tech Rolândia 2.0',
    backgroundColor: '#1a1f2e',
    show: false, // Não mostrar até estar pronto
  });

  // Restaurar estado maximizado se estava maximizado
  if (savedState?.isMaximized && !savedState?.isFullScreen) {
    win.maximize();
  }

  // Mostrar janela quando estiver pronta
  win.once('ready-to-show', () => {
    win.show();
  });

  // Salvar estado ao redimensionar/mover
  let saveStateTimeout;
  const debounceSave = () => {
    clearTimeout(saveStateTimeout);
    saveStateTimeout = setTimeout(() => {
      if (!win.isDestroyed()) {
        saveWindowState(win);
      }
    }, 500);
  };

  win.on('resize', debounceSave);
  win.on('move', debounceSave);
  win.on('maximize', () => saveWindowState(win));
  win.on('unmaximize', () => saveWindowState(win));
  win.on('enter-full-screen', () => saveWindowState(win));
  win.on('leave-full-screen', () => saveWindowState(win));

  // Injetar CSS para ocultar scrollbars após carregar a página
  // E verificar se o preload foi carregado corretamente
  win.webContents.on('did-finish-load', () => {
    // Verificar se o preload foi carregado (apenas em dev para debug)
    if (isDev) {
      win.webContents.executeJavaScript(`
        console.log('Preload disponível:', typeof window.electron !== 'undefined');
        console.log('Electron detectado:', window.electron?.isElectron === true);
      `).catch(() => {
        // Ignorar erros silenciosamente
      });
    }
    
    win.webContents.insertCSS(`
      * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
        opacity: 0 !important;
        visibility: hidden !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        pointer-events: none !important;
      }
      *::-webkit-scrollbar-track,
      *::-webkit-scrollbar-thumb,
      *::-webkit-scrollbar-corner,
      *::-webkit-scrollbar-button {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
        opacity: 0 !important;
        visibility: hidden !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        pointer-events: none !important;
      }
      html, body {
        overflow-x: hidden !important;
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
    `);
  });

  // Permitir toggle de fullscreen com F11 e ESC
  // F11: alterna fullscreen
  // ESC: sai do fullscreen (se estiver em fullscreen)
  // Ctrl + Plus/Minus: zoom in/out
  // Ctrl + 0: reset zoom
  
  win.webContents.on('before-input-event', (event, input) => {
    // F11: toggle fullscreen
    if (input.key === 'F11') {
      event.preventDefault();
      const isFullScreen = win.isFullScreen();
      win.setFullScreen(!isFullScreen);
      saveWindowState(win);
    }
    // ESC: sai do fullscreen se estiver em fullscreen
    if (input.key === 'Escape' && win.isFullScreen()) {
      event.preventDefault();
      win.setFullScreen(false);
      saveWindowState(win);
    }
    // Ctrl + Plus: zoom in
    if (input.control && (input.key === '+' || input.key === '=')) {
      event.preventDefault();
      const currentZoom = win.webContents.getZoomLevel();
      win.webContents.setZoomLevel(Math.min(currentZoom + 0.5, 5));
    }
    // Ctrl + Minus: zoom out
    if (input.control && input.key === '-') {
      event.preventDefault();
      const currentZoom = win.webContents.getZoomLevel();
      win.webContents.setZoomLevel(Math.max(currentZoom - 0.5, -3));
    }
    // Ctrl + 0: reset zoom
    if (input.control && input.key === '0') {
      event.preventDefault();
      win.webContents.setZoomLevel(0);
    }
  });

  // Carregar a aplicação
  if (isDev) {
    win.loadURL('http://localhost:8081');
    win.webContents.openDevTools();
  } else {
    // No modo de produção empacotado, os arquivos estão dentro de app.asar
    // app.getAppPath() retorna o caminho para app.asar
    const appPath = app.getAppPath();
    const indexPath = path.join(appPath, 'dist', 'index.html');
    
    // PRODUÇÃO: Não abrir DevTools
    // win.webContents.openDevTools(); // REMOVIDO PARA PRODUÇÃO
    
    // Usar loadFile que funciona melhor com caminhos relativos
    win.loadFile(indexPath).catch((err) => {
      // Em produção, apenas tentar fallback sem logs excessivos
      const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
      win.loadURL(fileUrl);
    });
  }

  // Garantir que NODE_ENV está definido como production
  if (!isDev) {
    process.env.NODE_ENV = 'production';
  }

  // Remover menu bar
  win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  // Inicializar sistema de storage
  storageHandler.initializeStorage();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Enviar evento will-quit para todos os renderers quando o app estiver fechando
app.on('before-quit', () => {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach(win => {
    if (win && !win.isDestroyed()) {
      win.webContents.send('app-will-quit');
    }
  });
});

/**
 * Função para limpar dados do AppData do Electron
 * Remove apenas dados do usuário, mantendo arquivos do sistema
 */
async function clearAppData() {
  try {
    const userDataPath = app.getPath('userData');
    const localStoragePath = path.join(userDataPath, 'Local Storage');
    const sessionStoragePath = path.join(userDataPath, 'Session Storage');
    const cachePath = path.join(userDataPath, 'Cache');
    const codeCachePath = path.join(userDataPath, 'Code Cache');
    const blobStoragePath = path.join(userDataPath, 'blob_storage');
    const indexedDBPath = path.join(userDataPath, 'IndexedDB');
    const gpuCachePath = path.join(userDataPath, 'GPUCache');
    const serviceWorkerPath = path.join(userDataPath, 'Service Worker');
    
    const pathsToClear = [
      localStoragePath,
      sessionStoragePath,
      cachePath,
      codeCachePath,
      blobStoragePath,
      indexedDBPath,
      gpuCachePath,
      serviceWorkerPath,
    ];

    const clearedPaths = [];
    const errors = [];

    for (const dirPath of pathsToClear) {
      try {
        if (fs.existsSync(dirPath)) {
          await removeDirectory(dirPath);
          clearedPaths.push(dirPath);
        }
      } catch (error) {
        errors.push(`Erro ao limpar ${dirPath}: ${error.message}`);
      }
    }

    return {
      success: errors.length === 0,
      clearedPaths,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      clearedPaths: [],
      errors: [`Erro geral ao limpar AppData: ${error.message}`],
    };
  }
}

/**
 * Remove diretório recursivamente
 */
async function removeDirectory(dirPath) {
  try {
    const stats = await stat(dirPath);
    
    if (stats.isDirectory()) {
      // Usar fs.promises.rm com opção recursive (método moderno)
      try {
        await fs.promises.rm(dirPath, { recursive: true, force: true });
      } catch (error) {
        // Fallback: método antigo se fs.promises.rm não estiver disponível
        if (error.code === 'ENOENT' || error.code === 'EBUSY') {
          // Ignorar se já não existe ou está em uso
          return;
        }
        // Tentar método manual como fallback
        const files = await readdir(dirPath);
        
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          try {
            const fileStats = await stat(filePath);
            
            if (fileStats.isDirectory()) {
              await removeDirectory(filePath);
            } else {
              await unlink(filePath);
            }
          } catch (fileError) {
            // Ignorar erros de arquivos individuais
            if (fileError.code !== 'EBUSY' && fileError.code !== 'ENOENT' && isDev) {
              console.warn(`Erro ao remover ${filePath}:`, fileError.message);
            }
          }
        }
        
        // Tentar remover diretório vazio
        try {
          await fs.promises.rmdir(dirPath);
        } catch (rmdirError) {
          // Ignorar se não conseguir (pode estar em uso)
          if (rmdirError.code !== 'EBUSY' && rmdirError.code !== 'ENOENT' && rmdirError.code !== 'ENOTEMPTY') {
            throw rmdirError;
          }
        }
      }
    } else {
      await unlink(dirPath);
    }
  } catch (error) {
    // Ignorar erros de arquivos bloqueados (podem estar em uso)
    if (error.code !== 'EBUSY' && error.code !== 'ENOENT' && isDev) {
      // Log mas não lançar erro - continuar limpando outros diretórios
      console.warn(`Erro ao remover ${dirPath}:`, error.message);
    }
  }
}

// Handler IPC para limpar dados do AppData
ipcMain.handle('clear-app-data', async () => {
  return await clearAppData();
});

// Handlers IPC para controles de janela
ipcMain.handle('window-toggle-fullscreen', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    const isFullScreen = win.isFullScreen();
    win.setFullScreen(!isFullScreen);
    saveWindowState(win);
    return !isFullScreen;
  }
  return false;
});

ipcMain.handle('window-maximize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    saveWindowState(win);
    return win.isMaximized();
  }
  return false;
});

ipcMain.handle('window-minimize', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.minimize();
  }
});

ipcMain.handle('window-close', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    win.close();
  }
});

ipcMain.handle('window-get-state', () => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) {
    return {
      isMaximized: win.isMaximized(),
      isFullScreen: win.isFullScreen(),
      isMinimized: win.isMinimized(),
      size: win.getSize(),
      position: win.getPosition(),
    };
  }
  return null;
});

ipcMain.handle('window-set-zoom', (event, level) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.webContents.setZoomLevel(Math.max(-3, Math.min(5, level)));
    return win.webContents.getZoomLevel();
  }
  return 0;
});

ipcMain.handle('window-get-zoom', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    return win.webContents.getZoomLevel();
  }
  return 0;
});

// ========== HANDLERS DE ATUALIZAÇÃO OFFLINE ==========

// Validação de ambiente Electron (helper)
function validateElectronEnvironment() {
  if (!app || !app.isReady()) {
    return {
      valid: false,
      error: 'Aplicativo Electron não está pronto ou não está em ambiente Electron'
    };
  }
  return { valid: true };
}

// Detectar unidades removíveis (pendrives)
ipcMain.handle('update-detect-drives', async () => {
  const envCheck = validateElectronEnvironment();
  if (!envCheck.valid) {
    return { error: envCheck.error, drives: [] };
  }
  
  try {
    return await updateManager.detectRemovableDrives();
  } catch (error) {
    if (isDev) console.error('Erro ao detectar drives:', error);
    return { error: error.message, drives: [] };
  }
});

// Verificar atualização no pendrive
ipcMain.handle('update-check', async (event, drivePath) => {
  const envCheck = validateElectronEnvironment();
  if (!envCheck.valid) {
    return { available: false, error: envCheck.error };
  }
  
  try {
    const updateInfo = await updateManager.checkForUpdate(drivePath);
    if (!updateInfo) {
      return { available: false };
    }

    const currentVersion = updateManager.getCurrentVersion();
    const comparison = updateManager.compareVersions(updateInfo.version, currentVersion);

    return {
      available: comparison > 0,
      version: updateInfo.version,
      currentVersion: currentVersion,
      description: updateInfo.description,
      date: updateInfo.date,
      updatePath: updateInfo.updatePath,
      comparison: comparison // Incluir para debug
    };
  } catch (error) {
    if (isDev) console.error('Erro ao verificar atualização:', error);
    return { available: false, error: error.message };
  }
});

// Obter versão atual (compatível com offline e online)
ipcMain.handle('update-get-current-version', () => {
  try {
    // Tentar obter versão do updateManager primeiro (offline)
    const envCheck = validateElectronEnvironment();
    if (envCheck.valid) {
      try {
        const version = updateManager.getCurrentVersion();
        return version;
      } catch (error) {
        // Fallback para updater se updateManager falhar
        const version = updater.getCurrentVersionSync();
        return version;
      }
    } else {
      // Se ambiente não válido, tentar updater diretamente
      const version = updater.getCurrentVersionSync();
      return version;
    }
  } catch (error) {
    if (isDev) console.error('Erro ao obter versão atual:', error);
    return '2.0.0';
  }
});

// Criar backup antes da atualização
ipcMain.handle('update-create-backup', async () => {
  const envCheck = validateElectronEnvironment();
  if (!envCheck.valid) {
    return { success: false, error: envCheck.error };
  }
  
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    return await updateManager.createBackup(backupDir);
  } catch (error) {
    if (isDev) console.error('Erro ao criar backup:', error);
    return { success: false, error: error.message };
  }
});

// Aplicar atualização
ipcMain.handle('update-apply', async (event, updatePath) => {
  const envCheck = validateElectronEnvironment();
  if (!envCheck.valid) {
    return { success: false, error: envCheck.error };
  }
  
  try {
    // CRÍTICO: Validar versão antes de aplicar (prevenir downgrade)
    const updateInfo = await updateManager.checkForUpdate(path.dirname(updatePath));
    if (!updateInfo) {
      return { 
        success: false, 
        error: 'Não foi possível verificar informações da atualização' 
      };
    }
    
    const currentVersion = updateManager.getCurrentVersion();
    const comparison = updateManager.compareVersions(updateInfo.version, currentVersion);
    
    // Bloquear downgrade ou versão igual
    if (comparison <= 0) {
      const errorMsg = comparison === 0 
        ? `A versão ${updateInfo.version} é igual à versão atual. Não é necessário atualizar.`
        : `Não é permitido fazer downgrade. Versão atual: ${currentVersion}, Versão do pendrive: ${updateInfo.version}`;
      
      // Salvar log da tentativa de downgrade
      await updateManager.saveUpdateLog({
        type: 'update',
        status: 'error',
        previousVersion: currentVersion,
        newVersion: updateInfo.version,
        date: new Date().toISOString(),
        errors: [errorMsg],
        timestamp: Date.now()
      });
      
      return { 
        success: false, 
        error: errorMsg,
        blocked: true // Flag para indicar que foi bloqueado
      };
    }
    
    const appPath = app.getAppPath();
    const result = await updateManager.applyUpdate(updatePath, appPath);
    
    // Salvar log da atualização
    if (result.success) {
      const logData = {
        type: 'update',
        status: 'success',
        previousVersion: currentVersion,
        newVersion: result.newVersion || updateInfo.version,
        date: new Date().toISOString(),
        filesUpdated: result.filesUpdated,
        timestamp: Date.now()
      };
      await updateManager.saveUpdateLog(logData);
    } else {
      const logData = {
        type: 'update',
        status: 'error',
        previousVersion: currentVersion,
        newVersion: updateInfo.version,
        date: new Date().toISOString(),
        errors: result.errors,
        timestamp: Date.now()
      };
      await updateManager.saveUpdateLog(logData);
    }
    
    return result;
  } catch (error) {
    if (isDev) console.error('Erro ao aplicar atualização:', error);
    return { success: false, error: error.message };
  }
});

// Restaurar backup
ipcMain.handle('update-restore-backup', async (event, backupPath) => {
  const envCheck = validateElectronEnvironment();
  if (!envCheck.valid) {
    return { success: false, error: envCheck.error };
  }
  
  try {
    const appPath = app.getAppPath();
    const result = await updateManager.restoreBackup(backupPath, appPath);
    
    // Salvar log da restauração
    const logData = {
      type: 'restore',
      status: result.success ? 'success' : 'error',
      date: new Date().toISOString(),
      filesRestored: result.filesRestored,
      errors: result.errors,
      timestamp: Date.now()
    };
    await updateManager.saveUpdateLog(logData);
    
    return result;
  } catch (error) {
    if (isDev) console.error('Erro ao restaurar backup:', error);
    return { success: false, error: error.message };
  }
});

// Obter logs de atualização
ipcMain.handle('update-get-logs', async () => {
  const envCheck = validateElectronEnvironment();
  if (!envCheck.valid) {
    return { error: envCheck.error, logs: [] };
  }
  
  try {
    return await updateManager.readUpdateLogs();
  } catch (error) {
    if (isDev) console.error('Erro ao obter logs:', error);
    return [];
  }
});

// ========== HANDLERS DE ATUALIZAÇÃO ONLINE (GitHub Pages) ==========

// NOTA: Handler 'update-get-current-version' já está registrado acima (linha 541)
// Removido duplicado para evitar erro "Attempted to register a second handler"

// Verificar status online
ipcMain.handle('update-check-online-status', async () => {
  try {
    const isOnline = await updater.checkOnlineStatus();
    console.log('[IPC] Status online:', isOnline);
    return { online: isOnline };
  } catch (error) {
    console.error('[IPC] Erro ao verificar status online:', error);
    return { online: false, error: error.message };
  }
});

// Verificar atualizações online
ipcMain.handle('update-check-online', async () => {
  try {
    console.log('[IPC] Verificando atualizações...');
    const result = await updater.checkForUpdates();
    console.log('[IPC] Resultado da verificação:', result);
    return result;
  } catch (error) {
    console.error('[IPC] Erro ao verificar atualização:', error);
    return { 
      available: false, 
      online: false, 
      error: error.message || 'Erro ao verificar atualização' 
    };
  }
});

// Baixar atualização online
ipcMain.handle('update-download-online', async (event, downloadUrl) => {
  try {
    console.log('[IPC] Iniciando download:', downloadUrl);
    
    // Callback de progresso para enviar ao renderer
    const onProgress = (percent) => {
      event.sender.send('update-download-progress', percent);
    };
    
    const result = await updater.downloadUpdate(downloadUrl, onProgress);
    console.log('[IPC] Download concluído:', result);
    return result;
  } catch (error) {
    console.error('[IPC] Erro ao baixar atualização:', error);
    return { success: false, error: error.message };
  }
});

// Aplicar atualização online baixada
ipcMain.handle('update-apply-online', async (event, zipPath) => {
  try {
    console.log('[IPC] Aplicando atualização:', zipPath);
    const result = await updater.applyUpdate(zipPath);
    
    // Salvar log da atualização
    const currentVersion = updater.getCurrentVersionSync();
    const logData = {
      type: 'update',
      status: result.success ? 'success' : 'error',
      previousVersion: currentVersion,
      newVersion: result.newVersion || 'desconhecida',
      date: new Date().toISOString(),
      source: 'online',
      timestamp: Date.now()
    };
    
    // Tentar salvar log (se updateManager tiver essa função)
    try {
      if (updateManager.saveUpdateLog) {
        await updateManager.saveUpdateLog(logData);
      }
    } catch (logError) {
      console.warn('[IPC] Erro ao salvar log:', logError);
    }
    
    console.log('[IPC] Atualização aplicada:', result);
    return result;
  } catch (error) {
    console.error('[IPC] Erro ao aplicar atualização:', error);
    return { success: false, error: error.message };
  }
});

// ========== HANDLERS DE PERSISTÊNCIA DE DADOS ==========

// Salvar dados em arquivo permanente
ipcMain.handle('storage-save', async (event, data) => {
  try {
    return storageHandler.saveData(data);
  } catch (error) {
    if (isDev) console.error('Erro ao salvar dados:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Carregar dados do arquivo permanente
ipcMain.handle('storage-load', async () => {
  try {
    return storageHandler.loadData();
  } catch (error) {
    if (isDev) console.error('Erro ao carregar dados:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
});

// Limpar todos os dados
ipcMain.handle('storage-clear', async () => {
  try {
    return storageHandler.clearData();
  } catch (error) {
    if (isDev) console.error('Erro ao limpar dados:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Obter informações sobre o storage
ipcMain.handle('storage-info', async () => {
  try {
    return storageHandler.getStorageInfo();
  } catch (error) {
    if (isDev) console.error('Erro ao obter info do storage:', error);
    return {
      error: error.message
    };
  }
});

