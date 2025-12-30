# Padrão IPC - Sistema de Atualização

## 📋 Regras Fundamentais

1. **NUNCA criar `ipcRenderer.invoke` sem criar o `ipcMain.handle` correspondente**
2. **Os nomes dos canais IPC devem ser idênticos**
3. **Todos os handlers devem ter tratamento de erro**
4. **Padronizar nomenclatura: update → download → install → restart**

## 🔄 Sistema Padronizado de Update/Download/Restart

### API Padronizada (preload.js)

```javascript
electron.update.check()              // Verificar atualização
electron.update.download(url)        // Baixar atualização (manual)
electron.update.install(path)        // Instalar atualização
electron.app.restart()               // Reiniciar aplicativo
electron.app.quit()                  // Fechar aplicativo
```

### Handlers Correspondentes (main.js)

| Canal IPC | Handler | Descrição |
|-----------|---------|-----------|
| `update-check-online` | ✅ | Verifica atualização online |
| `update-download` | ✅ | Abre download no navegador (manual) |
| `update-install` | ✅ | Instala atualização baixada |
| `app-restart` | ✅ | Reinicia aplicativo |
| `app-quit` | ✅ | Fecha aplicativo |

## 📦 Handlers por Categoria

### Update (Padronizado)
- `update-get-current-version` - Obter versão atual
- `update-check-online` - Verificar atualização online
- `update-check-online-status` - Verificar status de conexão
- `update-download` - Download manual (shell.openExternal)
- `update-install` - Instalar atualização

### App Control
- `app-restart` - Reiniciar aplicativo
- `app-quit` - Fechar aplicativo

### Update Offline (Compatibilidade)
- `update-detect-drives` - Detectar pendrives
- `update-check` - Verificar atualização offline
- `update-apply` - Aplicar atualização offline

### Backup & Logs
- `update-create-backup` - Criar backup
- `update-restore-backup` - Restaurar backup
- `update-get-logs` - Obter logs

### Storage
- `storage-save` - Salvar dados
- `storage-load` - Carregar dados
- `storage-clear` - Limpar dados
- `storage-info` - Informações do storage

### Window Control
- `window-toggle-fullscreen` - Alternar tela cheia
- `window-maximize` - Maximizar
- `window-minimize` - Minimizar
- `window-close` - Fechar
- `window-get-state` - Obter estado
- `window-set-zoom` - Definir zoom
- `window-get-zoom` - Obter zoom

## 🔧 Handlers de Compatibilidade

- `update-start-download` - Alias para `update-download` (mantido para compatibilidade)

## ✅ Validação

Execute `node scripts/validate-ipc.js` para validar todos os handlers.

## 📊 Estatísticas Atuais

- **25 handlers** registrados no preload.js
- **26 handlers** registrados no main.js (incluindo alias)
- **0 handlers faltando** ✅
- **100% de correspondência** ✅

