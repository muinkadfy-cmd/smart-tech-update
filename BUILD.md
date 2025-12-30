# 🏗️ Guia de Build - Smart Tech Rolândia 2.0

## Gerar Executável Windows (.exe)

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Gerar Build Web
```bash
npm run build
```

### Passo 3: Gerar Executável Windows
```bash
npm run electron:build:win
```

O executável será gerado em: `dist-electron/`

## 📦 Estrutura do Executável

Após o build, você terá:
- `Smart Tech Rolândia 2.0 Setup X.X.X.exe` - Instalador
- Arquivos necessários para distribuição

## 🔧 Configurações do Build

As configurações estão em `package.json` na seção `build`:
- **App ID**: `com.smarttech.rolandia`
- **Nome do Produto**: `Smart Tech Rolândia 2.0`
- **Plataforma**: Windows (NSIS)
- **Instalador**: Permite escolher diretório de instalação

## 📝 Notas Importantes

1. **Sistema 100% Offline**: Todos os dados são salvos localmente
2. **Persistência**: Dados salvos no localStorage do navegador/Electron
3. **Sem Dependências Online**: Removidas dependências de Supabase e Stripe
4. **Executável Standalone**: Não precisa de Node.js instalado

## 🚀 Distribuição

O executável gerado pode ser distribuído e instalado em qualquer Windows sem necessidade de:
- Node.js
- NPM
- Conexão com internet
- Dependências externas

## ⚠️ Requisitos do Sistema

- Windows 7 ou superior
- 100MB de espaço em disco
- 2GB RAM recomendado

