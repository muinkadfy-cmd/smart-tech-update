# 🔐 Guia de Ofuscação - Sistema de Licença

## 📋 Visão Geral

Este guia explica como ofuscar o código do sistema de licença para aumentar a segurança em produção.

---

## 🎯 Objetivos da Ofuscação

1. **Proteger Algoritmos**: Dificultar engenharia reversa do sistema de validação
2. **Ocultar Chave Secreta**: Tornar difícil extrair a chave secreta do código
3. **Prevenir Bypass**: Tornar mais difícil contornar o sistema de licença
4. **Proteger Propriedade Intelectual**: Dificultar cópia não autorizada

---

## 🚀 Como Usar

### 1. Ofuscar Manualmente

```bash
npm run obfuscate:license
```

Este comando:
- Lê `electron/license-manager.js`
- Cria backup em `electron/license-manager.backup.js`
- Gera versão ofuscada em `electron/license-manager.obfuscated.js`

### 2. Build com Ofuscação Automática

```bash
npm run build:production
```

Este comando:
1. Ofusca o código automaticamente
2. Gera build do frontend
3. Empacota com electron-builder
4. Cria arquivos de atualização

---

## 📁 Arquivos Gerados

### `license-manager.obfuscated.js`
- Versão ofuscada do código
- Usado automaticamente em produção
- **NÃO** commitar no repositório (já está no `.gitignore`)

### `license-manager.backup.js`
- Backup do código original
- Mantido para referência
- **NÃO** commitar no repositório

---

## ⚙️ Configuração de Ofuscação

O script `scripts/obfuscate-license.js` usa as seguintes configurações:

```javascript
{
  compact: true,                          // Código compacto
  controlFlowFlattening: true,            // Achatamento de fluxo de controle
  controlFlowFlatteningThreshold: 0.75,  // 75% de achatamento
  deadCodeInjection: true,                // Injeção de código morto
  deadCodeInjectionThreshold: 0.4,       // 40% de código morto
  stringArray: true,                      // Array de strings
  stringArrayEncoding: ['base64'],        // Codificação base64
  stringArrayRotate: true,                // Rotação de array
  stringArrayShuffle: true,               // Embaralhamento
  transformObjectKeys: true,              // Transformação de chaves
  selfDefending: true                     // Auto-proteção
}
```

---

## 🔑 Ofuscação da Chave Secreta

A chave secreta é ofuscada em múltiplas camadas:

```javascript
// 1. Codificação Base64
const obfuscated = 'W1RZQ0hfU01BUlRfVEVDSCBST0xBTkRJQV8yMDI1X0VOQ1JZUFRFRF9QUk9EX1NFQ1JFVF9LRVk=';

// 2. Decodificação
const decoded = Buffer.from(obfuscated, 'base64').toString('utf8');

// 3. Reversão
const reversed = decoded.split('').reverse().join('');

// 4. Reorganização
const parts = reversed.split('_').reverse();
return parts.join('_');
```

**Resultado**: `PROD_SECRET_KEY_SMART_TECH_ROLANDIA_2025_ENCRYPTED`

---

## 🔄 Fluxo de Build

### Desenvolvimento
```
license-manager.js (original) → Usado diretamente
```

### Produção
```
license-manager.js (original)
    ↓
[Ofuscação]
    ↓
license-manager.obfuscated.js → Usado no build
```

O `main.js` detecta automaticamente qual versão usar:

```javascript
// Tentar carregar versão ofuscada primeiro (produção)
if (!isDev && fs.existsSync('license-manager.obfuscated.js')) {
  licenseManager = await import('./license-manager.obfuscated.js');
} else {
  licenseManager = await import('./license-manager.js');
}
```

---

## ⚠️ Importante

### ✅ Fazer
- Ofuscar antes de cada build de produção
- Manter backup do código original
- Testar o build após ofuscar
- Atualizar chave secreta periodicamente

### ❌ Não Fazer
- Commitar arquivos ofuscados no repositório
- Usar mesma chave secreta em dev e produção
- Ofuscar código de desenvolvimento (desnecessário)
- Compartilhar chave secreta

---

## 🧪 Testes

Após ofuscar, testar:

1. **Build de Produção**
   ```bash
   npm run build:production
   ```

2. **Instalar e Testar**
   - Instalar o executável gerado
   - Verificar se licença funciona
   - Testar ativação de nova licença
   - Verificar bloqueio sem licença

3. **Verificar Tamanho**
   - Arquivo ofuscado deve ser maior que original
   - Aumento de ~30-50% é normal

---

## 📊 Estatísticas Típicas

```
Tamanho original: ~15-20 KB
Tamanho ofuscado: ~25-35 KB
Aumento: ~50-75%
```

---

## 🔧 Troubleshooting

### Erro: "Cannot find module"
- Verificar se arquivo ofuscado existe
- Verificar caminho no `main.js`
- Tentar rebuild

### Erro: "License validation failed"
- Verificar se chave secreta está correta
- Verificar se ofuscação não quebrou lógica
- Usar versão não ofuscada para debug

### Build muito lento
- Normal com ofuscação ativada
- Pode levar 2-3x mais tempo
- Considerar ofuscar apenas em release final

---

## 📚 Referências

- [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator)
- [Obfuscation Best Practices](https://obfuscator.io/)

---

**Versão**: 1.0.0  
**Data**: 30/12/2025  
**Autor**: Smart Tech Rolândia

