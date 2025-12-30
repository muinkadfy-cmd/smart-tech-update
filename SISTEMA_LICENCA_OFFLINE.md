# 🔐 Sistema de Licença Offline - Smart Tech Rolândia 2.0

## 📋 Visão Geral

Sistema profissional de licenciamento offline baseado em identificação única de hardware (Machine ID) e validação criptográfica SHA256. O sistema funciona 100% offline, sem necessidade de conexão com internet após a ativação.

---

## 🎯 Características Principais

### ✅ Segurança
- **ID Único do Hardware**: Cada PC possui um Machine ID único gerado via `node-machine-id`
- **Validação SHA256**: Licenças validadas usando hash SHA256 com chave secreta
- **Armazenamento Criptografado**: Licença salva em arquivo criptografado (AES-256-GCM)
- **Bloqueio de Execução**: Sistema não inicia sem licença válida (apenas em produção)
- **Detecção de Cópia**: Sistema detecta se foi copiado para outro PC e bloqueia

### ✅ Proteção contra Engenharia Reversa
- **Detecção de DevTools**: Bloqueia e fecha DevTools em produção
- **Bloqueio de Atalhos**: Previne abertura de DevTools via F12, Ctrl+Shift+I, etc.
- **Menu de Contexto Desabilitado**: Remove menu de contexto do navegador

### ✅ Persistência
- **Preservação em Atualizações**: Licença mantida durante atualizações do sistema
- **Backup Automático**: Instalador faz backup da licença antes de limpar cache
- **Armazenamento Local**: Licença salva em `%APPDATA%\Smart Tech Rolândia\license.dat`

---

## 📁 Estrutura de Arquivos

```
electron/
├── license-manager.js      # Gerenciador de licenças (validação, ativação)
├── devtools-detector.js    # Detector e bloqueador de DevTools
└── main.js                 # Integração do sistema de licença

src/
└── pages/
    └── LicenseActivation.tsx  # Interface de ativação de licença

build/
└── installer-script.nsh    # Script NSIS (preserva licença em atualizações)
```

---

## 🔧 Como Funciona

### 1. **Geração do Machine ID**

O sistema gera um ID único baseado no hardware do computador:

```javascript
import machineId from 'node-machine-id';

// Obter Machine ID
const machineId = await machineId.machineId();
// Exemplo: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
```

### 2. **Geração da Licença**

A licença é gerada combinando:
- Machine ID do PC
- Chave de licença fornecida pelo usuário
- Chave secreta do sistema

```javascript
const combined = `${machineId}:${licenseKey}:${SECRET_KEY}`;
const licenseHash = crypto.createHash('sha256').update(combined).digest('hex');
```

### 3. **Validação**

A cada inicialização, o sistema:
1. Carrega a licença criptografada
2. Obtém o Machine ID atual
3. Compara com o Machine ID salvo
4. Valida o hash SHA256
5. Bloqueia execução se inválida

### 4. **Armazenamento Criptografado**

A licença é salva usando AES-256-GCM:

```javascript
// Criptografar
const encrypted = encrypt(JSON.stringify(licenseData), derivedKey);

// Salvar em arquivo
fs.writeFileSync(licenseFilePath, encrypted, { mode: 0o600 });
```

---

## 🚀 Fluxo de Ativação

### Passo 1: Obter Machine ID

1. Usuário abre o sistema pela primeira vez
2. Sistema detecta que não há licença
3. Abre janela de ativação automaticamente
4. Exibe Machine ID único do PC

### Passo 2: Gerar Chave de Licença

**IMPORTANTE**: A chave de licença deve ser gerada pelo desenvolvedor/suporte usando o mesmo algoritmo:

```javascript
// Script para gerar licença (gerador-licenca.js)
import crypto from 'crypto';

const SECRET_KEY = 'PROD_SECRET_KEY_SMART_TECH_ROLANDIA_2025_ENCRYPTED';
const machineId = process.argv[2]; // Machine ID do cliente
const licenseKey = process.argv[3]; // Chave personalizada

const combined = `${machineId}:${licenseKey}:${SECRET_KEY}`;
const hash = crypto.createHash('sha256').update(combined).digest('hex');

console.log('Licença gerada:', hash);
console.log('Chave de licença para o cliente:', licenseKey);
```

### Passo 3: Ativar no Sistema

1. Usuário insere a chave de licença na interface
2. Sistema gera hash e valida
3. Salva licença criptografada
4. Reinicia aplicação

---

## 🛡️ Proteção em Produção

### Detecção de DevTools

O sistema detecta e bloqueia DevTools em produção:

```javascript
// Bloquear F12, Ctrl+Shift+I, Ctrl+U
win.webContents.on('before-input-event', (event, input) => {
  if (input.key === 'F12' || 
      (input.control && input.shift && input.key === 'I')) {
    event.preventDefault();
    app.quit(); // Terminar aplicação
  }
});
```

### Verificação Periódica

O sistema verifica a cada 1 segundo se DevTools foi aberto:

```javascript
setInterval(() => {
  if (win.webContents.isDevToolsOpened()) {
    win.webContents.closeDevTools();
    app.quit();
  }
}, 1000);
```

---

## 📦 Preservação em Atualizações

