import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';
import * as updateManager from './updateManager.js';
import * as updater from './updater.js';
import * as storageHandler from './storage-handler.js';
import { setupDevToolsDetection, disableDevTools } from './devtools-detector.js';
import { checkForUpdates } from './update-checker.js';
import { validateLicenseAndBlock, getMacAddress, hashMac } from './license-checker.js';
import { checkForUpdatesAndNotify, downloadUpdate, quitAndInstall, startPeriodicCheck } from './auto-updater.js';

// Importar license-manager (ofuscado em produção se existir)
// Usar import dinâmico dentro de função para suportar versão ofuscada
let licenseManager = null;

async function loadLicenseManager() {
  if (licenseManager) return licenseManager;
  
  try {
    // Tentar carregar versão ofuscada primeiro (produção)
    const obfuscatedPath = path.join(__dirname, 'license-manager.obfuscated.js');
    if (!isDev && fs.existsSync(obfuscatedPath)) {
      licenseManager = await import('./license-manager.obfuscated.js');
      console.log('[License] Usando versão ofuscada do license-manager');
    } else {
      licenseManager = await import('./license-manager.js');
      if (isDev) {
        console.log('[License] Usando versão de desenvolvimento');
      }
    }
  } catch (error) {
    // Fallback para versão não ofuscada
    console.warn('[License] Erro ao carregar versão ofuscada, usando padrão:', error.message);
    licenseManager = await import('./license-manager.js');
  }
  
  return licenseManager;
}

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
  // Verificar licença antes de criar janela (apenas em produção)
  if (!isDev && !licenseValid) {
    console.error('[License] Tentativa de criar janela sem licença válida');
    return;
  }
  
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
          // Usar preload.cjs (CommonJS) em produção
          const preloadPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'preload.cjs');
          // Fallback: tentar também no diretório do app
          if (!fs.existsSync(preloadPath)) {
            const fallbackPath = path.join(__dirname, 'preload.cjs');
            if (fs.existsSync(fallbackPath)) {
              return fallbackPath;
            }
            // Fallback adicional: tentar preload.js
            const fallbackPath2 = path.join(__dirname, 'preload.js');
            if (fs.existsSync(fallbackPath2)) {
              return fallbackPath2;
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
    // Em desenvolvimento, tentar carregar de servidor local ou arquivo
    const devUrl = 'http://localhost:5173'; // Vite padrão (se existir)
    const devIndexPath = path.join(__dirname, '..', 'public', 'index.html');
    
    if (fs.existsSync(devIndexPath)) {
      win.loadFile(devIndexPath);
    } else {
      win.loadURL(devUrl).catch(() => {
        // Fallback: criar HTML básico
        win.loadURL('data:text/html,<h1>Smart Tech Rolândia 2.0</h1><p>Modo desenvolvimento - Configure servidor local</p>');
      });
    }
    win.webContents.openDevTools();
  } else {
    // No modo de produção empacotado, os arquivos estão dentro de app.asar
    // app.getAppPath() retorna o caminho para app.asar
    const appPath = app.getAppPath();
    
    // Tentar diferentes caminhos possíveis
    const possiblePaths = [
      path.join(appPath, 'dist', 'index.html'),
      path.join(appPath, 'public', 'index.html'),
      path.join(appPath, 'index.html'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'index.html')
    ];
    
    let loaded = false;
    for (const indexPath of possiblePaths) {
      if (fs.existsSync(indexPath)) {
        win.loadFile(indexPath).catch(() => {
          const fileUrl = `file://${indexPath.replace(/\\/g, '/')}`;
          win.loadURL(fileUrl);
        });
        loaded = true;
        break;
      }
    }
    
    // Se nenhum arquivo encontrado, criar HTML básico
    if (!loaded) {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Smart Tech Rolândia 2.0</title>
          <style>
            body { font-family: Arial; padding: 20px; background: #1a1f2e; color: #fff; }
            h1 { color: #4CAF50; }
          </style>
        </head>
        <body>
          <h1>Smart Tech Rolândia 2.0</h1>
          <p>Aplicação carregada com sucesso!</p>
          <p>O AppInitializer está gerenciando licença e atualizações.</p>
        </body>
        </html>
      `;
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    }
  }

  // Garantir que NODE_ENV está definido como production
  if (!isDev) {
    process.env.NODE_ENV = 'production';
  }

  // Remover menu bar
  win.setMenuBarVisibility(false);
  
  // Configurar detecção de DevTools (apenas em produção)
  if (!isDev) {
    setupDevToolsDetection(win);
    disableDevTools(win);
  }
  
  // Armazenar referência da janela principal
  mainWindow = win;
}

/**
 * Verifica atualizações automaticamente na abertura do app
 * Se houver atualização disponível, envia evento 'update-available' para o renderer
 */
async function checkForUpdatesOnLaunch() {
  // Em modo dev, ainda verificar mas com logs mais detalhados
  const currentVersion = app.getVersion();
  console.log(`[Update Check] 🔍 Iniciando verificação automática... Versão atual: ${currentVersion}`);
  console.log(`[Update Check] Modo: ${isDev ? 'DESENVOLVIMENTO' : 'PRODUÇÃO'}`);

  try {
    console.log(`[Update Check] Chamando updater.checkForUpdates()...`);
    const result = await updater.checkForUpdates();
    console.log(`[Update Check] Resultado recebido:`, result);
    
    if (result && result.available && result.version) {
      // Verificar se é atualização obrigatória ou opcional
      const isRequired = result.required === true;
      
      if (isRequired) {
        console.log(`[Update Check] 🚨 ATUALIZAÇÃO OBRIGATÓRIA: Versão ${currentVersion} < minVersion ${result.minVersion}`);
      } else {
        console.log(`[Update Check] ✨ Atualização opcional disponível: ${result.version} > ${currentVersion}`);
      }
      
      // Aguardar um pouco para garantir que a janela e o listener estão prontos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        console.error('[Update Check] ❌ Janela principal não encontrada');
        return;
      }
      
      if (mainWindow.isDestroyed()) {
        console.error('[Update Check] ❌ Janela principal foi destruída');
        return;
      }
      
      console.log('[Update Check] 📤 Janela encontrada, preparando dados de atualização...');
      
      // Usar dados já obtidos do result (já vem do update.json via updater.checkForUpdates)
      // Não precisa buscar update.json novamente - tudo já está no result
      const eventData = {
        version: result.version,
        minVersion: result.minVersion || null,
        currentVersion: result.currentVersion || currentVersion,
        downloadUrl: result.downloadUrl || '',
        changelog: result.changelog || [],
        required: isRequired,
        reason: result.reason || null
      };
      
      console.log('[Update Check] 📨 Enviando evento de atualização:', {
        ...eventData,
        changelog: `[${eventData.changelog.length} itens]`
      });
      
      if (isRequired) {
        // Atualização obrigatória - enviar evento especial que bloqueia o app
        mainWindow.webContents.send('update-required', eventData);
        console.log('[Update Check] 🚨 Evento update-required enviado (BLOQUEIO DO SISTEMA)');
      } else {
        // Atualização opcional - enviar evento normal
        mainWindow.webContents.send('update-available', eventData);
        console.log('[Update Check] ✅ Evento update-available enviado (OPCIONAL)');
      }
    } else {
      console.log('[Update Check] ✅ Aplicativo está atualizado (versão atual é a mais recente)');
      if (result) {
        console.log('[Update Check] Detalhes do resultado:', {
          available: result.available,
          version: result.version,
          currentVersion: currentVersion
        });
      }
    }
  } catch (error) {
    // Erro silencioso - não travar o app se a verificação falhar
    console.error('[Update Check] ❌ Erro ao verificar atualização na abertura:', error.message);
    console.error('[Update Check] Stack:', error.stack);
  }
}

// Variável global para armazenar a janela principal
let mainWindow = null;
let licenseValid = false;

/**
 * Verifica licença e cria janela ou mostra diálogo de ativação
 */
async function initializeApp() {
  // Em desenvolvimento, pular verificação de licença
  if (isDev) {
    console.log('[License] Modo desenvolvimento - licença não verificada');
    licenseValid = true;
    storageHandler.initializeStorage();
    createWindow();
    return;
  }
  
  // Verificar licença
  console.log('[License] Verificando licença...');
  const licenseCheck = await licenseManager.checkLicense();
  
  if (licenseCheck.valid) {
    console.log('[License] ✅ Licença válida');
    licenseValid = true;
    storageHandler.initializeStorage();
    const win = createWindow();
    
    // Iniciar verificação automática de atualizações após criar janela
    if (win && !isDev) {
      // Verificar atualizações após 5 segundos (dar tempo para app carregar)
      setTimeout(() => {
        checkForUpdatesAndNotify(win).catch(err => {
          console.error('[AutoUpdater] Erro na verificação inicial:', err);
        });
      }, 5000);
      
      // Iniciar verificação periódica (a cada 60 minutos)
      startPeriodicCheck(win, 60);
    }
  } else {
    console.log('[License] ❌ Licença inválida ou não encontrada');
    console.log('[License] Motivo:', licenseCheck.reason);
    licenseValid = false;
    
    // Mostrar diálogo de ativação
    const result = dialog.showMessageBoxSync({
      type: 'warning',
      title: 'Licença Necessária',
      message: 'Sistema não licenciado',
      detail: 'Este sistema requer uma licença válida para funcionar.\n\nPor favor, ative sua licença na tela de ativação.',
      buttons: ['Ativar Licença', 'Sair'],
      defaultId: 0,
      cancelId: 1
    });
    
    if (result === 0) {
      // Criar janela de ativação
      storageHandler.initializeStorage();
      createLicenseWindow();
    } else {
      app.quit();
    }
  }
}

/**
 * Cria janela de ativação de licença
 */
function createLicenseWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 500,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev 
        ? path.join(__dirname, 'preload.js')
        : path.join(process.resourcesPath, 'app.asar.unpacked', 'electron', 'preload.cjs'),
      webSecurity: false,
    },
    title: 'Ativação de Licença - Smart Tech Rolândia',
    icon: path.join(__dirname, '../build/icon/icon.ico')
  });
  
  // Carregar página de ativação
  if (isDev) {
    win.loadURL('http://localhost:8081/#/license-activation');
  } else {
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    win.loadFile(indexPath).then(() => {
      // Navegar para a rota de ativação após carregar
      win.webContents.executeJavaScript(`
        window.location.hash = 'license-activation';
      `);
    }).catch(() => {
      // Fallback: usar URL com hash
      const fileUrl = `file://${indexPath.replace(/\\/g, '/')}#license-activation`;
      win.loadURL(fileUrl);
    });
  }
  
  // Configurar detecção de DevTools
  if (!isDev) {
    setupDevToolsDetection(win);
    disableDevTools(win);
  }
  
  // Quando licença for ativada, fechar esta janela e criar janela principal
  win.on('close', () => {
    if (licenseValid) {
      createWindow();
    }
  });
}

// Verificar licença ANTES de inicializar o app (nova verificação por MAC)
async function checkLicenseByMac() {
  const appName = 'smart-tech';
  const appVersion = app.getVersion();
  
  // Em desenvolvimento, pular verificação de licença
  if (isDev) {
    console.log('[License] Modo desenvolvimento - pulando verificação de licença por MAC');
    return true;
  }
  
  console.log('[License] Verificando licença por MAC antes de inicializar...');
  const licenseValid = await validateLicenseAndBlock(app, appName, appVersion);
  
  if (!licenseValid) {
    console.error('[License] Aplicação bloqueada por licença inválida (MAC)');
    // app.quit() já foi chamado em validateLicenseAndBlock
    return false;
  }
  
  return true;
}

app.whenReady().then(async () => {
  // Verificar licença por MAC primeiro (nova verificação)
  const canStart = await checkLicenseByMac();
  if (!canStart) {
    return; // App foi bloqueado
  }
  
  // Continuar inicialização normal (verificação antiga de license-manager)
  initializeApp();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (licenseValid) {
        createWindow();
      } else {
        initializeApp();
      }
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
    // Tentar obter versão do app diretamente como último recurso
    try {
      return app.getVersion();
    } catch (e) {
      console.error('Erro ao obter versão do app:', e);
      return '0.0.0'; // Versão genérica - não hardcoded
    }
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

// ============================================
// IPC HANDLERS - SISTEMA DE LICENÇA
// ============================================

// Obter Machine ID
ipcMain.handle('license-get-machine-id', async () => {
  try {
    await loadLicenseManager();
    const machineId = await licenseManager.getMachineId();
    return { success: true, machineId };
  } catch (error) {
    console.error('[IPC] Erro ao obter Machine ID:', error);
    return { success: false, error: error.message };
  }
});

// Verificar licença
ipcMain.handle('license-check', async () => {
  try {
    await loadLicenseManager();
    const result = await licenseManager.checkLicense();
    return result;
  } catch (error) {
    console.error('[IPC] Erro ao verificar licença:', error);
    return { valid: false, reason: 'CHECK_ERROR', error: error.message };
  }
});

// Ativar licença
ipcMain.handle('license-activate', async (event, licenseKey) => {
  try {
    await loadLicenseManager();
    console.log('[IPC] Ativando licença...');
    const result = await licenseManager.activateLicense(licenseKey);
    
    if (result.success) {
      // Atualizar flag global
      licenseValid = true;
      console.log('[IPC] ✅ Licença ativada com sucesso');
    }
    
    return result;
  } catch (error) {
    console.error('[IPC] Erro ao ativar licença:', error);
    return { success: false, message: error.message };
  }
});

// Obter informações da licença
ipcMain.handle('license-get-info', async () => {
  try {
    await loadLicenseManager();
    const info = await licenseManager.getLicenseInfo();
    return { success: true, info };
  } catch (error) {
    console.error('[IPC] Erro ao obter informações da licença:', error);
    return { success: false, error: error.message };
  }
});

// Remover licença (desativação)
ipcMain.handle('license-remove', async () => {
  try {
    await loadLicenseManager();
    const removed = await licenseManager.removeLicense();
    if (removed) {
      licenseValid = false;
    }
    return { success: removed };
  } catch (error) {
    console.error('[IPC] Erro ao remover licença:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// IPC HANDLERS - AUTO UPDATER (electron-updater)
// ============================================

// Verificar atualização automática
ipcMain.handle('auto-updater-check', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win && !win.isDestroyed()) {
      await checkForUpdatesAndNotify(win);
      return { success: true };
    }
    return { success: false, error: 'Janela não encontrada' };
  } catch (error) {
    console.error('[IPC] Erro ao verificar atualização automática:', error);
    return { success: false, error: error.message };
  }
});

// Baixar atualização
ipcMain.handle('auto-updater-download', async () => {
  try {
    await downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('[IPC] Erro ao baixar atualização:', error);
    return { success: false, error: error.message };
  }
});

// Instalar atualização e reiniciar
ipcMain.handle('auto-updater-install', () => {
  try {
    quitAndInstall();
    return { success: true };
  } catch (error) {
    console.error('[IPC] Erro ao instalar atualização:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// IPC HANDLERS - SISTEMA DE ATUALIZAÇÃO (RAILWAY)
// ============================================

// Verificar atualização online (Railway)
ipcMain.handle('update-check-online-railway', async () => {
  try {
    const currentVersion = app.getVersion();
    console.log('[IPC] Verificando atualização online (Railway)...');
    console.log('[IPC] Versão atual:', currentVersion);
    
    const result = await checkForUpdates(currentVersion);
    
    console.log('[IPC] Resultado da verificação:', result);
    
    return result;
  } catch (error) {
    console.error('[IPC] Erro ao verificar atualização:', error);
    return {
      available: false,
      error: 'CHECK_ERROR',
      message: error.message || 'Erro ao verificar atualização'
    };
  }
});

// Baixar atualização (abre no navegador)
ipcMain.handle('update-download-railway', async (event, downloadUrl) => {
  try {
    console.log('[IPC] Iniciando download de atualização:', downloadUrl);
    
    const result = await downloadUpdate(downloadUrl);
    
    return result;
  } catch (error) {
    console.error('[IPC] Erro ao baixar atualização:', error);
    return {
      success: false,
      error: error.message || 'Erro ao baixar atualização'
    };
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

/**
 * Download Assistido (MODO 1)
 * Apenas baixa o ZIP na pasta Downloads e abre a pasta para o usuário
 * O usuário executa manualmente o ATUALIZAR.bat
 * 
 * Handler registrado no nível do módulo (antes de app.whenReady())
 * para garantir disponibilidade desde o início
 */
ipcMain.handle('update-download-assistido', async (event, downloadUrl) => {
  try {
    console.log('[IPC] 📥 [update-download-assistido] Handler chamado');
    console.log('[IPC] 📥 Iniciando download assistido:', downloadUrl);
    
    if (!downloadUrl) {
      throw new Error('URL de download não fornecida');
    }

    // Obter pasta Downloads do usuário
    const downloadsPath = app.getPath('downloads');
    console.log('[IPC] Pasta Downloads:', downloadsPath);

    // Criar callback de progresso para enviar ao renderer
    let timeoutId = null;
    const onProgress = (percent) => {
      // Enviar progresso ao renderer
      if (event.sender && !event.sender.isDestroyed()) {
        event.sender.send('update-download-progress', percent);
      }
    };

    // Usar função de download do updater, mas salvar na pasta Downloads
    // Precisamos modificar temporariamente o caminho ou criar uma função específica
    // Por enquanto, vamos usar uma abordagem direta aqui
    
    const url = new URL(downloadUrl);
    const filename = path.basename(url.pathname) || `update-${Date.now()}.zip`;
    const filePath = path.join(downloadsPath, filename);
    
    console.log('[IPC] Salvando arquivo em:', filePath);

    // Verificar se globalThis.fetch está disponível (Node 18+)
    if (typeof globalThis.fetch === 'function') {
      console.log('[IPC] Usando fetch para download...');
      
      try {
        const response = await globalThis.fetch(downloadUrl, {
          redirect: 'follow',
          signal: AbortSignal.timeout(300000) // 5 minutos
        });

        if (!response.ok) {
          // Se for 404, abrir no navegador como fallback
          if (response.status === 404) {
            console.log('[IPC] ⚠️ Arquivo não encontrado (404), abrindo no navegador...');
            shell.openExternal(downloadUrl);
            return {
              success: true,
              openedInBrowser: true,
              message: 'Arquivo não encontrado no servidor. Abrindo no navegador para download manual.'
            };
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }

        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        const reader = response.body?.getReader();
        
        if (!reader) {
          throw new Error('Stream de resposta não disponível');
        }

        const fileStream = fs.createWriteStream(filePath);
        let downloadedBytes = 0;

        // Ler chunks e escrever no arquivo
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          fileStream.write(value);
          downloadedBytes += value.length;
          
          // Calcular e enviar progresso
          if (contentLength > 0) {
            const percent = Math.round((downloadedBytes / contentLength) * 100);
            onProgress(percent);
          }
        }

        fileStream.end();
        console.log('[IPC] ✅ Download concluído via fetch');

        // Abrir pasta Downloads
        shell.showItemInFolder(filePath);
        console.log('[IPC] 📂 Pasta Downloads aberta');

        return {
          success: true,
          filePath: filePath,
          message: 'Download concluído! O arquivo está na pasta Downloads. Execute o ATUALIZAR.bat para concluir a atualização.'
        };

      } catch (fetchError) {
        console.error('[IPC] Erro no fetch, tentando método alternativo:', fetchError);
        // Continuar para método alternativo
      }
    }

    // Método alternativo usando https/http
    console.log('[IPC] Usando método alternativo (https/http) para download...');
    
    return new Promise((resolve, reject) => {
      const httpModule = url.protocol === 'https:' ? https : http;
      const fileStream = fs.createWriteStream(filePath);
      
      let downloadedBytes = 0;
      let totalBytes = 0;
      let requestTimeoutId = null;

      const makeRequest = (requestUrl) => {
        const requestUrlObj = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl;
        const module = requestUrlObj.protocol === 'https:' ? https : http;
        
        const req = module.get(requestUrlObj, (res) => {
          // Seguir redirects
          if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
            const redirectUrl = res.headers.location;
            if (!redirectUrl) {
              fileStream.close();
              try { fs.unlinkSync(filePath); } catch (e) {}
              reject(new Error('Redirect sem URL de destino'));
              return;
            }
            
            console.log('[IPC] Seguindo redirect para:', redirectUrl);
            fileStream.close();
            try { fs.unlinkSync(filePath); } catch (e) {}
            if (requestTimeoutId) clearTimeout(requestTimeoutId);
            
            // Fazer nova requisição com URL absoluta ou relativa
            const absoluteUrl = redirectUrl.startsWith('http') 
              ? redirectUrl 
              : `${requestUrlObj.protocol}//${requestUrlObj.host}${redirectUrl}`;
            
            return makeRequest(absoluteUrl);
          }

          if (res.statusCode !== 200) {
            fileStream.close();
            try { fs.unlinkSync(filePath); } catch (e) {}
            if (requestTimeoutId) clearTimeout(requestTimeoutId);
            
            // Se for 404, abrir no navegador como fallback
            if (res.statusCode === 404) {
              console.log('[IPC] ⚠️ Arquivo não encontrado (404), abrindo no navegador...');
              shell.openExternal(requestUrlObj.href);
              resolve({
                success: true,
                openedInBrowser: true,
                message: 'Arquivo não encontrado no servidor. Abrindo no navegador para download manual.'
              });
              return;
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
            return;
          }

          totalBytes = parseInt(res.headers['content-length'] || '0', 10);

          res.on('data', (chunk) => {
            fileStream.write(chunk);
            downloadedBytes += chunk.length;
            
            // Calcular e enviar progresso
            if (totalBytes > 0) {
              const percent = Math.round((downloadedBytes / totalBytes) * 100);
              onProgress(percent);
            }
          });

          res.on('end', () => {
            fileStream.end();
            if (requestTimeoutId) clearTimeout(requestTimeoutId);
            
            console.log('[IPC] ✅ Download concluído via https/http');
            
            // Abrir pasta Downloads
            shell.showItemInFolder(filePath);
            console.log('[IPC] 📂 Pasta Downloads aberta');

            resolve({
              success: true,
              filePath: filePath,
              message: 'Download concluído! O arquivo está na pasta Downloads. Execute o ATUALIZAR.bat para concluir a atualização.'
            });
          });
        });

        req.on('error', (error) => {
          fileStream.close();
          try { fs.unlinkSync(filePath); } catch (e) {}
          if (requestTimeoutId) clearTimeout(requestTimeoutId);
          console.error('[IPC] ❌ Erro no download:', error);
          reject(new Error(`Erro no download: ${error.message}`));
        });

        // Timeout de 5 minutos
        requestTimeoutId = setTimeout(() => {
          req.destroy();
          fileStream.close();
          try { fs.unlinkSync(filePath); } catch (e) {}
          reject(new Error('Timeout no download (5 minutos)'));
        }, 300000);
      };

      // Iniciar requisição
      makeRequest(url);
    });

  } catch (error) {
    console.error('[IPC] ❌ Erro ao baixar atualização assistida:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao baixar atualização'
    };
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

