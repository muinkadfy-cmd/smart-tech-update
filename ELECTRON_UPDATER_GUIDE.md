# 🚀 Guia de Integração - electron-updater

## ✅ Implementação Completa

### Arquivos Criados/Modificados

1. **`electron/auto-updater.js`** (NOVO)
   - Sistema completo de atualização automática
   - Listeners para todos os eventos
   - Funções: `checkForUpdatesAndNotify()`, `downloadUpdate()`, `quitAndInstall()`

2. **`electron/main.js`** (MODIFICADO)
   - Importa funções do auto-updater
   - Inicia verificação automática após criar janela
   - Verificação periódica a cada 60 minutos
   - IPC handlers para controle do renderer

3. **`electron/preload.cjs`** (MODIFICADO)
   - Expõe APIs do auto-updater para renderer
   - Listeners para eventos (update-available, download-progress, etc.)

4. **`server/routes/update.js`** (MODIFICADO)
   - Formato compatível com electron-updater (generic provider)
   - Retorna `releaseDate`, `releaseName`, `releaseNotes`, `files[]`

---

## 📦 Instalação

```bash
# No diretório do projeto Electron (raiz ou electron/)
npm install electron-updater --save
```

---

## 🔧 Configuração

### 1. URL do Servidor

**Arquivo:** `electron/auto-updater.js`

```javascript
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 
  'https://smarttech-update-server.up.railway.app';
```

### 2. Formato do JSON de Atualização

**Arquivo:** `updates/latest.json`

```json
{
  "version": "3.0.13",
  "url": "https://smarttech-update-server.up.railway.app/update/3.0.13/SmartTechSetup.exe",
  "notes": "Correções e melhorias de desempenho",
  "mandatory": false,
  "releaseDate": "2025-12-30T00:00:00.000Z",
  "sha512": "hash_sha512_do_arquivo",
  "size": 52428800
}
```

**Campos opcionais:**
- `sha512`: Hash SHA512 do arquivo (para verificação de integridade)
- `size`: Tamanho do arquivo em bytes

---

## 🎯 Como Funciona

### Fluxo Automático

1. **App inicia** → Verifica licença → Cria janela
2. **Após 5 segundos** → Verifica atualização automaticamente
3. **A cada 60 minutos** → Verifica atualização periodicamente

### Eventos Enviados para Renderer

- `auto-updater-update-available` - Nova versão disponível
- `auto-updater-update-not-available` - Já está atualizado
- `auto-updater-download-progress` - Progresso do download
- `auto-updater-update-downloaded` - Download concluído
- `auto-updater-error` - Erro ao verificar/baixar

---

## 💻 Uso no Renderer (React/TypeScript)

### Verificar Atualização Manualmente

```typescript
const checkUpdate = async () => {
  const result = await window.electron.update.autoUpdater.check();
  if (result.success) {
    console.log('Verificação iniciada');
  }
};
```

### Baixar Atualização

```typescript
const downloadUpdate = async () => {
  const result = await window.electron.update.autoUpdater.download();
  if (result.success) {
    console.log('Download iniciado');
  }
};
```

### Instalar e Reiniciar

```typescript
const installUpdate = async () => {
  const result = await window.electron.update.autoUpdater.install();
  if (result.success) {
    console.log('Reiniciando para instalar...');
  }
};
```

### Escutar Eventos

```typescript
useEffect(() => {
  // Nova atualização disponível
  const removeUpdateAvailable = window.electron.update.autoUpdater.onUpdateAvailable((data) => {
    console.log('Nova versão:', data.version);
    // Mostrar modal "Nova atualização disponível"
    showUpdateModal({
      version: data.version,
      notes: data.releaseNotes,
      onDownload: () => {
        window.electron.update.autoUpdater.download();
      }
    });
  });
  
  // Progresso do download
  const removeProgress = window.electron.update.autoUpdater.onDownloadProgress((progress) => {
    console.log('Progresso:', progress.percent + '%');
    // Atualizar barra de progresso
    setDownloadProgress(progress.percent);
  });
  
  // Download concluído
  const removeDownloaded = window.electron.update.autoUpdater.onUpdateDownloaded((data) => {
    console.log('Download concluído!');
    // Mostrar botão "Reiniciar e Instalar"
    showInstallButton(() => {
      window.electron.update.autoUpdater.install();
    });
  });
  
  // Erro
  const removeError = window.electron.update.autoUpdater.onError((error) => {
    console.error('Erro:', error.error);
    // Mostrar mensagem de erro
    showError(error.error);
  });
  
  // Cleanup
  return () => {
    removeUpdateAvailable();
    removeProgress();
    removeDownloaded();
    removeError();
  };
}, []);
```

