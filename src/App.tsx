/**
 * ============================================
 * APP PRINCIPAL - Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Componente principal do aplicativo React
 * Integra AppInitializer para gerenciar licença e atualizações
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { AppInitializer } from './components/AppInitializer';
// Importar suas rotas/páginas aqui
// import Dashboard from './pages/Dashboard';
// import Atualizacao from './pages/Atualizacao';

/**
 * Componente principal do app
 * 
 * O AppInitializer gerencia automaticamente:
 * - Verificação de licença ao iniciar
 * - Loader durante inicialização
 * - Modal de licença inválida
 * - Modal de atualização automática
 */
export default function App() {
  return (
    <AppInitializer>
      {/* Seu sistema aqui */}
      <div className="min-h-screen bg-background">
        {/* Exemplo: Adicione suas rotas/páginas aqui */}
        {/* 
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/atualizacao" element={<Atualizacao />} />
        </Routes>
        */}
        
        {/* Conteúdo temporário para teste */}
        <div className="container mx-auto p-6">
          <h1 className="text-4xl font-bold mb-4">Smart Tech Rolândia 2.0</h1>
          <p className="text-muted-foreground">
            Sistema inicializado com sucesso!
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            O AppInitializer está gerenciando licença e atualizações automaticamente.
          </p>
        </div>
      </div>
    </AppInitializer>
  );
}

