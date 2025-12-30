/**
 * ============================================
 * MODAL - ATUALIZAÇÃO AUTOMÁTICA
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Modal exibido quando há uma nova atualização disponível
 * Permite download e instalação automática
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X
} from 'lucide-react';

interface UpdateInfo {
  version: string;
  releaseDate?: string;
  releaseNotes?: string;
}

interface AutoUpdateModalProps {
  open: boolean;
  updateInfo: UpdateInfo | null;
  downloadProgress?: number;
  isDownloading?: boolean;
  isDownloaded?: boolean;
  mandatory?: boolean;
  onDownload?: () => void;
  onInstall?: () => void;
  onClose?: () => void;
}

export function AutoUpdateModal({
  open,
  updateInfo,
  downloadProgress = 0,
  isDownloading = false,
  isDownloaded = false,
  mandatory = false,
  onDownload,
  onInstall,
  onClose
}: AutoUpdateModalProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    if (onInstall) {
      await onInstall();
    }
  };

  if (!updateInfo) return null;

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        // Não permitir fechar se for obrigatória ou se estiver baixando
        if (mandatory || isDownloading || isDownloaded) {
          return;
        }
        if (onClose) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg border-2 border-primary">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-primary">
              Nova Atualização Disponível
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Versão <strong>{updateInfo.version}</strong> está disponível para download
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Release Notes */}
          {updateInfo.releaseNotes && (
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm font-semibold mb-2">O que há de novo:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {updateInfo.releaseNotes}
              </p>
            </div>
          )}

          {/* Progresso do Download */}
          {isDownloading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Baixando atualização...</span>
                <span className="font-semibold">{downloadProgress}%</span>
              </div>
              <Progress value={downloadProgress} />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Por favor, aguarde...</span>
              </div>
            </div>
          )}

          {/* Download Concluído */}
          {isDownloaded && !isDownloading && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Download concluído!</span>
              </div>
              <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                A atualização está pronta para ser instalada. O sistema será reiniciado após a instalação.
              </p>
            </div>
          )}

          {/* Aviso de Atualização Obrigatória */}
          {mandatory && !isDownloaded && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Atualização Obrigatória</span>
              </div>
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-2">
                Esta atualização é obrigatória. O sistema não pode ser usado até que a atualização seja instalada.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2 pt-2">
            {!isDownloading && !isDownloaded && (
              <>
                {!mandatory && onClose && (
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Depois
                  </Button>
                )}
                <Button
                  variant="default"
                  onClick={onDownload}
                  className="flex-1"
                  disabled={!onDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Atualização
                </Button>
              </>
            )}

            {isDownloaded && !isDownloading && (
              <Button
                variant="default"
                onClick={handleInstall}
                className="flex-1"
                disabled={isInstalling || !onInstall}
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Instalando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reiniciar e Instalar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