---

## 📋 Exemplo Completo de Modal de Atualização

```typescript
// src/components/AutoUpdateModal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

export function AutoUpdateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    // Nova atualização disponível
    const removeUpdateAvailable = window.electron?.update?.autoUpdater?.onUpdateAvailable?.((data) => {
      setUpdateInfo(data);
      setIsOpen(true);
    });
    
    // Progresso do download
    const removeProgress = window.electron?.update?.autoUpdater?.onDownloadProgress?.((progress) => {
      setDownloadProgress(progress.percent);
      setIsDownloading(true);
    });
    
    // Download concluído
    const removeDownloaded = window.electron?.update?.autoUpdater?.onUpdateDownloaded?.((data) => {
      setIsDownloading(false);
      setIsDownloaded(true);
      setUpdateInfo(data);
    });
    
    return () => {
      removeUpdateAvailable?.();
      removeProgress?.();
      removeDownloaded?.();
    };
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    await window.electron?.update?.autoUpdater?.download();
  };

  const handleInstall = async () => {
    await window.electron?.update?.autoUpdater?.install();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Atualização Disponível</DialogTitle>
          <DialogDescription>
            Versão {updateInfo?.version} está disponível
          </DialogDescription>
        </DialogHeader>
        
        {updateInfo?.releaseNotes && (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              {updateInfo.releaseNotes}
            </p>
          </div>
        )}
        
        {isDownloading && (
          <div className="mt-4">
            <Progress value={downloadProgress} />
            <p className="text-sm text-center mt-2">
              {downloadProgress}% baixado
            </p>
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          {!isDownloading && !isDownloaded && (
            <Button onClick={handleDownload} className="flex-1">
              Baixar Atualização
            </Button>
          )}
          
          {isDownloaded && (
            <Button onClick={handleInstall} className="flex-1">
              Reiniciar e Instalar
            </Button>
          )}
          
          {!isDownloaded && (
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Depois
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔒 Segurança

### Verificação de Integridade (SHA512)

Para habilitar verificação de integridade:

1. **Gerar hash SHA512 do arquivo:**
   ```bash
   # Windows (PowerShell)
   Get-FileHash -Path "SmartTechSetup.exe" -Algorithm SHA512
   
   # Linux/Mac
   shasum -a 512 SmartTechSetup.exe
   ```

2. **Adicionar ao `latest.json`:**
   ```json
   {
     "sha512": "hash_gerado_aqui"
   }
   ```

3. **electron-updater verifica automaticamente!**

---

## ⚙️ Configurações Avançadas

### Atualização Obrigatória

**Arquivo:** `updates/latest.json`

```json
{
  "mandatory": true
}
```

Se `mandatory: true`, o app não pode ser usado até atualizar.

### Auto-download

**Arquivo:** `electron/auto-updater.js`

```javascript
autoUpdater.autoDownload = true; // Baixar automaticamente (sem pedir permissão)
```

### Auto-install

**Arquivo:** `electron/auto-updater.js`

```javascript
autoUpdater.autoInstallOnAppQuit = true; // Instalar ao fechar app
```

---

## 🐛 Troubleshooting

### Erro: "Cannot find module 'electron-updater'"

**Solução:**
```bash
npm install electron-updater --save
```

### Erro: "Update server returned invalid response"

**Solução:**
- Verificar formato do JSON em `/update/latest`
- Verificar CORS no servidor
- Verificar URL do servidor

### Download não inicia

**Solução:**
- Verificar se URL do arquivo está acessível
- Verificar logs do servidor
- Verificar permissões de escrita

---

## ✅ Checklist de Teste

- [ ] Instalar `electron-updater`
- [ ] Verificar atualização manualmente
- [ ] Testar download de atualização
- [ ] Testar instalação e reinício
- [ ] Verificar eventos no renderer
- [ ] Testar verificação periódica
- [ ] Testar com servidor offline
- [ ] Testar com atualização obrigatória

---

**Versão**: 1.0.0  
**Data**: 30/12/2025  
**Autor**: Smart Tech Rolândia

