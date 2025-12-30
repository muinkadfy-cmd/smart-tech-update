/**
 * ============================================
 * MODAL - LICENÇA INVÁLIDA
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Modal exibido quando a licença é inválida ou expirada
 * Bloqueia o uso do sistema até ativação
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle, X, Mail, Phone } from 'lucide-react';

interface LicenseInvalidModalProps {
  open: boolean;
  reason?: string;
  message?: string;
  expiresAt?: string;
  onClose?: () => void;
}

export function LicenseInvalidModal({
  open,
  reason,
  message,
  expiresAt,
  onClose
}: LicenseInvalidModalProps) {
  const getReasonText = () => {
    switch (reason) {
      case 'LICENSE_NOT_FOUND':
        return 'Licença não encontrada';
      case 'LICENSE_EXPIRED':
        return 'Licença expirada';
      case 'MACHINE_ID_MISMATCH':
        return 'Licença não válida para este computador';
      case 'NETWORK_ERROR':
        return 'Erro de conexão';
      default:
        return 'Licença inválida';
    }
  };

  const getReasonDescription = () => {
    switch (reason) {
      case 'LICENSE_NOT_FOUND':
        return 'Este sistema requer uma licença válida para funcionar. Entre em contato com o suporte para ativar sua licença.';
      case 'LICENSE_EXPIRED':
        return expiresAt 
          ? `Sua licença expirou em ${new Date(expiresAt).toLocaleDateString('pt-BR')}. Renove sua licença para continuar usando o sistema.`
          : 'Sua licença expirou. Renove sua licença para continuar usando o sistema.';
      case 'MACHINE_ID_MISMATCH':
        return 'Esta licença não é válida para este computador. Cada licença é vinculada a um computador específico.';
      case 'NETWORK_ERROR':
        return 'Não foi possível verificar sua licença. Verifique sua conexão com a internet e tente novamente.';
      default:
        return message || 'Ocorreu um erro ao verificar sua licença. Entre em contato com o suporte.';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-red-500 dark:border-red-700">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-red-600 dark:text-red-400">
              {getReasonText()}
            </DialogTitle>
          </div>
          <DialogDescription className="text-base">
            {getReasonDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {/* Informações de Contato */}
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm font-semibold mb-3">Entre em contato com o suporte:</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>suporte@smarttechrolandia.com.br</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>(43) 99999-9999</span>
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-2">
            {onClose && reason !== 'LICENSE_EXPIRED' && reason !== 'LICENSE_NOT_FOUND' && (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Tentar Novamente
              </Button>
            )}
            <Button
              variant="default"
              onClick={() => {
                if (window.electron?.shell?.openExternal) {
                  window.electron.shell.openExternal('mailto:suporte@smarttechrolandia.com.br?subject=Ativação de Licença');
                }
              }}
              className="flex-1"
            >
              Contatar Suporte
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

