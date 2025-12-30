# 🚀 Próximos Passos - Smart Tech Rolândia

## ✅ Status Atual

- [x] Backend Node.js criado em `server/`
- [x] Rotas de atualização e licença configuradas
- [x] Sistema de atualização integrado no Electron
- [x] IPC handlers registrados
- [x] Preload expõe APIs corretamente
- [x] Railway configurado
- [x] Estrutura limpa (sem Vite)

---

## 📋 Próximos Passos

### 1️⃣ TESTAR SERVIDOR LOCALMENTE

#### 1.1 Iniciar Servidor
```bash
cd C:\SmT2
npm start
```

**Resultado esperado:**
```
===========================================
🚀 Servidor Smart Tech Rolândia
===========================================
📡 Servidor rodando na porta 3000
🌐 URL: http://localhost:3000
===========================================
```

#### 1.2 Testar Endpoints

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Última Versão:**
```bash
curl http://localhost:3000/update/latest
```

**Resposta esperada:**
```json
{
  "version": "3.0.13",
  "notes": "Correções e melhorias",
  "url": "http://localhost:3000/update/3.0.13/SmartTechSetup.exe"
}
```

#### 1.3 Verificar Logs
- Servidor deve iniciar sem erros
- Endpoints devem responder corretamente
- CORS deve estar habilitado

---

### 2️⃣ DEPLOY NO RAILWAY

#### 2.1 Preparar Repositório

**Verificar arquivos essenciais:**
- [x] `package.json` com script `start`
- [x] `railway.json` configurado
- [x] `server/index.js` existe
- [x] `updates/latest.json` existe

#### 2.2 Conectar ao Railway

1. **Acessar Railway Dashboard**
   - https://railway.app
   - Fazer login

2. **Criar Novo Projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha o repositório `SmT2`

3. **Configuração Automática**
   - Railway detecta `package.json`
   - Executa `npm install` automaticamente
   - Executa `npm start` automaticamente

#### 2.3 Verificar Deploy

**Logs esperados:**
```
> smarttech-update-server@1.0.0 start
> node server/index.js

===========================================
🚀 Servidor Smart Tech Rolândia
===========================================
📡 Servidor rodando na porta 3000
🌐 URL: http://localhost:3000
===========================================
```

**URL gerada:**
```
https://smarttech-update-server.up.railway.app
```

#### 2.4 Testar Endpoints no Railway

**Health Check:**
```bash
curl https://smarttech-update-server.up.railway.app/health
```

**Última Versão:**
```bash
curl https://smarttech-update-server.up.railway.app/update/latest
```

---

### 3️⃣ CONFIGURAR URL NO ELECTRON

#### 3.1 Atualizar URL do Servidor

**Arquivo:** `electron/update-checker.js`

```javascript
// URL do servidor de atualizações (Railway)
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 'https://smarttech-update-server.up.railway.app';
```

**Opção 1: Hardcoded (produção)**
```javascript
const UPDATE_SERVER_URL = 'https://smarttech-update-server.up.railway.app';
```

**Opção 2: Variável de Ambiente**
```javascript
// No package.json do Electron, adicionar:
"scripts": {
  "electron:dev": "cross-env UPDATE_SERVER_URL=http://localhost:3000 electron .",
  "electron:build": "electron-builder"
}
```

#### 3.2 Testar no Electron

1. **Abrir aplicação Electron**
2. **Navegar para aba "Atualização"**
3. **Clicar em "Verificar Atualização"**
4. **Verificar logs no console:**
   ```
   [Update Check] Verificando atualizações...
   [Update Check] URL: https://smarttech-update-server.up.railway.app/update/latest
   [Update Check] Versão atual: 3.0.5
   [Update Check] Resposta do servidor: { version: "3.0.13", ... }
   ```

---

### 4️⃣ ATUALIZAR latest.json

#### 4.1 Editar Arquivo

**Arquivo:** `updates/latest.json`

```json
{
  "version": "3.0.13",
  "url": "https://smarttech-update-server.up.railway.app/update/3.0.13/SmartTechSetup.exe",
  "notes": "Correções e melhorias"
}
```

**Importante:**
- Atualizar `version` para nova versão
- Atualizar `url` com URL real do arquivo
- Atualizar `notes` com changelog

#### 4.2 Fazer Commit e Push

```bash
git add updates/latest.json
git commit -m "Atualizar versão para 3.0.13"
git push origin main
```

