# 🔐 Sistema de Licença Híbrido (Offline + Online)

## 📋 Visão Geral

Sistema profissional de licenciamento que combina:
- **Ativação Online**: Primeira ativação requer conexão
- **Funcionamento Offline**: Após ativação, funciona sem internet
- **Revalidação Periódica**: Valida online a cada X dias

---

## 🔄 Fluxo Completo

### 1. Primeira Ativação (ONLINE)

```
Cliente → Sistema Electron
  ↓
Sistema obtém Machine ID
  ↓
POST /api/license/activate
  Body: { machineId, licenseKey }
  ↓
Servidor valida e salva licença
  ↓
Resposta: { success: true, expires: "2026-01-01" }
  ↓
Sistema salva licença local (criptografada)
  ↓
Sistema funciona normalmente
```

### 2. Funcionamento Offline

```
Sistema inicia
  ↓
Carrega licença local (criptografada)
  ↓
Valida Machine ID local
  ↓
Verifica se expirou (data local)
  ↓
Se válida → Sistema funciona normalmente
Se expirada → Bloqueia e solicita revalidação
```

### 3. Revalidação Periódica (ONLINE)

```
Sistema verifica última validação
  ↓
Se passou X dias (ex: 7 dias)
  ↓
Tenta validar online
  POST /api/check-license
  Body: { machineId }
  ↓
Se online e válida:
  - Atualiza última validação
  - Estende período offline
  ↓
Se offline:
  - Continua funcionando (período de graça)
  - Tenta novamente na próxima vez
```

---

## 🌐 Endpoints do Servidor

### `POST /api/license/activate`

**Primeira ativação da licença (requer conexão)**

**Request:**
```json
{
  "machineId": "abc123...",
  "licenseKey": "LICENSE-KEY-123"
}
```

**Response (Sucesso):**
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

**Response (Erro):**
```json
{
  "success": false,
  "error": "Chave de licença inválida"
}
```

---

### `POST /api/check-license`

**Verificar/revalidar licença (revalidação periódica)**

**Request:**
```json
{
  "machineId": "abc123..."
}
```

**Response (Válida):**
```json
{
  "valid": true,
  "expires": "2026-01-01T00:00:00.000Z",
  "machineId": "abc123...",
  "lastValidated": "2025-12-30T00:00:00.000Z",
  "daysRemaining": 365
}
```

**Response (Expirada):**
```json
{
  "valid": false,
  "reason": "LICENSE_EXPIRED",
  "expiresAt": "2025-12-01T00:00:00.000Z",
  "message": "Licença expirada. Renove sua licença."
}
```

**Response (Não encontrada):**
```json
{
  "valid": false,
  "reason": "LICENSE_NOT_FOUND",
  "message": "Licença não encontrada. Ative sua licença primeiro."
}
```

---

### `POST /api/license/renew`

**Renovar licença expirada**

**Request:**
```json
{
  "machineId": "abc123...",
  "licenseKey": "RENEW-KEY-123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Licença renovada com sucesso",
  "expiresAt": "2027-01-01T00:00:00.000Z"
}
```

---

## 💻 Integração no Sistema Electron

### 1. Primeira Ativação

```javascript
// src/utils/license-client.js
export async function activateLicenseOnline(licenseKey) {
  const machineId = await getMachineId();
  
  const response = await fetch('https://smarttech-update-server.up.railway.app/api/license/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ machineId, licenseKey })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Salvar licença local criptografada
    await saveLicenseLocal({
      machineId,
      licenseKey,
      expiresAt: data.license.expiresAt,
      activatedAt: data.license.activatedAt,
      lastValidated: new Date().toISOString()
    });
    
    return { success: true };
  }
  
  return { success: false, error: data.error };
}
```

### 2. Verificação Offline

```javascript
export async function checkLicenseOffline() {
  const license = await loadLicenseLocal();
  
  if (!license) {
    return { valid: false, reason: 'LICENSE_NOT_FOUND' };
  }
  
  // Verificar Machine ID
  const currentMachineId = await getMachineId();
  if (license.machineId !== currentMachineId) {
    return { valid: false, reason: 'MACHINE_ID_MISMATCH' };
  }
  
  // Verificar expiração
  const now = new Date();
  const expiresAt = new Date(license.expiresAt);
  
  if (now > expiresAt) {
    return { valid: false, reason: 'LICENSE_EXPIRED' };
  }
  
  // Verificar se precisa revalidar online
  const lastValidated = new Date(license.lastValidated);
  const daysSinceValidation = (now - lastValidated) / (1000 * 60 * 60 * 24);
  const needsRevalidation = daysSinceValidation >= 7; // 7 dias
  
  return {
    valid: true,
    needsRevalidation,
    daysRemaining: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
  };
}
```

### 3. Revalidação Periódica

