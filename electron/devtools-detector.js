/**
 * ============================================
 * DEVTOOLS DETECTOR - Detector de DevTools
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Sistema de detecção e bloqueio de DevTools em produção
 * - Detecta abertura de DevTools
 * - Bloqueia acesso em produção
 * - Termina aplicação se DevTools for aberto
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { app, BrowserWindow } from 'electron';

// Detectar modo de desenvolvimento
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.ELECTRON_IS_DEV === '1' ||
              !app.isPackaged;

/**
 * Configura detecção de DevTools para uma janela
 * @param {BrowserWindow} win - Janela do Electron
 */
export function setupDevToolsDetection(win) {
  // Em desenvolvimento, permitir DevTools
  if (isDev) {
    return;
  }
  
  // Em produção, bloquear DevTools
  let devToolsOpened = false;
  
  // Detectar quando DevTools é aberto
  win.webContents.on('devtools-opened', () => {
    devToolsOpened = true;
    console.warn('[Security] ⚠️ DevTools detectado em produção!');
    
    // Fechar DevTools imediatamente
    win.webContents.closeDevTools();
    
    // Mostrar mensagem de segurança
    win.webContents.executeJavaScript(`
      alert('Acesso negado: DevTools não é permitido em produção.');
    `).catch(() => {});
    
    // Terminar aplicação após 2 segundos
    setTimeout(() => {
      console.error('[Security] 🚨 Terminando aplicação por segurança...');
      app.quit();
    }, 2000);
  });
  
  // Detectar tentativa de abrir DevTools via teclado
  win.webContents.on('before-input-event', (event, input) => {
    // Bloquear F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      input.key === 'F12' ||
      (input.control && input.shift && (input.key === 'I' || input.key === 'J')) ||
      (input.control && input.key === 'U')
    ) {
      event.preventDefault();
      console.warn('[Security] ⚠️ Tentativa de abrir DevTools bloqueada');
      
      // Mostrar mensagem
      win.webContents.executeJavaScript(`
        console.clear();
        console.log('%c⚠️ Acesso Negado', 'color: red; font-size: 20px; font-weight: bold;');
        console.log('%cDevTools não é permitido em produção.', 'color: red; font-size: 14px;');
      `).catch(() => {});
    }
  });
  
  // Prevenir abertura de DevTools via menu de contexto
  win.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });
  
  // Monitorar console para detectar tentativas de debug
  win.webContents.executeJavaScript(`
    (function() {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      console.log = function(...args) {
        // Permitir logs normais, mas monitorar
        originalLog.apply(console, args);
      };
      
      console.error = function(...args) {
        originalError.apply(console, args);
      };
      
      console.warn = function(...args) {
        originalWarn.apply(console, args);
      };
      
      // Bloquear debugger
      if (typeof window !== 'undefined') {
        window.addEventListener('keydown', function(e) {
          if (e.key === 'F12' || 
              (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J'))) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }, true);
      }
    })();
  `).catch(() => {});
  
  // Verificar periodicamente se DevTools foi aberto
  const checkInterval = setInterval(() => {
    if (win.isDestroyed()) {
      clearInterval(checkInterval);
      return;
    }
    
    if (win.webContents.isDevToolsOpened()) {
      if (!devToolsOpened) {
        devToolsOpened = true;
        console.warn('[Security] ⚠️ DevTools detectado via verificação periódica!');
        win.webContents.closeDevTools();
        
        setTimeout(() => {
          console.error('[Security] 🚨 Terminando aplicação por segurança...');
          app.quit();
        }, 2000);
      }
    }
  }, 1000); // Verificar a cada 1 segundo
  
  // Limpar intervalo quando janela for fechada
  win.on('closed', () => {
    clearInterval(checkInterval);
  });
}

/**
 * Desabilita completamente DevTools para uma janela
 * @param {BrowserWindow} win - Janela do Electron
 */
export function disableDevTools(win) {
  if (isDev) {
    return; // Em desenvolvimento, permitir
  }
  
  // Remover menu de contexto
  win.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });
  
  // Bloquear todas as formas de abrir DevTools
  win.webContents.setDevToolsWebContents(null);
}

