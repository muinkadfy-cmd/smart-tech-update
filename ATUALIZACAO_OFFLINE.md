# 📦 Sistema de Atualização Offline via Pendrive

Este documento descreve como usar o sistema de atualização offline do Smart Tech Rolândia 2.0.

## 📋 Visão Geral

O sistema permite atualizar o aplicativo usando um pendrive, sem necessidade de conexão com a internet. O sistema:

- ✅ Detecta automaticamente pendrives conectados
- ✅ Verifica se há atualização disponível
- ✅ Compara versões automaticamente
- ✅ Cria backup antes de atualizar
- ✅ Restaura backup em caso de erro
- ✅ Registra logs de todas as operações

## 📁 Estrutura do Pacote de Atualização

Para criar um pacote de atualização, você precisa organizar os arquivos no pendrive da seguinte forma:

```
PENDRIVE/
├── update-info.json          # Informações da atualização (OBRIGATÓRIO)
├── package.json              # Novo package.json (OPCIONAL)
└── update/                   # Pasta com arquivos de atualização (OBRIGATÓRIO)
    ├── index.html
    ├── assets/
    │   ├── *.js
    │   ├── *.css
    │   └── ...
    └── ...
```

### 📄 update-info.json

Arquivo obrigatório que contém as informações da atualização:

```json
{
  "version": "2.1.0",
  "description": "Correção de bugs e melhorias de performance",
  "date": "2025-01-15T10:30:00.000Z",
  "files": [
    "index.html",
    "assets/index-*.js",
    "assets/index-*.css"
  ]
}
```

**Campos:**
- `version` (string, obrigatório): Versão da atualização no formato semver (X.Y.Z)
- `description` (string, opcional): Descrição da atualização
- `date` (string, opcional): Data da atualização em ISO 8601
- `files` (array, opcional): Lista de arquivos que serão atualizados

### 📁 update/

Pasta que contém todos os arquivos que serão copiados para o diretório `dist/` do aplicativo.

**Importante:**
- A estrutura de pastas dentro de `update/` será mantida
- Arquivos existentes serão substituídos
- Novos arquivos serão adicionados

## 🔧 Como Criar um Pacote de Atualização

### Passo 1: Preparar os Arquivos

1. Gere o build do aplicativo:
   ```bash
   npm run build
   ```

2. Os arquivos compilados estarão em `dist/`

### Passo 2: Criar a Estrutura no Pendrive

1. Conecte o pendrive ao computador
2. Crie a estrutura de pastas:
   ```
   PENDRIVE/
   ├── update-info.json
   ├── package.json (se necessário)
   └── update/
   ```

3. Copie os arquivos de `dist/` para `update/` no pendrive

4. Crie o arquivo `update-info.json` com as informações da atualização

### Passo 3: Atualizar package.json (Opcional)

Se a versão mudou, copie o novo `package.json` para a raiz do pendrive.

## 🚀 Como Usar a Atualização

### No Aplicativo:

1. Abra o aplicativo Smart Tech Rolândia 2.0
2. Vá para a página **"Atualização"** no menu lateral
3. O sistema detectará automaticamente o pendrive conectado
4. Selecione o pendrive na lista (se houver múltiplos)
5. Clique em **"Verificar Atualização"**
6. Se uma atualização estiver disponível:
   - O sistema mostrará a versão atual e a nova versão
   - Clique em **"Aplicar Atualização"**
   - Um backup será criado automaticamente
   - A atualização será aplicada
   - Reinicie o aplicativo para aplicar as mudanças

### Processo Automático:

1. **Detecção**: O sistema verifica pendrives a cada 5 segundos
2. **Verificação**: Compara a versão do pendrive com a versão instalada
3. **Backup**: Cria backup automático antes de atualizar
4. **Atualização**: Copia arquivos do pendrive para o sistema
5. **Validação**: Verifica se a atualização foi aplicada corretamente
6. **Log**: Registra todas as operações

## 🔄 Restauração de Backup

Se a atualização falhar:

1. O sistema oferecerá automaticamente a opção de restaurar o backup
2. Ou você pode restaurar manualmente:
   - Vá para a página de Atualização
   - Verifique os logs de atualização
   - Use a opção de restauração se disponível

## 📊 Logs de Atualização

Todos os logs são salvos em:
- **Windows**: `%APPDATA%\Smart Tech Rolândia 2.0\update-logs\`

Cada log contém:
- Tipo de operação (atualização ou restauração)
- Status (sucesso ou erro)
- Versões (anterior e nova)
- Arquivos afetados
- Data e hora
- Erros (se houver)

## ⚠️ Importante

1. **Sempre faça backup** antes de atualizar (o sistema faz isso automaticamente)
2. **Não remova o pendrive** durante a atualização
3. **Reinicie o aplicativo** após a atualização
4. **Verifique os logs** se algo der errado
5. **Mantenha backups antigos** por segurança

## 🐛 Solução de Problemas

### Pendrive não detectado
- Verifique se o pendrive está conectado
- Clique em "Detectar" para forçar nova verificação
- Verifique se o pendrive está acessível no Windows Explorer

### Atualização não encontrada
- Verifique se existe `update-info.json` na raiz do pendrive
- Verifique se existe a pasta `update/` com arquivos
- Verifique se a versão no `update-info.json` é maior que a versão atual

### Erro durante atualização
- Verifique os logs de atualização
- Tente restaurar o backup
- Verifique se há espaço suficiente no disco
- Verifique se o aplicativo não está em uso

### Arquivos não atualizados
- Verifique se os arquivos estão na pasta `update/` correta
- Verifique se a estrutura de pastas está correta
- Verifique os logs para ver quais arquivos foram atualizados

## 📝 Exemplo Completo

### Estrutura no Pendrive:

```
E:/
├── update-info.json
├── package.json
└── update/
    ├── index.html
    ├── favicon.ico
    └── assets/
        ├── index-ABC123.js
        ├── index-DEF456.css
        └── ...
```

### update-info.json:

```json
{
  "version": "2.1.0",
  "description": "Correção de bugs críticos e melhorias de interface",
  "date": "2025-01-15T14:30:00.000Z",
  "files": [
    "index.html",
    "assets/index-ABC123.js",
    "assets/index-DEF456.css"
  ]
}
```

## ✅ Checklist de Atualização

Antes de distribuir um pacote de atualização:

- [ ] Versão atualizada no `package.json`
- [ ] `update-info.json` criado com informações corretas
- [ ] Pasta `update/` contém todos os arquivos necessários
- [ ] Versão no `update-info.json` é maior que a versão atual
- [ ] Testado em ambiente de desenvolvimento
- [ ] Backup testado e funcional
- [ ] Documentação atualizada

## 📞 Suporte

Para problemas ou dúvidas sobre o sistema de atualização, consulte os logs ou entre em contato com o suporte técnico.

