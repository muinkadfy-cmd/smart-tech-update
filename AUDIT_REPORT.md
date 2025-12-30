# Relatório de Auditoria do Codebase

**Data:** 2025-01-27  
**Escopo:** Análise completa de estado não utilizado, lógica duplicada e efeitos arriscados

---

## 1. ESTADO NÃO UTILIZADO

### 1.1. Estados Duplicados com DataTable

**Arquivo:** `src/pages/Clientes.tsx`
- **Problema:** `filteredClientes` (linha 58) é calculado mas o componente usa `DataTable` que já faz a filtragem
- **Estado:** `const [searchTerm, setSearchTerm] = useState('')` 
- **Uso:** Passado para `DataTable`, mas `filteredClientes` também é mantido
- **Impacto:** BAIXO - Lógica redundante, mas não quebra funcionalidade
- **Recomendação:** Remover `filteredClientes` e usar apenas `DataTable` para filtrar

**Arquivo:** `src/pages/Produtos.tsx`
- **Problema:** `filteredProdutos` (linha 58) similar ao caso acima
- **Estado:** `const [searchTerm, setSearchTerm] = useState('')`
- **Impacto:** BAIXO
- **Recomendação:** Remover `filteredProdutos`

**Arquivo:** `src/pages/Aparelhos.tsx`
- **Problema:** `filteredAparelhos` (linha 63) similar
- **Estado:** `const [searchTerm, setSearchTerm] = useState('')`
- **Impacto:** BAIXO
- **Recomendação:** Remover `filteredAparelhos`

**Arquivo:** `src/pages/Vendas.tsx`
- **Problema:** `filteredVendas` (linha 56) mantido mas página usa busca própria
- **Estado:** `const [searchTerm, setSearchTerm] = useState('')`
- **Impacto:** BAIXO - Parece estar sendo usado
- **Recomendação:** Verificar se realmente é necessário ou pode usar DataTable

### 1.2. Estados de Referência Não Utilizados Completamente

**Arquivo:** `src/pages/Clientes.tsx`, `src/pages/Produtos.tsx`, `src/pages/Vendas.tsx`
- **Problema:** `isMountedRef` (useRef) declarado mas usado apenas no cleanup do useEffect
- **Impacto:** BAIXO - É uma prática defensiva válida, mas poderia ser otimizada
- **Recomendação:** Manter se usado para prevenir memory leaks, mas revisar se realmente necessário em todos os casos

**Arquivo:** `src/pages/Vendas.tsx`
- **Problema:** `isMountedRef` declarado mas falta `useRef` no import (linha 29)
- **Impacto:** CRÍTICO - Código não compila
- **Recomendação:** Adicionar `useRef` ao import ou remover se não usado

### 1.3. Estados Não Utilizados em QuickAccess

**Arquivo:** `src/components/QuickAccess.tsx`
- **Problema:** `metodoSelecionado` (linha 146) declarado mas apenas usado para highlight visual
- **Impacto:** BAIXO - Funcional, mas poderia ser simplificado
- **Recomendação:** Avaliar se necessário ou pode ser substituído por CSS state

---

## 2. LÓGICA DUPLICADA

### 2.1. Funções de Busca de Nomes (get*Nome)

**Problema:** Funções idênticas duplicadas em múltiplos arquivos

**Arquivo:** `src/pages/Vendas.tsx` (linhas 227-234)
```typescript
const getClienteNome = useCallback((id?: string) => {...});
const getProdutoNome = useCallback((id: string) => {...});
```

**Arquivo:** `src/pages/OrdensServico.tsx` (linhas 41, 58)
```typescript
const getClienteNome = (id: string) => {...};
const getTecnicoNome = (id: string) => {...};
const getAparelhoInfo = (os: OrdemServico) => {...};
```

**Arquivo:** `src/pages/Aparelhos.tsx` (linha 42)
```typescript
const getClienteNome = useCallback((aparelho: Aparelho) => {...});
```

**Impacto:** MÉDIO - Violação DRY, dificulta manutenção
**Recomendação:** Criar hook `useEntityNames` ou utilitário em `src/utils/entities.ts`

### 2.2. Lógica de Filtro Duplicada

**Problema:** Lógica de filtro similar em várias páginas

**Arquivos:**
- `src/pages/Encomendas.tsx` (linha 39) - filtro inline
- `src/pages/Cobranca.tsx` - filtro inline
- `src/pages/Devolucao.tsx` - filtro inline
- `src/pages/Fornecedores.tsx` (linha 33) - filtro inline