**Railway atualiza automaticamente!**

---

### 5️⃣ TESTAR SISTEMA COMPLETO

#### 5.1 Fluxo de Teste

1. **Servidor Railway rodando**
   - ✅ Health check responde
   - ✅ `/update/latest` retorna JSON correto

2. **Aplicação Electron**
   - ✅ Aba "Atualização" carrega
   - ✅ Versão atual exibida
   - ✅ Botão "Verificar Atualização" funciona

3. **Verificação de Atualização**
   - ✅ Conecta ao servidor Railway
   - ✅ Compara versões corretamente
   - ✅ Mostra status (Atualizado / Nova versão)

4. **Download de Atualização**
   - ✅ Botão "Baixar Atualização" abre navegador
   - ✅ URL correta é aberta
   - ✅ Download inicia

#### 5.2 Cenários de Teste

**Cenário 1: Versão Desatualizada**
- Versão atual: `3.0.5`
- Versão remota: `3.0.13`
- **Esperado:** Modal "Nova versão disponível"

**Cenário 2: Versão Atualizada**
- Versão atual: `3.0.13`
- Versão remota: `3.0.13`
- **Esperado:** Mensagem "Sistema atualizado"

**Cenário 3: Erro de Rede**
- Servidor offline ou inacessível
- **Esperado:** Mensagem "Erro de conexão" (não bloqueia app)

---

### 6️⃣ CONFIGURAR VARIÁVEIS DE AMBIENTE (OPCIONAL)

#### 6.1 No Railway

1. **Acessar Settings do Projeto**
2. **Adicionar Variáveis:**
   - `UPDATE_SERVER_URL` (se necessário)
   - `NODE_ENV=production`

#### 6.2 No Electron

**Arquivo:** `electron/update-checker.js`

```javascript
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://smarttech-update-server.up.railway.app'
    : 'http://localhost:3000');
```

---

### 7️⃣ MONITORAMENTO E LOGS

#### 7.1 Logs do Servidor

**Railway Dashboard:**
- Ver logs em tempo real
- Verificar erros
- Monitorar requisições

#### 7.2 Logs do Electron

**Console do Main Process:**
```
[Update Check] Verificando atualizações...
[Update Check] URL: https://...
[Update Check] Versão atual: 3.0.5
[Update Check] Resposta do servidor: {...}
[IPC] Resultado da verificação: {...}
```

---

### 8️⃣ PRÓXIMAS MELHORIAS (OPCIONAL)

#### 8.1 Banco de Dados
- Substituir `Map` em memória por banco real
- PostgreSQL ou MySQL no Railway
- Armazenar licenças persistentemente

#### 8.2 Autenticação
- Adicionar autenticação JWT
- Proteger endpoints sensíveis
- Rate limiting

#### 8.3 Download Automático
- Implementar download direto no Electron
- Barra de progresso
- Instalação automática

#### 8.4 Notificações
- Notificar usuário quando nova versão disponível
- Badge na aba "Atualização"
- Toast notification

---

## ✅ Checklist Final

Antes de considerar completo:

- [ ] Servidor testado localmente
- [ ] Deploy no Railway funcionando
- [ ] URL do servidor configurada no Electron
- [ ] Aba "Atualização" funcionando
- [ ] Verificação de atualização testada
- [ ] Download de atualização testado
- [ ] Erros de rede tratados
- [ ] Logs verificados
- [ ] Documentação atualizada

---

## 🆘 Troubleshooting

### Servidor não inicia
- Verificar `package.json` tem script `start`
- Verificar `server/index.js` existe
- Verificar dependências instaladas (`npm install`)

### Railway não detecta projeto
- Verificar `package.json` na raiz
- Verificar `railway.json` existe
- Verificar script `start` aponta para `server/index.js`

### Electron não conecta ao servidor
- Verificar URL em `update-checker.js`
- Verificar CORS habilitado no servidor
- Verificar firewall/antivírus

### Erro "fetch failed"
- Verificar internet do usuário
- Verificar servidor Railway online
- Verificar URL correta

---

## 📞 Suporte

Em caso de problemas:
1. Verificar logs do servidor (Railway)
2. Verificar logs do Electron (console)
3. Testar endpoints manualmente (curl/Postman)
4. Verificar documentação em `ESTRUTURA_PROJETO.md`

---

**Versão**: 1.0.0  
**Data**: 30/12/2025  
**Autor**: Smart Tech Rolândia

