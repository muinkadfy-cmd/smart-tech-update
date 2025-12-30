# Sistema de Atualização Automática - Smart Tech Rolândia 2.0

## 📋 Visão Geral

Este sistema permite gerar atualizações automaticamente e distribuí-las via GitHub. O sistema verifica atualizações online e permite que os usuários baixem e instalem atualizações automaticamente.

## 🚀 Como Usar

### 1. Gerar Build de Atualização

Após fazer alterações no código e atualizar a versão no `package.json`, execute:

```bash
npm run build:update
```

Este comando irá:
- Ler a versão atual do `package.json`
- Gerar `update-{versao}.zip` com todos os arquivos necessários
- Criar `version.json` e `update.json`
- Gerar `README.md` com instruções de upload

### 2. Estrutura de Arquivos Gerados

O script cria uma pasta `update-build/` com:

```
update-build/
├── update-2.0.3.zip      # Arquivo de atualização completo
├── version.json           # Informações da versão
├── update.json            # Informações da atualização
└── README.md              # Instruções de upload
```

### 3. Upload no GitHub

1. Acesse o repositório: https://github.com/muinkadfy-cmd/smart-tech-update

2. Navegue até a pasta `update/` (ou crie se não existir)

3. Faça upload dos arquivos gerados:
   - `update-{versao}.zip`
   - `version.json` (substitua o anterior)
   - `update.json` (substitua o anterior)

4. Certifique-se de que os arquivos estejam acessíveis via:
   - `https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update/update-{versao}.zip`
   - `https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update/version.json`
   - `https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update/update.json`

## 📦 Conteúdo do update.zip

O arquivo `update-{versao}.zip` contém:
- `dist/` - Todos os arquivos compilados do frontend (HTML, CSS, JS)
- `package.json` - Arquivo de configuração com a versão atualizada
- `electron/` - Arquivos do Electron (preload.js, etc.)

## 🔄 Fluxo de Atualização

1. **Verificação**: O sistema verifica automaticamente se há atualizações disponíveis
2. **Download**: Se houver atualização, o usuário pode baixá-la
3. **Backup**: Antes de aplicar, um backup automático é criado
4. **Aplicação**: Os arquivos são atualizados
5. **Reinício**: O sistema solicita reinício para aplicar as mudanças

## ⚙️ Configuração

### URL do Servidor de Atualizações

A URL base está configurada em `electron/updateManager.js`:

```javascript
const UPDATE_SERVER_URL = 'https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update';
```

Para usar um servidor diferente, defina a variável de ambiente:

```bash
UPDATE_SERVER_URL=https://seu-servidor.com/updates npm run electron:dev
```

### Estrutura dos Arquivos JSON

#### version.json
```json
{
  "version": "2.0.3",
  "releaseDate": "2025-01-28T10:00:00.000Z",
  "downloadUrl": "https://raw.githubusercontent.com/.../update-2.0.3.zip",
  "size": 15728640,
  "checksum": null
}
```

#### update.json
```json
{
  "available": true,
  "version": "2.0.3",
  "currentVersion": "2.0.3",
  "description": "Atualização 2.0.3 do Smart Tech Rolândia 2.0",
  "date": "2025-01-28T10:00:00.000Z",
  "downloadUrl": "https://raw.githubusercontent.com/.../update-2.0.3.zip",
  "size": 15728640,
  "changelog": [
    "Versão 2.0.3",
    "- Melhorias de performance",
    "- Correções de bugs"
  ],
  "minVersion": "2.0.0",
  "requiresRestart": true
}
```

## 🔍 Verificação de Versão

O sistema compara versões usando semver (Semantic Versioning):
- Formato: `MAJOR.MINOR.PATCH` (ex: 2.0.3)
- Comparação: `2.0.3` > `2.0.2` > `2.0.1`

## 🛠️ Troubleshooting

### Erro: "Diretório dist/ não encontrado"
**Solução**: Execute `npm run build` antes de `npm run build:update`

### Erro: "Erro ao verificar atualização online"
**Solução**: 
- Verifique sua conexão com a internet
- Confirme que os arquivos estão no GitHub e acessíveis
- Verifique a URL do servidor de atualizações

### Atualização não aparece
**Solução**:
- Verifique se a versão no `update.json` é maior que a versão atual
- Confirme que os arquivos estão no caminho correto no GitHub
- Verifique o console do Electron para erros

## 📝 Notas Importantes

1. **Sempre faça backup** antes de aplicar atualizações
2. **Teste localmente** antes de fazer upload no GitHub
3. **Mantenha versionamento** - não faça downgrade (versões menores)
4. **Documente mudanças** no changelog do `update.json`

## 🔐 Segurança

- O sistema verifica a versão antes de aplicar atualizações
- Backups automáticos são criados antes de cada atualização
- Logs de atualização são salvos para auditoria
- Não é possível fazer downgrade (apenas atualizações para versões maiores)

