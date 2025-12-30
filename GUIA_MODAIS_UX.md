# 🎨 Guia de Uso - Modais UX

## ✅ Componentes Criados

### 1. **LicenseInvalidModal** - Modal de Licença Inválida
- Exibe quando licença é inválida ou expirada
- Bloqueia uso do sistema
- Informações de contato com suporte

### 2. **AutoUpdateModal** - Modal de Atualização
- Exibe quando há nova versão disponível
- Barra de progresso durante download
- Botão para instalar após download

### 3. **AppLoader** - Loader de Inicialização
- Tela de carregamento durante verificação
- Mensagens personalizáveis

### 4. **AppInitializer** - Inicializador do App
- Gerencia toda a inicialização
- Integra verificação de licença e atualizações
- Mostra modais automaticamente

---

## 📦 Componentes UI Base

### Criados:
- ✅ `src/components/ui/dialog.tsx` - Modal/Dialog
- ✅ `src/components/ui/button.tsx` - Botão
- ✅ `src/components/ui/progress.tsx` - Barra de progresso
- ✅ `src/components/ui/card.tsx` - Card
- ✅ `src/components/ui/badge.tsx` - Badge

---

## 🚀 Como Usar

### 1. Integrar AppInitializer no App Principal

**Arquivo:** `src/App.tsx` (ou arquivo principal)

```typescript
import { AppInitializer } from './components/AppInitializer';

function App() {
  return (
    <AppInitializer>
      {/* Seu app aqui */}
      <YourAppContent />
    </AppInitializer>
  );
}
```

### 2. Usar Modais Manualmente (Opcional)

#### Modal de Licença

```typescript
import { LicenseInvalidModal } from './components/LicenseInvalidModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState(null);

  return (
    <>
      <LicenseInvalidModal
        open={showModal}
        reason={licenseStatus?.reason}
        message={licenseStatus?.message}
        expiresAt={licenseStatus?.expires}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
```

#### Modal de Atualização

```typescript
import { AutoUpdateModal } from './components/AutoUpdateModal';
import { useAutoUpdater } from './hooks/useAutoUpdater';

function MyComponent() {
  const {
    updateAvailable,
    updateInfo,
    downloadProgress,
    isDownloading,
    isDownloaded,
    downloadUpdate,
    installUpdate
  } = useAutoUpdater();

  return (
    <AutoUpdateModal
      open={updateAvailable}
      updateInfo={updateInfo}
      downloadProgress={downloadProgress}
      isDownloading={isDownloading}
      isDownloaded={isDownloaded}
      onDownload={downloadUpdate}
      onInstall={installUpdate}
    />
  );
}
```

### 3. Usar Hooks

#### useAutoUpdater

```typescript
import { useAutoUpdater } from './hooks/useAutoUpdater';

function MyComponent() {
  const {
    updateAvailable,
    updateInfo,
    downloadProgress,
    isDownloading,
    isDownloaded,
    error,
    checkForUpdates,
    downloadUpdate,
    installUpdate
  } = useAutoUpdater();

  // Verificar atualização manualmente
  const handleCheck = () => {
    checkForUpdates();
  };

  return (
    <div>
      {updateAvailable && (
        <p>Nova versão {updateInfo?.version} disponível!</p>
      )}
      {isDownloading && (
        <p>Baixando... {downloadProgress}%</p>
      )}
      {isDownloaded && (
        <button onClick={installUpdate}>
          Reiniciar e Instalar
        </button>
      )}
    </div>
  );
}
```

#### useLicenseStatus

```typescript
import { useLicenseStatus } from './hooks/useLicenseStatus';

function MyComponent() {
  const { licenseStatus, isChecking, checkLicense } = useLicenseStatus();

  if (isChecking) {
    return <p>Verificando licença...</p>;
  }

  if (!licenseStatus?.valid) {
    return <p>Licença inválida: {licenseStatus?.message}</p>;
  }

  return <p>Licença válida! Expira em {licenseStatus?.expires}</p>;
}
```

---

## 🎨 Customização

### Cores e Estilos

Os componentes usam classes Tailwind CSS. Para customizar:

1. **Editar classes diretamente** nos componentes
2. **Usar variáveis CSS** do tema
3. **Sobrescrever com className**

### Exemplo de Customização

```typescript
<LicenseInvalidModal
  open={showModal}
  reason="LICENSE_EXPIRED"
  message="Sua licença expirou"
  className="custom-modal-class" // Adicionar classe customizada
/>
```

---

## 📋 Fluxo Completo

### 1. App Inicia

```
App inicia
  ↓
AppInitializer detecta Electron
  ↓
Mostra AppLoader ("Verificando licença...")
  ↓
Verifica licença via useLicenseStatus
```

### 2. Licença Válida

```
Licença válida
  ↓
Esconde AppLoader
  ↓
Renderiza app normalmente
  ↓
Após 5 segundos, verifica atualização
```

### 3. Licença Inválida

```
Licença inválida
  ↓
Mostra LicenseInvalidModal
  ↓
Bloqueia uso do sistema
  ↓
Usuário pode contatar suporte
```

### 4. Atualização Disponível

```
Nova atualização detectada
  ↓
Mostra AutoUpdateModal
  ↓
Usuário clica "Baixar"
  ↓
Mostra progresso do download
  ↓
Download concluído
  ↓
Botão "Reiniciar e Instalar"
  ↓
App reinicia e instala
```

---

## 🔧 Configuração

### Atualização Obrigatória

Para tornar atualização obrigatória, edite `updates/latest.json`:

```json
{
  "mandatory": true
}
```

E passe para o modal:

```typescript
<AutoUpdateModal
  mandatory={updateInfo?.mandatory || false}
  // ...
/>
```

### Mensagens Personalizadas

Edite os componentes para personalizar mensagens:

- `LicenseInvalidModal` - Mensagens de erro
- `AutoUpdateModal` - Mensagens de atualização
- `AppLoader` - Mensagens de carregamento

---

## ✅ Checklist de Integração

- [x] Componentes UI criados
- [x] Modais criados
- [x] Hooks criados
- [x] AppInitializer criado
- [ ] Integrar AppInitializer no App.tsx
- [ ] Testar fluxo completo
- [ ] Personalizar mensagens
- [ ] Ajustar estilos se necessário

---

## 📝 Exemplo Completo de Integração

```typescript
// src/App.tsx
import { AppInitializer } from './components/AppInitializer';
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <AppInitializer>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/atualizacao" element={<Atualizacao />} />
        {/* Outras rotas */}
      </Routes>
    </AppInitializer>
  );
}

export default App;
```

---

**Versão**: 1.0.0  
**Data**: 30/12/2025  
**Status**: ✅ **COMPLETO**

