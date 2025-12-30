# Documentação de Handlers IPC

Este documento lista todos os handlers IPC do sistema, garantindo que cada `ipcRenderer.invoke` tenha um `ipcMain.handle` correspondente com nome idêntico.

## Regra de Ouro
**NUNCA criar `ipcRenderer.invoke` sem criar o `ipcMain.handle` correspondente.**
**Os nomes dos canais IPC devem ser idênticos.**

## Handlers de App Data

| Canal IPC | Preload.js | Main.js | Status |
|-----------|------------|---------|--------|
| `clear-app-data` | ✅ | ✅ | ✅ |

## Handlers de Controle de Janela

| Canal IPC | Preload.js | Main.js | Status |
|-----------|------------|---------|--------|
| `window-toggle-fullscreen` | ✅ | ✅ | ✅ |
| `window-maximize` | ✅ | ✅ | ✅ |
| `window-minimize` | ✅ | ✅ | ✅ |
| `window-close` | ✅ | ✅ | ✅ |
| `window-get-state` | ✅ | ✅ | ✅ |
| `window-set-zoom` | ✅ | ✅ | ✅ |
| `window-get-zoom` | ✅ | ✅ | ✅ |

## Handlers de Atualização Offline

| Canal IPC | Preload.js | Main.js | Status |
|-----------|------------|---------|--------|
| `update-detect-drives` | ✅ | ✅ | ✅ |
| `update-check` | ✅ | ✅ | ✅ |
| `update-get-current-version` | ✅ | ✅ | ✅ |
| `update-create-backup` | ✅ | ✅ | ✅ |
| `update-apply` | ✅ | ✅ | ✅ |
| `update-restore-backup` | ✅ | ✅ | ✅ |
| `update-get-logs` | ✅ | ✅ | ✅ |

## Handlers de Atualização Online

| Canal IPC | Preload.js | Main.js | Status |
|-----------|------------|---------|--------|
| `update-check-online-status` | ✅ | ✅ | ✅ |
| `update-check-online` | ✅ | ✅ | ✅ |
| `update-start-download` | ✅ | ✅ | ✅ |
| `update-install` | ✅ | ✅ | ✅ |

## Handlers de Storage

| Canal IPC | Preload.js | Main.js | Status |
|-----------|------------|---------|--------|
| `storage-save` | ✅ | ✅ | ✅ |
| `storage-load` | ✅ | ✅ | ✅ |
| `storage-clear` | ✅ | ✅ | ✅ |
| `storage-info` | ✅ | ✅ | ✅ |

## Handlers Extras (Não usados no preload.js)

Estes handlers estão disponíveis no main.js mas não são chamados pelo preload.js. Mantidos para compatibilidade futura:

- `update-download-online` - Método alternativo de download
- `update-apply-online` - Método alternativo de aplicação

## Validação

Execute `node scripts/validate-ipc.js` para validar que todos os handlers estão corretos.

## Total

- **23 handlers** usados no preload.js ✅
- **25 handlers** registrados no main.js
- **0 handlers faltando** ✅
- **2 handlers extras** (documentados acima)