```javascript
export async function revalidateLicenseOnline() {
  const license = await loadLicenseLocal();
  
  if (!license) {
    return { valid: false, reason: 'LICENSE_NOT_FOUND' };
  }
  
  try {
    const response = await fetch('https://smarttech-update-server.up.railway.app/api/check-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ machineId: license.machineId })
    });
    
    const data = await response.json();
    
    if (data.valid) {
      // Atualizar última validação local
      license.lastValidated = data.lastValidated;
      await saveLicenseLocal(license);
      
      return { valid: true, daysRemaining: data.daysRemaining };
    }
    
    return { valid: false, reason: data.reason };
  } catch (error) {
    // Offline - continuar funcionando
    console.warn('Revalidação online falhou (offline):', error);
    return { valid: true, offline: true };
  }
}
```

### 4. Fluxo no Main Process

```javascript
// electron/main.js
async function checkLicense() {
  // 1. Verificar offline primeiro
  const offlineCheck = await licenseManager.checkLicenseOffline();
  
  if (!offlineCheck.valid) {
    // Bloquear se inválida
    if (offlineCheck.reason === 'LICENSE_EXPIRED') {
      showLicenseExpiredDialog();
      return false;
    }
    if (offlineCheck.reason === 'LICENSE_NOT_FOUND') {
      showLicenseActivationDialog();
      return false;
    }
    return false;
  }
  
  // 2. Se precisa revalidar, tentar online
  if (offlineCheck.needsRevalidation) {
    const onlineCheck = await licenseManager.revalidateLicenseOnline();
    
    if (!onlineCheck.valid && !onlineCheck.offline) {
      // Licença inválida online - bloquear
      showLicenseInvalidDialog();
      return false;
    }
    
    // Se offline, continuar funcionando (período de graça)
  }
  
  return true;
}
```

---

## ⚙️ Configuração

### Período de Revalidação

Ajuste o intervalo de revalidação no código do cliente:

```javascript
const REVALIDATION_INTERVAL_DAYS = 7; // Revalidar a cada 7 dias
```

### Período de Graça Offline

Quando offline, o sistema continua funcionando por um período:

```javascript
const OFFLINE_GRACE_PERIOD_DAYS = 30; // 30 dias de graça offline
```

---

## 🔒 Segurança

### Armazenamento Local

- Licença salva criptografada (AES-256-GCM)
- Machine ID validado localmente
- Hash SHA256 para validação

### Comunicação Online

- HTTPS obrigatório
- Machine ID não pode ser alterado
- Validação de chave de licença no servidor

---

## 📊 Estados da Licença

| Estado | Offline | Online | Ação |
|--------|---------|--------|------|
| **Ativa** | ✅ Funciona | ✅ Funciona | Normal |
| **Expirada** | ❌ Bloqueado | ❌ Bloqueado | Renovar |
| **Não encontrada** | ❌ Bloqueado | ❌ Bloqueado | Ativar |
| **Precisa revalidar** | ✅ Funciona (graça) | ✅ Revalida | Tentar online |
| **Revalidação falhou** | ✅ Funciona (graça) | ❌ Bloqueado | Verificar servidor |

---

## 🚀 Deploy no Railway

1. **Conectar Repositório**
   - Railway detecta `package.json`
   - Executa `npm install` e `npm start`

2. **URL Gerada**
   ```
   https://smarttech-update-server.up.railway.app
   ```

3. **Variáveis de Ambiente**
   - `PORT`: Definida automaticamente pelo Railway

4. **Banco de Dados (Futuro)**
   - Adicionar PostgreSQL/MySQL para armazenar licenças
   - Substituir `Map` em memória por queries ao banco

---

## 📝 Exemplo de Uso no Electron

```javascript
// Verificar atualização
fetch("https://smarttech-update-server.up.railway.app/api/update")
  .then(res => res.json())
  .then(data => {
    const currentVersion = app.getVersion();
    if (data.version !== currentVersion) {
      // Mostrar modal de atualização
      showUpdateDialog({
        version: data.version,
        url: data.url,
        notes: data.notes
      });
    }
  });

// Ativar licença
fetch("https://smarttech-update-server.up.railway.app/api/license/activate", {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    machineId: await getMachineId(),
    licenseKey: userLicenseKey
  })
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Salvar local e continuar
      saveLicenseLocal(data.license);
    }
  });
```

---

## ✅ Vantagens do Sistema Híbrido

1. **Primeira Ativação Online**: Garante que licença é válida
2. **Funcionamento Offline**: Não depende de internet constante
3. **Revalidação Periódica**: Detecta licenças revogadas
4. **Período de Graça**: Continua funcionando se servidor offline
5. **Segurança**: Validação local + online

---

**Versão**: 1.0.0  
**Data**: 30/12/2025  
**Autor**: Smart Tech Rolândia

