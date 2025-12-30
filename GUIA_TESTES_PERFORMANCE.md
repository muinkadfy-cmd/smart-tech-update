# 🧪 Guia de Testes de Performance

## 📋 Checklist de Testes

### 1. **Teste de Lazy Loading**
- [ ] Abrir o aplicativo e verificar que apenas o Dashboard carrega inicialmente
- [ ] Navegar para outras páginas (Relatórios, Vendas, etc.) e verificar carregamento sob demanda
- [ ] Verificar que o fallback de loading aparece durante o carregamento
- [ ] Confirmar que o bundle inicial é menor (verificar no DevTools > Network)

### 2. **Teste de Modo Desempenho**
- [ ] Ir em Configurações > LOJA > Modo Desempenho
- [ ] Ativar o Modo Desempenho
- [ ] Verificar que animações são desativadas
- [ ] Verificar que sombras pesadas são removidas
- [ ] Verificar que gráficos não têm animações
- [ ] Verificar que transições são instantâneas
- [ ] Medir uso de CPU antes e depois (Task Manager / Activity Monitor)
- [ ] Medir uso de memória antes e depois

### 3. **Teste de Visibilidade**
- [ ] Abrir Dashboard
- [ ] Rolar a página para que gráficos fiquem fora da tela
- [ ] Verificar no DevTools que não há atualizações desnecessárias
- [ ] Rolar de volta e verificar que gráficos atualizam

### 4. **Teste de Cache**
- [ ] Abrir Dashboard
- [ ] Fechar e reabrir o Dashboard rapidamente
- [ ] Verificar que dados são carregados do cache (mais rápido)
- [ ] Aguardar 5 minutos e verificar que cache expira

### 5. **Teste de Relógio Otimizado**
- [ ] Abrir Dashboard
- [ ] Mudar para outra aba do navegador (ou minimizar janela)
- [ ] Aguardar alguns segundos
- [ ] Voltar para a aba
- [ ] Verificar que relógio sincroniza automaticamente
- [ ] Verificar que não há atualizações enquanto aba está inativa

### 6. **Teste em PC Fraco**
- [ ] Testar em notebook antigo (se disponível)
- [ ] Verificar fluidez da interface
- [ ] Verificar uso de CPU (deve estar abaixo de 20% em idle)
- [ ] Verificar uso de memória (deve estar abaixo de 500MB)
- [ ] Navegar entre páginas e verificar que não há lag

### 7. **Teste de Gráficos Otimizados**
- [ ] Abrir Dashboard
- [ ] Verificar que gráficos carregam rapidamente
- [ ] Com Modo Desempenho ativado, verificar que não há animações
- [ ] Verificar que gráficos têm no máximo 30 pontos
- [ ] Verificar que dots são removidos em gráficos de linha

---

## 📊 Métricas Esperadas

### Performance Normal (Modo Desempenho Desativado)
- **CPU em idle:** 5-15%
- **Memória:** 300-500MB
- **Tempo de carregamento inicial:** 2-3 segundos
- **Tempo de navegação entre páginas:** < 500ms

### Performance Otimizada (Modo Desempenho Ativado)
- **CPU em idle:** 2-8%
- **Memória:** 200-350MB
- **Tempo de carregamento inicial:** 1-2 segundos
- **Tempo de navegação entre páginas:** < 300ms

---

## 🔧 Ferramentas de Monitoramento

### Chrome DevTools
1. Abrir DevTools (F12)
2. Aba "Performance" para gravar e analisar
3. Aba "Memory" para monitorar uso de memória
4. Aba "Network" para verificar lazy loading

### Task Manager (Windows)
1. Abrir Task Manager (Ctrl+Shift+Esc)
2. Aba "Processos"
3. Procurar por "Smart Tech Rolândia" ou processo Electron
4. Monitorar CPU e Memória

### Activity Monitor (Mac)
1. Abrir Activity Monitor
2. Procurar por processo Electron
3. Monitorar CPU e Memória

---

## ✅ Critérios de Sucesso

### Lazy Loading
- ✅ Bundle inicial reduzido em pelo menos 40%
- ✅ Páginas carregam sob demanda
- ✅ Fallback de loading funciona

### Modo Desempenho
- ✅ Redução de CPU de 40-60%
- ✅ Redução de memória de 20-30%
- ✅ Interface mais fluida
- ✅ Sem animações quando ativado

### Visibilidade
- ✅ Componentes não atualizam quando fora da tela
- ✅ Atualização automática quando visível novamente

### Cache
- ✅ Dados são cacheados corretamente
- ✅ Cache expira após TTL
- ✅ Performance melhorada em acessos subsequentes

### Relógio
- ✅ Timer suspenso quando aba inativa
- ✅ Sincronização automática ao voltar

---

## 🐛 Problemas Conhecidos e Soluções

### Problema: Modo Desempenho não ativa
**Solução:** Verificar se localStorage está funcionando. Limpar cache e tentar novamente.

### Problema: Gráficos não aparecem
**Solução:** Verificar se componente está visível na viewport. Rolar até a seção de gráficos.

### Problema: Cache não funciona
**Solução:** Verificar se TTL não expirou. Aguardar menos de 5 minutos entre acessos.

### Problema: Relógio não atualiza
**Solução:** Verificar se aba está ativa. Relógio só atualiza quando página está visível.

---

## 📝 Relatório de Testes

Após realizar os testes, preencher:

```
Data: ___________
Testador: ___________
Ambiente: ___________

### Resultados:

**Lazy Loading:**
- Bundle inicial: _____ KB
- Tempo de carregamento: _____ segundos
- Status: [ ] Passou [ ] Falhou

**Modo Desempenho:**
- CPU antes: _____%
- CPU depois: _____%
- Memória antes: _____ MB
- Memória depois: _____ MB
- Status: [ ] Passou [ ] Falhou

**Visibilidade:**
- Status: [ ] Passou [ ] Falhou

**Cache:**
- Status: [ ] Passou [ ] Falhou

**Relógio:**
- Status: [ ] Passou [ ] Falhou

**Gráficos:**
- Status: [ ] Passou [ ] Falhou

### Observações:
_______________________________________
_______________________________________
_______________________________________
```

---

## 🎯 Próximos Passos Após Testes

1. Documentar resultados
2. Corrigir problemas encontrados
3. Otimizar ainda mais se necessário
4. Validar em diferentes ambientes
5. Coletar feedback dos usuários

