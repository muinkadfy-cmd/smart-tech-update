# 📦 GUIA COMPLETO - PASSO A PASSO PARA ATUALIZAÇÕES

## 🎯 Objetivo
Este guia explica como criar, testar e distribuir atualizações do sistema Smart Tech Rolândia 2.0, tanto para implementar novas funcionalidades quanto para corrigir problemas.

---

## 📋 ÍNDICE

1. [Preparação do Ambiente](#1-preparação-do-ambiente)
2. [Desenvolvimento e Correções](#2-desenvolvimento-e-correções)
3. [Testes Locais](#3-testes-locais)
4. [Criação do Pacote de Atualização](#4-criação-do-pacote-de-atualização)
5. [Preparação do Pendrive](#5-preparação-do-pendrive)
6. [Teste da Atualização](#6-teste-da-atualização)
7. [Distribuição](#7-distribuição)
8. [Aplicação no Cliente](#8-aplicação-no-cliente)
9. [Troubleshooting](#9-troubleshooting)

---

## 1️⃣ PREPARAÇÃO DO AMBIENTE

### Requisitos
- ✅ Node.js instalado (versão 18 ou superior)
- ✅ Git configurado (para versionamento)
- ✅ Editor de código (VS Code recomendado)
- ✅ Pendrive formatado (FAT32 ou NTFS)

### Setup Inicial
```bash
# 1. Clone ou acesse o repositório
cd C:\SmT2

# 2. Instale dependências (se necessário)
npm install

# 3. Verifique se está tudo funcionando
npm run dev
```

---

## 2️⃣ DESENVOLVIMENTO E CORREÇÕES

### 2.1 Para Implementar Novas Funcionalidades

#### Passo 1: Atualizar Versão
```bash
# Edite package.json e atualize a versão
# Exemplo: "version": "2.0.0" → "version": "2.1.0"
```

**Formato de Versão (Semver):**
- **MAJOR** (2.0.0): Mudanças incompatíveis
- **MINOR** (2.1.0): Novas funcionalidades compatíveis
- **PATCH** (2.0.1): Correções de bugs

#### Passo 2: Desenvolver a Funcionalidade
```bash
# 1. Crie/modifique os arquivos necessários
# 2. Teste localmente
npm run dev

# 3. Verifique se não há erros
npm run build
```

#### Passo 3: Documentar Mudanças
Crie um arquivo `CHANGELOG.md` ou anote as mudanças:
```markdown
## Versão 2.1.0 - 2025-01-27
- ✅ Nova funcionalidade X
- ✅ Correção do bug Y
- ✅ Melhoria na interface Z
```

### 2.2 Para Corrigir Problemas

#### Passo 1: Identificar o Problema
1. Reproduza o erro
2. Verifique logs do console
3. Identifique o arquivo/linha com problema

#### Passo 2: Corrigir
```bash
# 1. Faça as correções necessárias
# 2. Teste a correção localmente
npm run dev

# 3. Verifique se o problema foi resolvido
npm run build
```

#### Passo 3: Atualizar Versão
```bash
# Atualize apenas o PATCH (último número)
# Exemplo: "2.0.0" → "2.0.1"
```

---

## 3️⃣ TESTES LOCAIS

### 3.1 Teste de Desenvolvimento
```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Acesse: http://localhost:8081
# Teste todas as funcionalidades modificadas
```

### 3.2 Teste de Build
```bash
# Gere o build de produção
npm run build

# Verifique se não há erros
# Os arquivos estarão em: dist/
```

### 3.3 Teste do Executável (Opcional)
```bash
# Gere o executável para testar
npm run electron:build:win

# Teste o executável gerado em: dist-electron/
```

**Checklist de Testes:**
- [ ] Todas as funcionalidades novas funcionam
- [ ] Correções aplicadas resolvem o problema
- [ ] Não há erros no console
- [ ] Build gera sem erros
- [ ] Interface não quebrou
- [ ] Dados são salvos corretamente

---

## 4️⃣ CRIAÇÃO DO PACOTE DE ATUALIZAÇÃO

### 4.1 Gerar Build de Produção
```bash
# 1. Certifique-se de que está na branch correta
git status

# 2. Gere o build
npm run build

# 3. Verifique se a pasta dist/ foi criada
# Deve conter: index.html, assets/, etc.
```

### 4.2 Verificar Versão Atual
```bash
# Verifique a versão no package.json
# Esta será a versão BASE (antes da atualização)
```

### 4.3 Preparar Arquivos para Atualização
A pasta `dist/` contém todos os arquivos que serão atualizados:
```
dist/
├── index.html
├── favicon.ico
├── assets/
│   ├── index-ABC123.js
│   ├── index-DEF456.css
│   └── ...
└── ...
```

---

## 5️⃣ PREPARAÇÃO DO PENDRIVE

### 5.1 Estrutura do Pendrive
O pendrive deve ter esta estrutura:

```
PENDRIVE (E:/ ou F:/)
├── update-info.json          ← OBRIGATÓRIO
├── package.json              ← OPCIONAL (se versão mudou)
└── update/                   ← OBRIGATÓRIO
    ├── index.html
    ├── favicon.ico
    └── assets/
        ├── index-*.js
        ├── index-*.css
        └── ...
```

### 5.2 Criar Estrutura no Pendrive

#### Passo 1: Conectar Pendrive
1. Conecte o pendrive ao computador
2. Anote a letra do pendrive (ex: `E:\` ou `F:\`)

#### Passo 2: Criar Pastas
```bash
# No Windows Explorer ou PowerShell:
# 1. Abra o pendrive
# 2. Crie a pasta: update
```

#### Passo 3: Copiar Arquivos
```bash
# Copie TODO o conteúdo de dist/ para update/ no pendrive
# Exemplo:
# dist/index.html → E:/update/index.html
# dist/assets/* → E:/update/assets/*
```

**⚠️ IMPORTANTE:**
- Copie TODOS os arquivos de `dist/` para `update/`
- Mantenha a estrutura de pastas
- Não copie a pasta `dist/` inteira, apenas o conteúdo

### 5.3 Criar update-info.json

Crie um arquivo `update-info.json` na **RAIZ do pendrive**:

```json
{
  "version": "2.1.0",
  "description": "Correção de bugs e melhorias de performance",
  "date": "2025-01-27T10:30:00.000Z",
  "files": [
    "index.html",
    "assets/index-*.js",
    "assets/index-*.css"
  ]
}
```

**Campos:**
- `version` (OBRIGATÓRIO): Versão da atualização (deve ser MAIOR que a versão atual)
- `description` (OPCIONAL): Descrição das mudanças
- `date` (OPCIONAL): Data em formato ISO 8601
- `files` (OPCIONAL): Lista de arquivos (pode usar wildcards `*`)

**Exemplo Completo:**
```json
{
  "version": "2.1.0",
  "description": "Correção de bugs críticos:\n- Corrigido cálculo de taxas\n- Melhorada validação de formulários\n- Ajustado layout de impressão 80mm",
  "date": "2025-01-27T14:30:00.000Z"
}
```

### 5.4 Copiar package.json (Opcional)

Se a versão mudou, copie o `package.json` atualizado para a raiz do pendrive:
```bash
# Copie package.json do projeto para a raiz do pendrive
# Exemplo: C:\SmT2\package.json → E:\package.json
```

---

## 6️⃣ TESTE DA ATUALIZAÇÃO

### 6.1 Teste em Ambiente de Desenvolvimento

#### Passo 1: Preparar Ambiente de Teste
```bash
# 1. Instale o sistema em uma máquina de teste
# 2. Anote a versão atual instalada
# 3. Prepare o pendrive com a atualização
```

#### Passo 2: Testar Atualização
1. Abra o aplicativo Smart Tech Rolândia 2.0
2. Vá para **"Atualização"** no menu lateral
3. Conecte o pendrive
4. Clique em **"Detectar Pendrives"**
5. Selecione o pendrive na lista
6. Clique em **"Verificar Atualização"**
7. Verifique se mostra:
   - Versão atual: `2.0.0` (exemplo)
   - Nova versão: `2.1.0` (exemplo)
8. Clique em **"Aplicar Atualização"**
9. Aguarde o processo:
   - ✅ Backup criado automaticamente
   - ✅ Arquivos copiados
   - ✅ Atualização aplicada
10. **Reinicie o aplicativo**
11. Verifique se:
   - ✅ Versão foi atualizada
   - ✅ Funcionalidades novas funcionam
   - ✅ Correções foram aplicadas
   - ✅ Dados não foram perdidos

### 6.2 Verificar Logs
1. Na página de Atualização, veja os logs
2. Verifique se há erros
3. Confirme que o backup foi criado

**Checklist de Teste:**
- [ ] Pendrive detectado corretamente
- [ ] Versão comparada corretamente
- [ ] Backup criado com sucesso
- [ ] Atualização aplicada sem erros
- [ ] Aplicativo reinicia corretamente
- [ ] Versão atualizada no sistema
- [ ] Funcionalidades funcionam
- [ ] Dados preservados
- [ ] Logs registrados corretamente

---

## 7️⃣ DISTRIBUIÇÃO

### 7.1 Preparar Pendrive Final

#### Passo 1: Verificar Conteúdo
```
PENDRIVE/
├── update-info.json          ✅ Verificado
├── package.json              ✅ Verificado (se necessário)
└── update/                   ✅ Todos os arquivos presentes
    ├── index.html
    ├── favicon.ico
    └── assets/
        └── ...
```

#### Passo 2: Testar em Múltiplos Ambientes
- [ ] Teste em Windows 10
- [ ] Teste em Windows 11
- [ ] Teste com sistema limpo
- [ ] Teste com sistema com dados

### 7.2 Documentação da Atualização

Crie um arquivo `ATUALIZACAO_2.1.0.txt` (opcional) no pendrive:

```
========================================
ATUALIZAÇÃO SMART TECH ROLÂNDIA 2.0
Versão: 2.1.0
Data: 27/01/2025
========================================

MUDANÇAS:
- Correção de bugs críticos
- Melhorias de performance
- Ajustes na interface

INSTRUÇÕES:
1. Conecte o pendrive ao computador
2. Abra o aplicativo Smart Tech Rolândia 2.0
3. Vá para "Atualização" no menu
4. Clique em "Detectar Pendrives"
5. Selecione este pendrive
6. Clique em "Verificar Atualização"
7. Clique em "Aplicar Atualização"
8. Reinicie o aplicativo

OBSERVAÇÕES:
- Um backup será criado automaticamente
- Se algo der errado, o backup será restaurado
- Não remova o pendrive durante a atualização
```

---

## 8️⃣ APLICAÇÃO NO CLIENTE

### 8.1 Instruções para o Cliente

#### Passo 1: Preparar
1. ✅ Fechar o aplicativo Smart Tech Rolândia 2.0 (se estiver aberto)
2. ✅ Conectar o pendrive ao computador
3. ✅ Aguardar o Windows reconhecer o pendrive

#### Passo 2: Abrir Aplicativo
1. Abra o aplicativo Smart Tech Rolândia 2.0
2. Vá para a página **"Atualização"** no menu lateral

#### Passo 3: Detectar Pendrive
1. Clique no botão **"Detectar Pendrives"**
2. Aguarde alguns segundos
3. O pendrive deve aparecer na lista

#### Passo 4: Verificar Atualização
1. Selecione o pendrive na lista
2. Clique em **"Verificar Atualização"**
3. O sistema mostrará:
   - Versão atual instalada
   - Nova versão disponível
   - Descrição da atualização

#### Passo 5: Aplicar Atualização
1. Clique em **"Aplicar Atualização"**
2. Confirme a ação
3. **NÃO REMOVA O PENDRIVE** durante o processo
4. Aguarde a conclusão:
   - ✅ Backup criado
   - ✅ Arquivos atualizados
   - ✅ Atualização concluída

#### Passo 6: Reiniciar
1. **Feche completamente o aplicativo**
2. Abra novamente
3. Verifique se a versão foi atualizada
4. Teste as funcionalidades

### 8.2 Em Caso de Erro

Se a atualização falhar:
1. O sistema oferecerá restaurar o backup automaticamente
2. Ou vá para "Atualização" → "Restaurar Backup"
3. Selecione o backup mais recente
4. Confirme a restauração
5. Reinicie o aplicativo

---

## 9️⃣ TROUBLESHOOTING

### Problema: Pendrive não detectado

**Soluções:**
1. Verifique se o pendrive está conectado
2. Verifique se o Windows reconhece o pendrive
3. Tente outra porta USB
4. Clique em "Detectar Pendrives" novamente
5. Verifique se o pendrive não está corrompido

### Problema: Atualização não encontrada

**Soluções:**
1. Verifique se existe `update-info.json` na raiz do pendrive
2. Verifique se existe a pasta `update/` com arquivos
3. Verifique se a versão no `update-info.json` é MAIOR que a atual
4. Verifique se o formato do JSON está correto

### Problema: Erro durante atualização

**Soluções:**
1. Verifique os logs na página de Atualização
2. Verifique se há espaço suficiente no disco
3. Verifique se o aplicativo não está em uso
4. Tente restaurar o backup
5. Verifique se os arquivos no pendrive estão corretos

### Problema: Arquivos não atualizados

**Soluções:**
1. Verifique se os arquivos estão na pasta `update/` correta
2. Verifique se a estrutura de pastas está correta
3. Verifique os logs para ver quais arquivos foram atualizados
4. Tente atualizar novamente

### Problema: Versão não mudou após atualização

**Soluções:**
1. Verifique se reiniciou o aplicativo completamente
2. Verifique se o `package.json` foi atualizado
3. Verifique os logs de atualização
4. Tente atualizar novamente

---

## ✅ CHECKLIST FINAL

Antes de distribuir uma atualização:

### Desenvolvimento
- [ ] Código testado localmente
- [ ] Build gerado sem erros
- [ ] Versão atualizada no `package.json`
- [ ] Mudanças documentadas

### Pacote de Atualização
- [ ] `update-info.json` criado corretamente
- [ ] Versão no `update-info.json` é maior que a atual
- [ ] Pasta `update/` contém todos os arquivos
- [ ] Estrutura de pastas correta
- [ ] `package.json` copiado (se necessário)

### Testes
- [ ] Testado em ambiente de desenvolvimento
- [ ] Testado em máquina limpa
- [ ] Backup testado e funcional
- [ ] Restauração testada
- [ ] Logs verificados

### Documentação
- [ ] Instruções criadas
- [ ] Mudanças documentadas
- [ ] Troubleshooting preparado

---

## 📝 EXEMPLO PRÁTICO COMPLETO

### Cenário: Corrigir bug de cálculo de taxas

#### 1. Desenvolvimento
```bash
# 1. Identificar o problema
# Bug: Taxas não são aplicadas corretamente em vendas

# 2. Corrigir o código
# Arquivo: src/pages/Vendas.tsx
# Linha: 314 - Corrigir cálculo de valorTransacao

# 3. Testar
npm run dev
# Testar: Criar uma venda com cartão de crédito
# Verificar: Taxa aplicada corretamente

# 4. Build
npm run build
# Verificar: Sem erros
```

#### 2. Preparar Atualização
```bash
# 1. Atualizar versão
# package.json: "2.0.0" → "2.0.1"

# 2. Criar update-info.json
{
  "version": "2.0.1",
  "description": "Correção crítica: Cálculo de taxas em vendas",
  "date": "2025-01-27T15:00:00.000Z"
}

# 3. Copiar arquivos
# dist/* → E:/update/*
# update-info.json → E:/
# package.json → E:/
```

#### 3. Testar
```bash
# 1. Instalar sistema versão 2.0.0 em máquina de teste
# 2. Conectar pendrive
# 3. Aplicar atualização
# 4. Verificar: Taxa calculada corretamente
```

#### 4. Distribuir
```bash
# Pendrive pronto para distribuição
# Instruções para cliente preparadas
```

---

## 🎯 RESUMO RÁPIDO

### Para Desenvolver:
1. ✅ Desenvolver/Corrigir
2. ✅ Testar localmente
3. ✅ `npm run build`
4. ✅ Verificar erros

### Para Criar Atualização:
1. ✅ Copiar `dist/*` → `pendrive/update/*`
2. ✅ Criar `update-info.json` na raiz
3. ✅ Atualizar versão
4. ✅ Testar no pendrive

### Para Aplicar:
1. ✅ Conectar pendrive
2. ✅ Abrir app → "Atualização"
3. ✅ Detectar → Verificar → Aplicar
4. ✅ Reiniciar app

---

## 📞 SUPORTE

Em caso de dúvidas ou problemas:
1. Verifique os logs de atualização
2. Consulte este guia
3. Verifique a documentação em `ATUALIZACAO_OFFLINE.md`
4. Teste em ambiente de desenvolvimento primeiro

---

**Última atualização:** 27/01/2025
**Versão do guia:** 1.0

