/**
 * ============================================
 * EXEMPLO - APP COM MODAIS INTEGRADOS
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Exemplo de como integrar AppInitializer no app principal
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { AppInitializer } from '../components/AppInitializer';
import { Routes, Route } from 'react-router-dom';
// Importar suas páginas aqui
// import Dashboard from './pages/Dashboard';
// import Atualizacao from './pages/Atualizacao';

/**
 * Componente principal do app com modais integrados
 * 
 * O AppInitializer gerencia:
 * - Verificação de licença
 * - Loader durante inicialização
 * - Modal de licença inválida
 * - Modal de atualização automática
 */
export function AppWithModals() {
  return (
    <AppInitializer>
      {/* Seu app aqui */}
      <Routes>
        {/* <Route path="/" element={<Dashboard />} /> */}
        {/* <Route path="/atualizacao" element={<Atualizacao />} /> */}
        {/* Outras rotas */}
      </Routes>
    </AppInitializer>
  );
}

export default AppWithModals;