O instalador NSIS preserva automaticamente a licença:

```nsis
; Backup da licença antes de limpar cache
IfFileExists "$APPDATA\Smart Tech Rolândia\license.dat" 0 +3
  CopyFiles /SILENT "$APPDATA\Smart Tech Rolândia\license.dat" "$TEMP\license_backup.dat"

; Limpar cache...

; Restaurar licença após limpeza
IfFileExists "$TEMP\license_backup.dat" 0 +3
  CopyFiles /SILENT "$TEMP\license_backup.dat" "$APPDATA\Smart Tech Rolândia\license.dat"
  Delete "$TEMP\license_backup.dat"
```

---

## 🔑 Chaves Secretas

### Desenvolvimento
```javascript
const SECRET_KEY = 'DEV_SECRET_KEY_SMART_TECH_ROLANDIA_2025';
```

### Produção
```javascript
const SECRET_KEY = 'PROD_SECRET_KEY_SMART_TECH_ROLANDIA_2025_ENCRYPTED';
```

**⚠️ IMPORTANTE**: Em produção, a chave secreta deve ser:
1. Diferente da chave de desenvolvimento
2. Ofuscada no código
3. Mantida em segredo absoluto

---

## 📝 API do Sistema de Licença

### IPC Handlers (Main Process)

```javascript
// Obter Machine ID
ipcMain.handle('license-get-machine-id', async () => {
  const machineId = await licenseManager.getMachineId();
  return { success: true, machineId };
});

// Verificar licença
ipcMain.handle('license-check', async () => {
  return await licenseManager.checkLicense();
});

// Ativar licença
ipcMain.handle('license-activate', async (event, licenseKey) => {
  return await licenseManager.activateLicense(licenseKey);
});

// Obter informações
ipcMain.handle('license-get-info', async () => {
  return await licenseManager.getLicenseInfo();
});

// Remover licença
ipcMain.handle('license-remove', async () => {
  return await licenseManager.removeLicense();
});
```

### Preload (Renderer)

```javascript
window.electron.license.getMachineId()
window.electron.license.check()
window.electron.license.activate(licenseKey)
window.electron.license.getInfo()
window.electron.license.remove()
```

---

## 🧪 Testes

### Modo Desenvolvimento

Em desenvolvimento (`NODE_ENV=development`), o sistema:
- ✅ Não verifica licença (permite execução)
- ✅ Permite DevTools
- ✅ Logs detalhados

### Modo Produção

Em produção (`app.isPackaged === true`), o sistema:
- ❌ Bloqueia sem licença válida
- ❌ Bloqueia DevTools
- ❌ Logs mínimos

---

## 🔐 Segurança Adicional

### Ofuscação de Código

Para produção, recomenda-se ofuscar o código JavaScript:

```bash
# Instalar ofuscador
npm install --save-dev javascript-obfuscator

# Ofuscar electron/license-manager.js
javascript-obfuscator electron/license-manager.js \
  --output electron/license-manager.obfuscated.js \
  --compact true \
  --control-flow-flattening true \
  --dead-code-injection true
```

### Chave Secreta Ofuscada

A chave secreta pode ser ofuscada usando múltiplas camadas:

```javascript
// Exemplo de ofuscação
const SECRET_KEY = atob('UFJPRF9TRUNSRVRfS0VZX1NNQVJUX1RFQ0hfUk9MQU5ESUFfMjAyNV9FTkNSWVBURUQ=');
```

---

## 📊 Estrutura do Arquivo de Licença

O arquivo `license.dat` contém (criptografado):

```json
{
  "hash": "a1b2c3d4e5f6...",      // Hash SHA256 da licença
  "machineId": "abc123...",        // Machine ID do PC
  "licenseKey": "LICENSE-KEY-123", // Chave de licença
  "createdAt": "2025-12-30T...",   // Data de criação
  "version": "1.0.0"               // Versão do formato
}
```

---

## 🚨 Tratamento de Erros

### Licença Não Encontrada
- **Motivo**: `LICENSE_NOT_FOUND`
- **Ação**: Abrir janela de ativação

### Machine ID Não Corresponde
- **Motivo**: `MACHINE_ID_MISMATCH`
- **Ação**: Bloquear execução (sistema copiado para outro PC)

### Licença Inválida
- **Motivo**: `LICENSE_INVALID`
- **Ação**: Bloquear execução

---

## 📞 Suporte

Para gerar licenças para clientes:

1. Solicitar Machine ID do cliente
2. Gerar chave de licença usando script
3. Enviar chave de licença ao cliente
4. Cliente ativa no sistema

---

## ✅ Checklist de Implementação

- [x] Instalar `node-machine-id`
- [x] Criar `license-manager.js`
- [x] Criar `devtools-detector.js`
- [x] Integrar no `main.js`
- [x] Criar interface de ativação
- [x] Adicionar IPC handlers
- [x] Atualizar preload
- [x] Configurar instalador para preservar licença
- [x] Documentar sistema

---

## 📚 Referências

- [node-machine-id](https://www.npmjs.com/package/node-machine-id)
- [Node.js Crypto](https://nodejs.org/api/crypto.html)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)

---

**Versão**: 1.0.0  
**Data**: 30/12/2025  
**Autor**: Smart Tech Rolândia

