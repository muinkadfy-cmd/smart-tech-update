/**
 * ============================================
 * PÁGINA DE ATUALIZAÇÃO
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Tela simples para verificar e baixar atualizações
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { isElectron as checkElectron, waitForElectron } from '../utils/electron-detector';

export default function Atualizacao() {
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    available: boolean;
    version?: string;
    url?: string;
    notes?: string;
    error?: string;
  } | null>(null);
  const [isElectron, setIsElectron] = useState(false);
  const [electronReady, setElectronReady] = useState(false);

  // Detectar Electron ao montar
  useEffect(() => {
    const detectElectron = async () => {
      const detected = checkElectron();
      setIsElectron(detected);
      
      if (detected) {
        const ready = await waitForElectron(3000);
        setElectronReady(ready);
        
        if (ready) {
          loadCurrentVersion();
        }
      }
    };
    
    detectElectron();
  }, []);

  // Carregar versão atual
  const loadCurrentVersion = async () => {
    if (!electronReady || !isElectron) return;
    
    try {
      const result = await (window as any).electron?.update?.getCurrentVersion();
      const version = typeof result === 'string' ? result : (result?.version || 'Desconhecida');
      setCurrentVersion(version);
    } catch (error: any) {
      console.error('[Atualização] Erro ao carregar versão:', error);
      setCurrentVersion('Erro ao carregar');
    }
  };

  // Verificar atualização
  const handleCheckUpdate = async () => {
    if (!electronReady || !isElectron) {
      toast.error('Sistema não disponível', {
        description: 'Aguarde o sistema inicializar'
      });
      return;
    }

    setIsChecking(true);
    setUpdateInfo(null);
    
    try {
      const result = await (window as any).electron?.update?.checkOnlineRailway();
      
      if (result?.available) {
        setUpdateInfo({
          available: true,
          version: result.version,
          url: result.url,
          notes: result.notes
        });
        
        toast.success('Nova versão disponível!', {
          description: `Versão ${result.version} está disponível para download`,
          duration: 5000
        });
      } else if (result?.error) {
        setUpdateInfo({
          available: false,
          error: result.error,
          version: result.latestVersion
        });
        
        if (result.error === 'NETWORK_ERROR') {
          toast.warning('Erro de conexão', {
            description: 'Não foi possível conectar ao servidor. Verifique sua internet.',
            duration: 5000
          });
        } else {
          toast.error('Erro ao verificar atualização', {
            description: result.message || 'Tente novamente mais tarde',
            duration: 5000
          });
        }
      } else {
        setUpdateInfo({
          available: false,
          version: result?.latestVersion || currentVersion
        });
        
        toast.success('Sistema atualizado', {
          description: 'Você está usando a versão mais recente',
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('[Atualização] Erro ao verificar atualização:', error);
      setUpdateInfo({
        available: false,
        error: 'CHECK_ERROR',
        version: currentVersion
      });
      
      toast.error('Erro ao verificar atualização', {
        description: error.message || 'Tente novamente mais tarde',
        duration: 5000
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Baixar atualização
  const handleDownloadUpdate = async () => {
    if (!updateInfo?.url) {
      toast.error('URL de download não disponível');
      return;
    }

    if (!electronReady || !isElectron) {
      toast.error('Sistema não disponível');
      return;
    }

    try {
      const result = await (window as any).electron?.update?.downloadRailway(updateInfo.url);
      
      if (result?.success) {
        toast.success('Download iniciado!', {
          description: 'O arquivo será baixado pelo navegador',
          duration: 5000
        });
      } else {
        toast.error('Erro ao iniciar download', {
          description: result?.error || 'Tente novamente',
          duration: 5000
        });
      }
    } catch (error: any) {
      console.error('[Atualização] Erro ao baixar atualização:', error);
      toast.error('Erro ao baixar atualização', {
        description: error.message || 'Tente novamente',
        duration: 5000
      });
    }
  };

  // Modo Web (não suportado)
  if (!isElectron) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <Card className="border-2 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
              Sistema de Atualização Não Disponível
            </CardTitle>
            <CardDescription>
              O sistema de atualização está disponível apenas na versão desktop (Electron)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20">
            <RefreshCw className="h-12 w-12 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold mb-2">Verificação de Atualização</h1>
          <p className="text-muted-foreground text-lg">
            Smart Tech Rolândia 2.0
          </p>
        </div>
      </div>

      {/* Card: Versão Atual */}
      <Card className="border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="h-5 w-5 text-primary" />
            </div>
            Versão Atual
          </CardTitle>
          <CardDescription>
            Versão do sistema atualmente instalada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Versão Instalada</p>
              <p className="text-2xl font-bold">{currentVersion || 'Carregando...'}</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {currentVersion || 'N/A'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card: Verificação de Atualização */}
      <Card className="border-2 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <RefreshCw className="h-5 w-5 text-primary" />
            </div>
            Verificar Atualização
          </CardTitle>
          <CardDescription>
            Verifique se há uma nova versão disponível
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCheckUpdate}
            disabled={isChecking || !electronReady}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isChecking ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Verificar Atualização
              </>
            )}
          </Button>

          {/* Status da Verificação */}
          {updateInfo && (
            <div className="mt-4">
              {updateInfo.available ? (
                <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 border-2 border-amber-300 dark:border-amber-700">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                      <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-amber-900 dark:text-amber-200 mb-2">
                        Nova Versão Disponível
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                        Uma nova versão ({updateInfo.version}) está disponível para download.
                      </p>
                      {updateInfo.notes && (
                        <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                          {updateInfo.notes}
                        </p>
                      )}
                      <Button
                        onClick={handleDownloadUpdate}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        size="lg"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Baixar Atualização
                      </Button>
                    </div>
                  </div>
                </div>
              ) : updateInfo.error ? (
                <div className="p-5 rounded-xl bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/40 dark:to-rose-950/30 border-2 border-red-300 dark:border-red-700">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/40">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-red-900 dark:text-red-200 mb-2">
                        Erro ao Verificar Atualização
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-300">
                        {updateInfo.error === 'NETWORK_ERROR' 
                          ? 'Não foi possível conectar ao servidor de atualizações. Verifique sua conexão com a internet.'
                          : 'Ocorreu um erro ao verificar atualizações. Tente novamente mais tarde.'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30 border-2 border-green-300 dark:border-green-700">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/40">
                      <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-lg text-green-900 dark:text-green-200 mb-2">
                        Sistema Atualizado
                      </p>
                      <p className="text-sm text-green-800 dark:text-green-300">
                        Você está utilizando a versão mais recente do sistema ({updateInfo.version || currentVersion}).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