**Impacto:** MÉDIO - Cada página implementa sua própria lógica
**Recomendação:** Criar hook `useFilter` reutilizável ou usar `DataTable` consistentemente

### 2.3. Cálculo de Margem Duplicado

**Arquivo:** `src/pages/Produtos.tsx` (linhas 67-70)
```typescript
const calculateMargem = (compra: number, venda: number) => {
  if (compra === 0) return 0;
  return ((venda - compra) / compra) * 100;
};
```

**Arquivo:** `src/utils/math.ts` 
- Já existe `calculateMargem` com mesma lógica

**Impacto:** MÉDIO - Duplicação desnecessária
**Recomendação:** Remover função local e usar `calculateMargem` de `src/utils/math.ts`

### 2.4. Reset de Formulário Duplicado

**Problema:** Funções `resetForm` duplicadas em várias páginas que não usam `useFormDialog`

**Arquivos:**
- `src/pages/Tecnicos.tsx` (linha 76)
- `src/pages/Fornecedores.tsx` (linha 63)
- `src/pages/Financeiro.tsx` - lógica inline
- `src/pages/Estoque.tsx` - lógica inline

**Impacto:** BAIXO - Funcional, mas viola DRY
**Recomendação:** Migrar para usar `useFormDialog` hook ou criar utilitário comum

### 2.5. Validação de Formulário Duplicada

**Problema:** Mensagens de validação similares em várias páginas

**Padrão duplicado:**
```typescript
if (!formData.campo || !formData.outro || formData.valor <= 0) {
  toast.error('Preencha todos os campos obrigatórios');
  return;
}
```

**Arquivos:** Praticamente todas as páginas de formulário
**Impacto:** BAIXO - Funcional mas verboso
**Recomendação:** Criar hook `useFormValidation` ou utilitário de validação centralizado

---

## 3. EFEITOS ARRISCADOS

### 3.1. setInterval Muito Frequente

**Arquivo:** `src/pages/Devolucao.tsx` (linha 74)
```typescript
const interval = setInterval(loadFornecedores, 1000);
return () => clearInterval(interval);
```

**Problema:** Atualiza fornecedores a cada 1 segundo (1000ms)
**Risco:** ALTO - Performance, uso excessivo de CPU/memória, polling desnecessário
**Recomendação:** 
- Usar evento personalizado quando fornecedores forem atualizados
- Ou aumentar intervalo para 5-10 segundos se polling for necessário
- Ou usar `useAppStore` diretamente em vez de localStorage

### 3.2. localStorage sem Debounce

**Arquivo:** `src/components/Header.tsx` (linhas 174-176, 190-193)
```typescript
useEffect(() => {
  localStorage.setItem('notificacoesVisualizadas', JSON.stringify(Array.from(notificacoesVisualizadas)));
}, [notificacoesVisualizadas]);

useEffect(() => {
  localStorage.setItem('userNotificationSettings', JSON.stringify(userSettings));
}, [userSettings]);
```

**Problema:** Salva imediatamente a cada mudança sem debounce
**Risco:** MÉDIO - Muitas escritas no localStorage se estado mudar rapidamente
**Recomendação:** Adicionar debounce de 500-1000ms ou usar `saveToStorageDebounced` de `src/utils/storage.ts`

### 3.3. setInterval no Main sem Cleanup Adequado

**Arquivo:** `src/main.tsx` (linha 52)
```typescript
saveInterval = setInterval(() => {
  // ... lógica de salvamento
}, 60000);
```

**Problema:** Cleanup apenas no `beforeunload`, mas não em caso de hot-reload durante desenvolvimento
**Risco:** BAIXO - Funciona em produção, mas pode causar múltiplos intervalos em dev
**Recomendação:** Melhorar cleanup para garantir que interval seja limpo corretamente

### 3.4. useEffect sem Dependências Corretas

**Arquivo:** `src/pages/Tecnicos.tsx` (linha 67)
```typescript
setIsDialogOpen(false);
resetForm();
```
**Problema:** `resetForm()` chamada dentro do bloco try, mas função está definida após (linha 76)
**Risco:** BAIXO - Funcional, mas pode ser melhorada
**Recomendação:** Verificar ordem de definição ou considerar usar `useFormDialog` hook

### 3.5. useEffect com Dependências Potencialmente Instáveis

