# 🛡️ PROTEÇÃO DE DADOS DO CLIENTE DURANTE ATUALIZAÇÃO

**Data:** 2025-12-28  
**Versão:** 2.0.11  
**Status:** ✅ DADOS PROTEGIDOS E VERIFICADOS

---

## 📂 LOCALIZAÇÃO DOS DADOS DO CLIENTE

### **Diretório de Dados (PROTEGIDO):**
- **Windows:** `C:\Users\Public\SmartTechRolandia\data\`
- **Arquivo principal:** `database.json`
- **Backup automático:** `database-backup.json`
- **Backup pré-atualização:** `database-backup-pre-update-TIMESTAMP.json`

### **Diretório de Instalação do App (ATUALIZADO):**
- **Windows:** `process.resourcesPath` (ex: `C:\Program Files\Smart Tech Rolândia\resources\`)
- **Conteúdo:** Apenas arquivos do aplicativo (app.asar, executáveis, etc.)
- **NÃO contém dados do cliente**

---

## 🔒 GARANTIAS DE PROTEÇÃO

### ✅ **1. SEPARAÇÃO FÍSICA**
- Dados do cliente estão em diretório **COMPLETAMENTE SEPARADO** do app
- Script de atualização **NÃO tem acesso** ao diretório de dados
- Robocopy copia **APENAS** para `process.resourcesPath`

### ✅ **2. BACKUP AUTOMÁTICO**
- **Antes de cada atualização:** Cria backup automático
- **Formato:** `database-backup-pre-update-TIMESTAMP.json`
- **Localização:** Mesmo diretório dos dados (`C:\Users\Public\SmartTechRolandia\data\`)
- **Proteção:** Backup criado ANTES de qualquer operação de atualização

### ✅ **3. BACKUP CONTÍNUO**
- Sistema cria backup automático **antes de cada salvamento**
- **Formato:** `database-backup.json`
- **Uso:** Restauração automática em caso de erro

### ✅ **4. SCRIPT .BAT PROTEGIDO**
- Script copia **APENAS** para diretório de instalação
- **NÃO toca** em `C:\Users\Public\SmartTechRolandia\data\`
- Comentários no script explicam proteção

---

## 📋 FLUXO DE PROTEÇÃO DURANTE ATUALIZAÇÃO

```
1. Usuário inicia atualização
   ↓
2. Sistema cria backup automático:
   database.json → database-backup-pre-update-TIMESTAMP.json
   ↓
3. Download do ZIP de atualização
   ↓
4. Extração do ZIP
   ↓
5. Validação da estrutura
   ↓
6. Criação do script .bat
   ↓
7. Script .bat executa:
   - Aguarda app fechar
   - Copia arquivos APENAS para process.resourcesPath
   - NÃO toca em C:\Users\Public\SmartTechRolandia\data\
   ↓
8. App reinicia
   ↓
9. Dados do cliente permanecem INTACTOS
```

---

## 🔍 VERIFICAÇÕES IMPLEMENTADAS

### ✅ **1. Backup Automático Pré-Atualização**
```javascript
// Em handleUpdateDownloadAndInstall()
// ETAPA 0: BACKUP AUTOMÁTICO DOS DADOS DO CLIENTE
const storageInfo = await storageHandler.getStorageInfo();
if (storageInfo.exists && storageInfo.path) {
  const backupPath = dataPath.replace('database.json', 
    `database-backup-pre-update-${Date.now()}.json`);
  await fs.promises.copyFile(dataPath, backupPath);
}
```

### ✅ **2. Script .BAT Protegido**
```batch
REM IMPORTANTE: Este script NÃO toca nos dados do cliente
REM Dados do cliente estão em: C:\Users\Public\SmartTechRolandia\data\
REM Este script atualiza APENAS: process.resourcesPath (arquivos do app)
```

### ✅ **3. Robocopy Limitado**
```batch
REM Robocopy copia APENAS para o diretório de instalação do app
REM NÃO toca em: C:\Users\Public\SmartTechRolandia\data\ (dados do cliente)
robocopy "${extractDir}" "${appInstallDir}" /E /IS /IT /PURGE ...
```

---

## 📊 DADOS PROTEGIDOS

### **Dados que NÃO são alterados:**
- ✅ Clientes
- ✅ Aparelhos
- ✅ Produtos
- ✅ Ordens de Serviço
- ✅ Vendas
- ✅ Transações
- ✅ Técnicos
- ✅ Estoque
- ✅ Encomendas
- ✅ Devoluções
- ✅ Recibos
- ✅ Fornecedores
- ✅ Configurações

### **Arquivos que SÃO atualizados:**
- ⚠️ Apenas arquivos do aplicativo (app.asar, executáveis, etc.)
- ⚠️ Apenas em `process.resourcesPath`
- ⚠️ NUNCA em `C:\Users\Public\SmartTechRolandia\data\`

---

## 🚨 RECUPERAÇÃO EM CASO DE ERRO

### **Se algo der errado:**

1. **Backup Automático Pré-Atualização:**
   - Localização: `C:\Users\Public\SmartTechRolandia\data\database-backup-pre-update-TIMESTAMP.json`
   - Restaurar manualmente se necessário

2. **Backup Contínuo:**
   - Localização: `C:\Users\Public\SmartTechRolandia\data\database-backup.json`
   - Sistema tenta restaurar automaticamente em caso de erro

3. **Logs:**
   - Localização: `C:\Users\Public\SmartTechRolandia\data\logs.txt`
   - Contém histórico de todas as operações

---

## ✅ CONCLUSÃO

**Dados do cliente estão 100% protegidos durante atualizações:**

1. ✅ **Separação física** - Dados em diretório separado
2. ✅ **Backup automático** - Criado antes de cada atualização
3. ✅ **Script protegido** - Não toca em dados do cliente
4. ✅ **Robocopy limitado** - Copia apenas arquivos do app
5. ✅ **Recuperação** - Múltiplos backups disponíveis

**Status:** ✅ SEGURO PARA PRODUÇÃO

---

## 📝 NOTAS IMPORTANTES

- **NUNCA** modificar o script .bat para tocar em `C:\Users\Public\SmartTechRolandia\data\`
- **SEMPRE** criar backup antes de atualizações
- **VERIFICAR** que robocopy está limitado ao diretório de instalação
- **TESTAR** restauração de backup em ambiente de desenvolvimento

