# ⚡ RESUMO RÁPIDO - ATUALIZAÇÕES

## 🚀 FLUXO RÁPIDO

```
DESENVOLVIMENTO → BUILD → PENDRIVE → CLIENTE
```

---

## 📋 CHECKLIST RÁPIDO

### 1️⃣ Desenvolver/Corrigir
```bash
# Editar código
# Testar: npm run dev
# Build: npm run build
```

### 2️⃣ Preparar Pendrive
```
PENDRIVE/
├── update-info.json    ← Criar com nova versão
└── update/            ← Copiar TUDO de dist/
    ├── index.html
    └── assets/
```

### 3️⃣ Aplicar no Cliente
```
App → Atualização → Detectar → Verificar → Aplicar → Reiniciar
```

---

## 📝 update-info.json (Template)

```json
{
  "version": "2.1.0",
  "description": "Descrição das mudanças",
  "date": "2025-01-27T10:30:00.000Z"
}
```

**⚠️ IMPORTANTE:** Versão deve ser MAIOR que a atual!

---

## 🔧 COMANDOS ESSENCIAIS

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Executável (opcional)
npm run electron:build:win
```

---

## 📁 ESTRUTURA DO PENDRIVE

```
E:/
├── update-info.json          ← OBRIGATÓRIO
├── package.json              ← OPCIONAL
└── update/                   ← OBRIGATÓRIO
    ├── index.html
    ├── favicon.ico
    └── assets/
        └── ...
```

---

## ✅ VERIFICAÇÕES

- [ ] Versão atualizada no `package.json`
- [ ] `update-info.json` criado
- [ ] Versão no `update-info.json` > versão atual
- [ ] Arquivos copiados para `update/`
- [ ] Testado localmente
- [ ] Backup funciona

---

## 🆘 PROBLEMAS COMUNS

| Problema | Solução |
|----------|---------|
| Pendrive não detectado | Verificar conexão, tentar outra porta |
| Atualização não encontrada | Verificar `update-info.json` e pasta `update/` |
| Erro durante atualização | Verificar logs, espaço em disco |
| Versão não mudou | Reiniciar app completamente |

---

## 📖 DOCUMENTAÇÃO COMPLETA

Para guia detalhado, consulte: `GUIA_ATUALIZACOES_PASSO_A_PASSO.md`

