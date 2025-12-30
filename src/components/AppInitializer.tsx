/**
 * ============================================
 * COMPONENTE - INICIALIZADOR DO APP
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Componente que gerencia a inicialização do app:
 * - Verifica licença
 * - Mostra loader durante verificação
 * - Exibe modal de licença inválida se necessário
 * - Gerencia atualizações automáticas
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { AppLoader } from './AppLoader';
import { LicenseInvalidModal } from './LicenseInvalidModal';
import { AutoUpdateModal } from './AutoUpdateModal';
import { useLicenseStatus } from '../hooks/useLicenseStatus';
import { useAutoUpdater } from '../hooks/useAutoUpdater';
import { isElectron as checkElectron, waitForElectron } from '../utils/electron-detector';

interface AppInitializerProps {
  children: React.ReactNode;
}

export function AppInitializer({ children }: AppInitializerProps) {
  const [isElectron, setIsElectron] = useState(false);
  const [electronReady, setElectronReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  const { licenseStatus, isChecking } = useLicenseStatus();
  const {
    updateAvailable,
    updateInfo,
    downloadProgress,
    isDownloading,
    isDownloaded,
    error: updateError,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  } = useAutoUpdater();

  // Detectar Electron
  useEffect(() => {
    const detectElectron = async () => {
      const detected = checkElectron();
      setIsElectron(detected);
      
      if (detected) {
        const ready = await waitForElectron(3000);
        setElectronReady(ready);
      } else {
        // Não é Electron, pular inicialização
        setIsInitializing(false);
      }
    };
    
    detectElectron();
  }, []);

  // Verificar licença quando Electron estiver pronto
  useEffect(() => {
    if (electronReady && licenseStatus) {
      // Aguardar um pouco para garantir que tudo carregou
      const timer = setTimeout(() => {
        setIsInitializing(false);
        
        // Se licença inválida, mostrar modal
        if (!licenseStatus.valid) {
          setShowLicenseModal(true);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [electronReady, licenseStatus]);

  // Verificar atualizações após inicialização
  useEffect(() => {
    if (!isInitializing && electronReady && !isChecking) {
      // Verificar atualizações após 5 segundos
      const timer = setTimeout(() => {
        checkForUpdates();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isInitializing, electronReady, isChecking, checkForUpdates]);

  // Se não é Electron, renderizar normalmente
  if (!isElectron) {
    return <>{children}</>;
  }

  // Durante inicialização, mostrar loader
  if (isInitializing || isChecking) {
    return (
      <>
        <AppLoader 
          message="Verificando licença..." 
          subMessage="Aguarde enquanto validamos sua licença"
        />
        {children}
      </>
    );
  }

  // Renderizar app com modais
  return (
    <>
      {children}
      
      {/* Modal de Licença Inválida */}
      <LicenseInvalidModal
        open={showLicenseModal}
        reason={licenseStatus?.reason}
        message={licenseStatus?.message}
        expiresAt={licenseStatus?.expires}
        onClose={() => {
          // Se for erro de rede, permitir fechar e tentar novamente
          if (licenseStatus?.reason === 'NETWORK_ERROR') {
            setShowLicenseModal(false);
          }
        }}
      />

      {/* Modal de Atualização */}
      <AutoUpdateModal
        open={updateAvailable}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        isDownloading={isDownloading}
        isDownloaded={isDownloaded}
        mandatory={false} // Pode ser configurado via updateInfo
        onDownload={downloadUpdate}
        onInstall={installUpdate}
        onClose={() => {
          // Permitir fechar apenas se não estiver baixando
          if (!isDownloading && !isDownloaded) {
            // Não fazer nada, apenas fechar modal
          }
        }}
      />
    </>
  );
}

