/**
 * ============================================
 * DETECTOR DE ELECTRON
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Utilitário para detectar se está rodando no Electron
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

export function isElectron(): boolean {
  return typeof window !== 'undefined' && 
         typeof (window as any).electron !== 'undefined' &&
         (window as any).electron?.isElectron === true;
}

export async function waitForElectron(timeout: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isElectron()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isElectron()) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        resolve(false);
      }
    }, 100);
  });
}

