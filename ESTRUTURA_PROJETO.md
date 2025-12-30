# 📁 Estrutura do Projeto - Smart Tech Rolândia

## 🎯 Visão Geral

Projeto reconfigurado do zero com:
- **Backend Node.js (Express)** rodando no Railway
- **Sistema de atualização** integrado no Electron
- **Sem Vite** - Backend puro Node.js

---

## 📂 Estrutura de Pastas

```
C:\SmT2/
├── server/                    # Backend Node.js (Railway)
│   ├── index.js              # Servidor principal Express
│   ├── routes/
│   │   ├── update.js         # Rotas de atualização
│   │   └── license.js         # Rotas de licença
│   ├── package.json          # Dependências do servidor
│   └── README.md             # Documentação do servidor
│
├── electron/                  # Aplicação Electron
│   ├── main.js               # Processo principal
│   ├── preload.cjs           # Preload script (CommonJS)
│   ├── update-checker.js     # Verificação de atualizações
│   ├── updateManager.js      # Gerenciador de atualizações
│   ├── updater.js            # Atualizador
│   ├── storage-handler.js    # Manipulador de armazenamento
│   ├── devtools-detector.js # Detector de DevTools
│   └── license-manager.js     # Gerenciador de licenças
│
├── updates/                   # Arquivos de atualização
│   └── latest.json           # Última versão disponível
│
├── package.json               # Configuração raiz (aponta para server/)
├── railway.json              # Configuração Railway
└── README.md                  # Documentação principal
```

---

## 🚀 Backend (server/)

### `server/index.js`
Servidor Express principal que:
- Inicia na porta `process.env.PORT` ou `3000`
- Configura CORS e JSON parsing
- Registra rotas de update e license
- Health check em `/health`

### `server/routes/update.js`
Rotas de atualização:
- `GET /update/latest` - Retorna última versão disponível
- `GET /update/:version/:filename` - Download de arquivos

### `server/routes/license.js`
Rotas de licença:
- `POST /license/check` - Verificar licença
- `POST /license/activate` - Ativar licença

---

## ⚡ Electron

### `electron/main.js`
Processo principal que:
- Cria janela principal
- Registra IPC handlers
- Integra sistema de atualização
- Gerencia licenças

### `electron/update-checker.js`
Módulo de verificação de atualizações:
- `checkForUpdates(currentVersion)` - Verifica atualização via API
- `compareVersions(v1, v2)` - Compara versões semver

### IPC Handlers (main.js)
- `update-check-online-railway` - Verifica atualização online
- `update-download-railway` - Baixa atualização (abre navegador)

### Preload (preload.cjs)
Expõe APIs para renderer:
- `electron.update.checkOnlineRailway()`
- `electron.update.downloadRailway(url)`
- `electron.update.getCurrentVersion()`

---

## 🔄 Fluxo de Atualização

```
1. Usuário clica "Verificar Atualização"
   ↓
2. Renderer chama electron.update.checkOnlineRailway()
   ↓
3. Main process chama checkForUpdates(currentVersion)
   ↓
4. Fetch para https://smarttech-update-server.up.railway.app/update/latest
   ↓
5. Compara versão atual com remota
   ↓
6. Se disponível:
   - Mostra modal "Nova versão disponível"
   - Botão "Baixar atualização"
   ↓
7. Usuário clica "Baixar"
   ↓
8. Main process abre URL no navegador (shell.openExternal)
```

---

## 📡 Endpoints do Servidor

### `GET /health`
```json
{
  "status": "OK",
  "timestamp": "2025-12-30T...",
  "uptime": 123.45
}
```

### `GET /update/latest`
```json
{
  "version": "3.0.13",
  "notes": "Correções e melhorias",
  "url": "https://smarttech-update-server.up.railway.app/update/3.0.13/SmartTechSetup.exe"
}
```

### `POST /license/check`
**Request:**
```json
{
  "machineId": "abc123..."
}
```

**Response:**
```json
{
  "valid": true,
  "expires": "2026-01-01T00:00:00.000Z",
  "machineId": "abc123...",
  "lastValidated": "2025-12-30T00:00:00.000Z"
}
```

---

## 🚂 Deploy no Railway

1. **Conectar Repositório**
   - Railway detecta `package.json`
   - Executa `npm install` e `npm start`

2. **Script de Start**
   ```json
   {
     "scripts": {
       "start": "node server/index.js"
     }
   }
   ```

3. **URL Gerada**
   ```
   https://smarttech-update-server.up.railway.app
   ```

4. **Variáveis de Ambiente**
   - `PORT`: Definida automaticamente pelo Railway

---

## 🔧 Configuração

### Atualizar Versão

Edite `updates/latest.json`:
```json
{
  "version": "3.0.14",
  "url": "https://smarttech-update-server.up.railway.app/update/3.0.14/SmartTechSetup.exe",
  "notes": "Nova versão com melhorias"
}
```

### URL do Servidor

No `electron/update-checker.js`:
```javascript
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://smarttech-update-server.up.railway.app';
```

---

## ✅ Checklist de Validação

- [x] Backend Node.js sem Vite
- [x] Express configurado corretamente
- [x] Rotas de update e license funcionando
- [x] Sistema de atualização integrado no Electron
- [x] IPC handlers registrados
- [x] Preload expõe APIs corretamente
- [x] Railway configurado
- [x] `npm start` funciona
- [x] Sem dependências do Vite

---

## 📝 Notas Importantes

1. **Sem Vite**: Projeto não usa mais Vite, apenas Node.js puro
2. **Backend Separado**: Servidor em `server/` é independente
3. **Electron Independente**: App Electron consome API do servidor
4. **Railway Ready**: Configurado para deploy automático

---

**Versão**: 1.0.0  
**Data**: 30/12/2025  
**Autor**: Smart Tech Rolândia

