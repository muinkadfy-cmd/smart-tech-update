/**
 * ============================================
 * LOADER - CARREGAMENTO DO APP
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Tela de carregamento exibida durante verificação de licença
 * e inicialização do sistema
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { Loader2 } from 'lucide-react';

interface AppLoaderProps {
  message?: string;
  subMessage?: string;
}

export function AppLoader({ 
  message = 'Carregando sistema...', 
  subMessage 
}: AppLoaderProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Logo ou Ícone */}
        <div className="p-4 rounded-xl bg-primary/10">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>

        {/* Mensagem Principal */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{message}</h2>
          {subMessage && (
            <p className="text-muted-foreground">{subMessage}</p>
          )}
        </div>

        {/* Barra de Progresso Animada */}
        <div className="w-64 h-1 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    </div>
  );
}

