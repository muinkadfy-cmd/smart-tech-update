# 🚀 Smart Tech Rolândia - Servidor de Atualizações

Servidor Node.js/Express para gerenciar atualizações e licenças do sistema Smart Tech Rolândia.

## 📋 Estrutura

```
smarttech-update-server/
├── server.js
├── package.json
├── updates/
│   └── latest.json
└── railway.json
```

## 🚀 Como Usar

### Instalação

```bash
npm install
```

### Executar Localmente

```bash
npm start
```

Servidor estará disponível em: `http://localhost:3000`

## 🚂 Deploy no Railway

Railway detecta automaticamente:
- `npm install`
- `npm start`

**Resultado esperado no log:**
```
Servidor rodando na porta 3000
```

**URL gerada:**
```
https://smarttech-update-server.up.railway.app
```

## 📡 Endpoints

### `GET /health`
Health check do servidor.

### `POST /api/license/activate`
Ativar licença (primeira vez - ONLINE).

**Request:**
```json
{
  "machineId": "abc123...",
  "licenseKey": "LICENSE-KEY-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Licença ativada com sucesso",
  "license": {
    "machineId": "abc123...",
    "expiresAt": "2026-01-01T00:00:00.000Z",
    "activatedAt": "2025-12-30T00:00:00.000Z"
  }
}
```

### `POST /api/check-license`
Verificar/revalidar licença (revalidação periódica - ONLINE).

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
  "lastValidated": "2025-12-30T00:00:00.000Z",
  "daysRemaining": 365
}
```

### `POST /api/license/renew`
Renovar licença expirada.

### `GET /api/update`
Retorna informações de atualização (do `updates/latest.json`).

**Response:**
```json
{
  "version": "3.0.5",
  "url": "https://SEU_LINK_DO_UPDATE/app-3.0.5.exe",
  "notes": "Correções e melhorias de desempenho"
}
```

### `GET /api/update/check?version=X.X.X`
Verifica se há atualização disponível.

**Response:**
```json
{
  "available": true,
  "currentVersion": "3.0.4",
  "latestVersion": "3.0.5",
  "url": "https://SEU_LINK_DO_UPDATE/app-3.0.5.exe",
  "notes": "Correções e melhorias de desempenho"
}
```

## 🧩 Integração com Sistema Electron

### Verificar Atualização

```javascript
fetch("https://smarttech-update-server.up.railway.app/api/update")
  .then(res => res.json())
  .then(data => {
    const appVersion = app.getVersion();
    if (data.version !== appVersion) {
      // Mostrar modal de atualização
      showUpdateDialog({
        version: data.version,
        url: data.url,
        notes: data.notes
      });
    }
  });
```

### Ativar Licença (Primeira Vez)

```javascript
const machineId = await getMachineId();
const response = await fetch("https://smarttech-update-server.up.railway.app/api/license/activate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    machineId: machineId,
    licenseKey: userLicenseKey
  })
});

const data = await response.json();
if (data.success) {
  // Salvar licença local criptografada
  await saveLicenseLocal(data.license);
}
```

### Revalidar Licença (Periódica)

```javascript
const machineId = await getMachineId();
const response = await fetch("https://smarttech-update-server.up.railway.app/api/check-license", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ machineId })
});

const data = await response.json();
if (data.valid) {
  // Atualizar última validação local
  await updateLicenseLocal(data);
}
```

## 🔒 Sistema de Licença Híbrido

### Fluxo Ideal

1. **Primeira Ativação → ONLINE**
   - Cliente ativa licença via `/api/license/activate`
   - Licença salva local criptografada
   - Sistema funciona normalmente

2. **Funcionamento Offline**
   - Sistema valida licença local
   - Funciona sem internet

3. **Revalidação Periódica**
   - A cada X dias (ex: 7 dias)
   - Tenta validar online via `/api/check-license`
   - Se offline, continua funcionando (período de graça)

Ver documentação completa em: `SISTEMA_LICENCA_HIBRIDO.md`

## 📁 Estrutura de Arquivos

```
.
├── server.js          # Servidor Express
├── package.json       # Dependências
├── updates/           # Arquivos de atualização
│   └── latest.json    # Informações de atualização
└── railway.json       # Configuração Railway
```

## 🔧 Configuração

### Atualizar Versão

Edite `updates/latest.json`:

```json
{
  "version": "3.0.6",
  "url": "https://SEU_LINK_DO_UPDATE/app-3.0.6.exe",
  "notes": "Nova versão com melhorias"
}
```

## 🛠️ Tecnologias

- **Node.js**: Runtime
- **Express**: Framework web
- **CORS**: Middleware para CORS

## 📄 Licença

UNLICENSED - Smart Tech Rolândia