**Arquivo:** `src/components/DataTable.tsx` (linha 72)
```typescript
const filteredData = useMemo(() => {
  // ...
}, [data, debouncedSearchTerm, searchFields]);
```

**Problema:** `searchFields` pode ser uma função nova a cada render se não memoizada
**Risco:** BAIXO - Pode causar recálculos desnecessários
**Recomendação:** Garantir que `searchFields` seja memoizado no componente pai

### 3.6. Dependências Ausentes em useMemo

**Arquivo:** `src/pages/Dashboard.tsx` (linha 73)
```typescript
const totalVendasMensais = vendasMensaisData.reduce((sum, d) => sum + (d.valor || 0), 0);
const mediaMensal = vendasMensaisData.length > 0 ? totalVendasMensais / vendasMensaisData.length : 0;
```

**Problema:** Não estão em `useMemo`, recalculam a cada render
**Risco:** BAIXO - Performance desnecessária
**Recomendação:** Mover para `useMemo` com dependência em `vendasMensaisData`

### 3.7. setInterval em QuickAccess

**Arquivo:** `src/components/QuickAccess.tsx` (linha 27-67)
**Problema:** `useEffect` com event listeners mas sem dependências claras
**Risco:** BAIXO - Funcional mas poderia ser otimizado
**Recomendação:** Revisar dependências do useEffect

---

## 4. PROBLEMAS ADICIONAIS IDENTIFICADOS

### 4.1. Import Faltando

**Arquivo:** `src/pages/Vendas.tsx`
- **Problema:** `isMountedRef` usa `useRef` mas `useRef` não está no import (linha 1)
- **Risco:** CRÍTICO - Erro de compilação
- **Recomendação:** Adicionar `useRef` ao import ou remover se não usado

### 4.2. Função resetForm com Definição Tardia

**Arquivo:** `src/pages/Tecnicos.tsx`
- **Problema:** `resetForm()` chamada (linha 67) mas definida após (linha 76) - funciona por hoisting, mas não é ideal
- **Risco:** BAIXO - Funcional, mas pode ser melhorada
- **Recomendação:** Mover definição antes do uso ou migrar para `useFormDialog` hook

### 4.3. getStateHash Incompleto

**Arquivo:** `src/main.tsx` (linhas 38-46)
```typescript
const getStateHash = (state: any): string => {
  return JSON.stringify({
    clientes: state.clientes.length,
    produtos: state.produtos.length,
    vendas: state.vendas.length,
    ordensServico: state.ordensServico.length,
  });
};
```

**Problema:** Não considera outras entidades (transacoes, tecnicos, etc)
- **Risco:** BAIXO - Pode não detectar mudanças em outras entidades
- **Recomendação:** Incluir todas as entidades importantes ou usar hash mais robusto

---

## 5. RESUMO DE PRIORIDADES

### CRÍTICO (Corrigir Imediatamente)
1. ❌ `src/pages/Vendas.tsx` - `useRef` faltando no import (linha 29 usa `useRef` mas linha 1 não importa)

### ALTO (Corrigir em Breve)
3. ⚠️ `src/pages/Devolucao.tsx` - `setInterval` de 1 segundo muito frequente
4. ⚠️ `src/components/Header.tsx` - localStorage sem debounce

### MÉDIO (Melhorar quando possível)
5. 📋 Funções `get*Nome` duplicadas - Criar utilitário centralizado
6. 📋 `calculateMargem` duplicado - Usar versão de `utils/math.ts`
7. 📋 Lógica de filtro duplicada - Padronizar uso de DataTable

### BAIXO (Otimizações Futuras)
8. 💡 Estados `filtered*` duplicados com DataTable
9. 💡 `useMemo` ausente em cálculos do Dashboard
10. 💡 Funções `resetForm` duplicadas

---

## 6. RECOMENDAÇÕES GERAIS

1. **Padronização:** Usar `DataTable` consistentemente em todas as páginas que precisam de busca/filtro
2. **Hooks Customizados:** Criar hooks reutilizáveis para lógica comum (`useEntityNames`, `useFilter`)
3. **Debounce:** Aplicar debounce em todas as escritas no localStorage
4. **Memoização:** Revisar todos os cálculos pesados e garantir uso de `useMemo`/`useCallback`
5. **Cleanup:** Garantir que todos os `setInterval`/`setTimeout` tenham cleanup adequado
6. **Validação:** Centralizar lógica de validação de formulários

---

**Fim do Relatório**

