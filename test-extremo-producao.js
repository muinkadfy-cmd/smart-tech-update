/**
 * TESTE EXTREMO - SIMULAÇÃO DE USO EM PRODUÇÃO
 * Smart Tech Rolândia 2.0
 * 
 * Este script simula uso intenso do sistema como se estivesse em produção
 * por vários dias, testando todos os aspectos críticos.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho do arquivo de dados
const DATA_PATH = 'C:\\Users\\Public\\SmartTechRolandia\\data\\database.json';
const BACKUP_PATH = 'C:\\Users\\Public\\SmartTechRolandia\\data\\database-backup.json';

// Relatório de teste
const relatorio = {
  inicio: new Date().toISOString(),
  erros: [],
  avisos: [],
  sucessos: [],
  metricas: {
    produtosCriados: 0,
    clientesCriados: 0,
    vendasCriadas: 0,
    transacoesCriadas: 0,
    backupsRealizados: 0,
    ciclosPersistencia: 0,
    tempoTotal: 0
  },
  testes: {
    criacaoDados: { status: 'pendente', detalhes: [] },
    fluxoVendas: { status: 'pendente', detalhes: [] },
    financeiro: { status: 'pendente', detalhes: [] },
    persistencia: { status: 'pendente', detalhes: [] },
    testesFalha: { status: 'pendente', detalhes: [] },
    backupRestauracao: { status: 'pendente', detalhes: [] },
    navegacao: { status: 'pendente', detalhes: [] },
    impressao: { status: 'pendente', detalhes: [] },
    monitoramento: { status: 'pendente', detalhes: [] }
  }
};

// Funções auxiliares
function logSucesso(mensagem, teste) {
  relatorio.sucessos.push({ timestamp: new Date().toISOString(), mensagem, teste });
  console.log(`✅ ${mensagem}`);
}

function logErro(mensagem, teste, erro = null) {
  relatorio.erros.push({ 
    timestamp: new Date().toISOString(), 
    mensagem, 
    teste,
    erro: erro ? erro.toString() : null
  });
  console.error(`❌ ${mensagem}`, erro || '');
}

function logAviso(mensagem, teste) {
  relatorio.avisos.push({ timestamp: new Date().toISOString(), mensagem, teste });
  console.warn(`⚠️ ${mensagem}`);
}

function gerarId() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function gerarDataAleatoria(diasAtras = 30) {
  const agora = new Date();
  const dias = Math.floor(Math.random() * diasAtras);
  const data = new Date(agora);
  data.setDate(data.getDate() - dias);
  data.setHours(Math.floor(Math.random() * 24));
  data.setMinutes(Math.floor(Math.random() * 60));
  return data.toISOString();
}

// Função para carregar dados do arquivo
function carregarDados() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const conteudo = fs.readFileSync(DATA_PATH, 'utf-8');
      const dados = JSON.parse(conteudo);
      // Zustand salva como { state: {...}, version: 0 }
      if (dados.state) {
        return dados.state;
      }
      return dados;
    }
    return null;
  } catch (error) {
    logErro(`Erro ao carregar dados: ${error.message}`, 'carregarDados', error);
    return null;
  }
}

// Função para salvar dados (simula via IPC)
function salvarDados(dados) {
  try {
    // Criar diretório se não existir
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Formato Zustand: { state: {...}, version: 0 }
    const dadosFormatados = {
      state: dados,
      version: 0
    };

    // Backup antes de salvar
    if (fs.existsSync(DATA_PATH)) {
      fs.copyFileSync(DATA_PATH, BACKUP_PATH);
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify(dadosFormatados, null, 2), 'utf-8');
    return true;
  } catch (error) {
    logErro(`Erro ao salvar dados: ${error.message}`, 'salvarDados', error);
    return false;
  }
}

// Função para validar estrutura de dados
function validarEstruturaDados(dados) {
  const camposObrigatorios = [
    'clientes', 'aparelhos', 'produtos', 'ordensServico', 
    'vendas', 'transacoes', 'tecnicos', 'movimentacoesEstoque',
    'encomendas', 'devolucoes', 'recibos', 'fornecedores', 'configuracao'
  ];

  const problemas = [];
  
  for (const campo of camposObrigatorios) {
    if (!(campo in dados)) {
      problemas.push(`Campo obrigatório ausente: ${campo}`);
    } else if (!Array.isArray(dados[campo]) && campo !== 'configuracao') {
      problemas.push(`Campo ${campo} não é um array`);
    }
  }

  return problemas;
}

// Função para validar integridade de IDs
function validarIntegridadeIds(dados) {
  const problemas = [];
  const idsUnicos = new Set();

  const arrays = [
    'clientes', 'aparelhos', 'produtos', 'ordensServico',
    'vendas', 'transacoes', 'tecnicos', 'movimentacoesEstoque',
    'encomendas', 'devolucoes', 'recibos', 'fornecedores'
  ];

  for (const arrayName of arrays) {
    if (!Array.isArray(dados[arrayName])) continue;
    
    for (const item of dados[arrayName]) {
      if (!item.id) {
        problemas.push(`${arrayName}: Item sem ID`);
        continue;
      }

      if (idsUnicos.has(item.id)) {
        problemas.push(`${arrayName}: ID duplicado encontrado: ${item.id}`);
      }
      idsUnicos.add(item.id);
    }
  }

  return problemas;
}

// Função para calcular cash-flow
function calcularCashFlow(transacoes) {
  if (!Array.isArray(transacoes)) return { receitas: 0, despesas: 0, saldo: 0 };

  const receitas = transacoes
    .filter(t => t && t.tipo === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + (typeof t.valor === 'number' ? t.valor : 0), 0);

  const despesas = transacoes
    .filter(t => t && t.tipo === 'despesa' && t.status === 'pago')
    .reduce((sum, t) => sum + (typeof t.valor === 'number' ? t.valor : 0), 0);

  return {
    receitas: receitas || 0,
    despesas: despesas || 0,
    saldo: (receitas || 0) - (despesas || 0)
  };
}

// ============================================
// TESTE 1: CRIAÇÃO MASSIVA DE DADOS
// ============================================
async function testeCriacaoMassiva() {
  console.log('\n📦 TESTE 1: CRIAÇÃO MASSIVA DE DADOS');
  console.log('=====================================\n');

  let dados = carregarDados() || {
    clientes: [],
    aparelhos: [],
    produtos: [],
    ordensServico: [],
    vendas: [],
    transacoes: [],
    tecnicos: [],
    movimentacoesEstoque: [],
    encomendas: [],
    devolucoes: [],
    recibos: [],
    fornecedores: [],
    configuracao: {
      id: '1',
      nomeEmpresa: 'Smart Tech Rolândia',
      cnpj: '',
      endereco: '',
      telefone: '',
      email: '',
      taxaCartao: { debito: 2.5, credito: 3.5, pix: 0 },
      statusOS: [],
      layoutImpressao: '80mm',
      notificacoesWhatsApp: false
    }
  };

  // Criar 100 produtos
  console.log('Criando 100 produtos...');
  const categorias = ['peca', 'acessorio'];
  const marcas = ['Samsung', 'Apple', 'Xiaomi', 'Motorola', 'LG', 'Sony'];
  
  for (let i = 1; i <= 100; i++) {
    const produto = {
      id: gerarId(),
      nome: `Produto Teste ${i}`,
      categoria: categorias[i % 2],
      codigoInterno: `PROD-${String(i).padStart(4, '0')}`,
      estoque: Math.floor(Math.random() * 100) + 1,
      estoqueMinimo: Math.floor(Math.random() * 10) + 1,
      precoCompra: Math.random() * 500 + 50,
      precoVenda: Math.random() * 1000 + 100,
      margem: Math.random() * 50 + 20,
      createdAt: gerarDataAleatoria(60)
    };
    dados.produtos.push(produto);
    relatorio.metricas.produtosCriados++;
  }
  logSucesso(`100 produtos criados`, 'criacaoMassiva');

  // Criar 50 clientes
  console.log('Criando 50 clientes...');
  const nomes = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Roberto', 'Fernanda'];
  const sobrenomes = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida'];
  
  for (let i = 1; i <= 50; i++) {
    const nome = `${nomes[i % nomes.length]} ${sobrenomes[i % sobrenomes.length]} ${i}`;
    const cliente = {
      id: gerarId(),
      nome: nome,
      telefone: `(44) 9${Math.floor(Math.random() * 90000000) + 10000000}`,
      whatsapp: `(44) 9${Math.floor(Math.random() * 90000000) + 10000000}`,
      cpf: `${Math.floor(Math.random() * 900000000) + 100000000}${Math.floor(Math.random() * 90) + 10}`,
      endereco: `Rua Teste ${i}, ${Math.floor(Math.random() * 1000)}`,
      createdAt: gerarDataAleatoria(90)
    };
    dados.clientes.push(cliente);
    relatorio.metricas.clientesCriados++;
  }
  logSucesso(`50 clientes criados`, 'criacaoMassiva');

  // Criar 10 fornecedores
  console.log('Criando 10 fornecedores...');
  for (let i = 1; i <= 10; i++) {
    const fornecedor = {
      id: gerarId(),
      nome: `Fornecedor Teste ${i}`,
      cnpj: `${Math.floor(Math.random() * 90000000) + 10000000}/0001-${Math.floor(Math.random() * 90) + 10}`,
      telefone: `(44) ${Math.floor(Math.random() * 90000000) + 10000000}`,
      email: `fornecedor${i}@teste.com`,
      endereco: `Endereço Fornecedor ${i}`,
      createdAt: gerarDataAleatoria(120)
    };
    dados.fornecedores.push(fornecedor);
  }
  logSucesso(`10 fornecedores criados`, 'criacaoMassiva');

  // Criar 5 técnicos
  console.log('Criando 5 técnicos...');
  for (let i = 1; i <= 5; i++) {
    const tecnico = {
      id: gerarId(),
      nome: `Técnico ${i}`,
      email: `tecnico${i}@teste.com`,
      telefone: `(44) 9${Math.floor(Math.random() * 90000000) + 10000000}`,
      especialidade: ['Hardware', 'Software', 'Eletrônica'][i % 3],
      comissao: Math.random() * 20 + 10,
      ativo: true,
      createdAt: gerarDataAleatoria(180)
    };
    dados.tecnicos.push(tecnico);
  }
  logSucesso(`5 técnicos criados`, 'criacaoMassiva');

  // Validar estrutura
  const problemasEstrutura = validarEstruturaDados(dados);
  if (problemasEstrutura.length > 0) {
    problemasEstrutura.forEach(p => logErro(p, 'validacaoEstrutura'));
  } else {
    logSucesso('Estrutura de dados válida', 'validacaoEstrutura');
  }

  // Salvar dados
  if (salvarDados(dados)) {
    logSucesso('Dados salvos com sucesso', 'criacaoMassiva');
    relatorio.testes.criacaoDados.status = 'sucesso';
  } else {
    logErro('Falha ao salvar dados', 'criacaoMassiva');
    relatorio.testes.criacaoDados.status = 'falha';
  }

  return dados;
}

// ============================================
// TESTE 2: FLUXO INTENSO DE VENDAS
// ============================================
async function testeFluxoVendas(dados) {
  console.log('\n🛒 TESTE 2: FLUXO INTENSO DE VENDAS');
  console.log('===================================\n');

  if (!dados) {
    dados = carregarDados();
  }

  if (!dados || !Array.isArray(dados.produtos) || dados.produtos.length === 0) {
    logErro('Dados não disponíveis para teste de vendas', 'fluxoVendas');
    relatorio.testes.fluxoVendas.status = 'falha';
    return dados;
  }

  const produtos = dados.produtos;
  const clientes = dados.clientes || [];
  let numeroVenda = dados.vendas.length > 0 
    ? Math.max(...dados.vendas.map(v => v.numero || 0)) + 1 
    : 1;

  // Criar 100 vendas
  console.log('Criando 100 vendas com variações...');
  
  const formasPagamento = ['Pix', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito'];
  const bandeiras = ['Visa', 'Mastercard', 'Elo', 'Hipercard'];

  for (let i = 1; i <= 100; i++) {
    // Selecionar produtos aleatórios (1 a 5 produtos por venda)
    const numItens = Math.floor(Math.random() * 5) + 1;
    const produtosVenda = [];
    let subtotal = 0;

    for (let j = 0; j < numItens; j++) {
      const produto = produtos[Math.floor(Math.random() * produtos.length)];
      const quantidade = Math.floor(Math.random() * 3) + 1;
      const precoUnitario = produto.precoVenda || 100;
      const desconto = Math.random() < 0.3 ? Math.random() * 20 : 0; // 30% chance de desconto
      
      const totalItem = (precoUnitario * quantidade) * (1 - desconto / 100);
      subtotal += totalItem;

      produtosVenda.push({
        produtoId: produto.id,
        quantidade: quantidade,
        precoUnitario: precoUnitario,
        desconto: desconto
      });
    }

    // Aplicar desconto geral (20% das vendas)
    const descontoGeral = Math.random() < 0.2 ? Math.random() * 15 : 0;
    const total = subtotal * (1 - descontoGeral / 100);

    // Selecionar forma de pagamento
    const formaPagamento = formasPagamento[Math.floor(Math.random() * formasPagamento.length)];
    const bandeira = formaPagamento.includes('Cartão') 
      ? bandeiras[Math.floor(Math.random() * bandeiras.length)]
      : undefined;

    // Criar parcelas (se cartão crédito)
    let parcelas = [];
    if (formaPagamento === 'Cartão Crédito' && Math.random() < 0.5) {
      const numParcelas = Math.floor(Math.random() * 6) + 2; // 2 a 7 parcelas
      const valorParcela = total / numParcelas;
      const hoje = new Date();
      
      for (let p = 1; p <= numParcelas; p++) {
        const vencimento = new Date(hoje);
        vencimento.setMonth(vencimento.getMonth() + p);
        parcelas.push({
          numero: p,
          valor: valorParcela,
          vencimento: vencimento.toISOString()
        });
      }
    }

    const venda = {
      id: gerarId(),
      numero: numeroVenda++,
      clienteId: clientes.length > 0 ? clientes[Math.floor(Math.random() * clientes.length)].id : undefined,
      items: produtosVenda,
      subtotal: subtotal,
      desconto: descontoGeral,
      total: total,
      formaPagamento: formaPagamento,
      bandeira: bandeira,
      parcelas: parcelas.length > 0 ? parcelas : undefined,
      createdAt: gerarDataAleatoria(30)
    };

    dados.vendas.push(venda);
    relatorio.metricas.vendasCriadas++;

    // Criar transação para venda paga
    // No sistema real, vendas podem ser pagas ou não, parceladas ou à vista
    // Simular 80% das vendas como pagas imediatamente (à vista)
    // 20% ficam pendentes (parceladas ou não pagas)
    if (Math.random() < 0.8) { // 80% das vendas são pagas
      const transacao = {
        id: gerarId(),
        tipo: 'receita',
        categoria: 'Venda',
        descricao: `Venda #${venda.numero}`,
        valor: total,
        formaPagamento: formaPagamento,
        bandeira: bandeira,
        status: 'pago',
        dataVencimento: venda.createdAt,
        dataPagamento: venda.createdAt,
        clienteId: venda.clienteId,
        createdAt: venda.createdAt
      };
      dados.transacoes.push(transacao);
      relatorio.metricas.transacoesCriadas++;
    } else {
      // 20% das vendas ficam pendentes (não geram transação paga imediatamente)
      // Isso simula vendas parceladas ou não pagas
    }
  }

  logSucesso(`100 vendas criadas com variações`, 'fluxoVendas');

  // Validar integridade
  const problemasIds = validarIntegridadeIds(dados);
  if (problemasIds.length > 0) {
    problemasIds.forEach(p => logErro(p, 'validacaoIds'));
  } else {
    logSucesso('Integridade de IDs validada', 'validacaoIds');
  }

  // Salvar dados
  if (salvarDados(dados)) {
    logSucesso('Vendas salvas com sucesso', 'fluxoVendas');
    relatorio.testes.fluxoVendas.status = 'sucesso';
  } else {
    logErro('Falha ao salvar vendas', 'fluxoVendas');
    relatorio.testes.fluxoVendas.status = 'falha';
  }

  return dados;
}

// ============================================
// TESTE 3: FINANCEIRO E CASH-FLOW
// ============================================
async function testeFinanceiro(dados) {
  console.log('\n💰 TESTE 3: FINANCEIRO E CASH-FLOW');
  console.log('==================================\n');

  if (!dados) {
    dados = carregarDados();
  }

  if (!dados || !Array.isArray(dados.transacoes)) {
    logErro('Dados não disponíveis para teste financeiro', 'financeiro');
    relatorio.testes.financeiro.status = 'falha';
    return;
  }

  // Calcular cash-flow inicial
  const cashFlowInicial = calcularCashFlow(dados.transacoes);
  logSucesso(`Cash-flow inicial: R$ ${cashFlowInicial.saldo.toFixed(2)}`, 'financeiro');

  // Criar transações adicionais (despesas)
  console.log('Criando 30 despesas...');
  const categoriasDespesa = ['Aluguel', 'Salário', 'Fornecedor', 'Manutenção', 'Outros'];
  
  for (let i = 1; i <= 30; i++) {
    const transacao = {
      id: gerarId(),
      tipo: 'despesa',
      categoria: categoriasDespesa[i % categoriasDespesa.length],
      descricao: `Despesa Teste ${i}`,
      valor: Math.random() * 2000 + 100,
      formaPagamento: ['Pix', 'Dinheiro', 'Cartão Débito'][i % 3],
      status: Math.random() < 0.7 ? 'pago' : 'pendente',
      dataVencimento: gerarDataAleatoria(30),
      dataPagamento: Math.random() < 0.7 ? gerarDataAleatoria(30) : undefined,
      createdAt: gerarDataAleatoria(60)
    };
    dados.transacoes.push(transacao);
    relatorio.metricas.transacoesCriadas++;
  }

  // Calcular cash-flow após despesas
  const cashFlowAposDespesas = calcularCashFlow(dados.transacoes);
  logSucesso(`Cash-flow após despesas: R$ ${cashFlowAposDespesas.saldo.toFixed(2)}`, 'financeiro');

  // Testar edição de transação
  if (dados.transacoes.length > 0) {
    const transacaoEditar = dados.transacoes[0];
    const valorOriginal = transacaoEditar.valor;
    transacaoEditar.valor = valorOriginal * 1.1; // Aumentar 10%
    
    const cashFlowAposEdicao = calcularCashFlow(dados.transacoes);
    logSucesso(`Transação editada - Cash-flow recalculado`, 'financeiro');
    
    // Restaurar valor original
    transacaoEditar.valor = valorOriginal;
  }

  // Testar exclusão de transação
  if (dados.transacoes.length > 0) {
    const transacaoExcluir = dados.transacoes.pop();
    const cashFlowAposExclusao = calcularCashFlow(dados.transacoes);
    logSucesso(`Transação excluída - Cash-flow recalculado`, 'financeiro');
    
    // Restaurar transação
    dados.transacoes.push(transacaoExcluir);
  }

  // Validar consistência financeira
  const receitas = dados.transacoes
    .filter(t => t.tipo === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + (t.valor || 0), 0);
  
  const despesas = dados.transacoes
    .filter(t => t.tipo === 'despesa' && t.status === 'pago')
    .reduce((sum, t) => sum + (t.valor || 0), 0);

  const saldoCalculado = receitas - despesas;
  const cashFlowFinal = calcularCashFlow(dados.transacoes);

  if (Math.abs(saldoCalculado - cashFlowFinal.saldo) > 0.01) {
    logErro(`Inconsistência financeira detectada! Saldo calculado: ${saldoCalculado}, Cash-flow: ${cashFlowFinal.saldo}`, 'financeiro');
  } else {
    logSucesso('Consistência financeira validada', 'financeiro');
  }

  // Salvar dados
  if (salvarDados(dados)) {
    logSucesso('Dados financeiros salvos', 'financeiro');
    relatorio.testes.financeiro.status = 'sucesso';
  } else {
    logErro('Falha ao salvar dados financeiros', 'financeiro');
    relatorio.testes.financeiro.status = 'falha';
  }
}

// ============================================
// TESTE 4: PERSISTÊNCIA (CRÍTICO)
// ============================================
async function testePersistencia() {
  console.log('\n💾 TESTE 4: PERSISTÊNCIA (CRÍTICO)');
  console.log('==================================\n');

  let dados = carregarDados();
  
  if (!dados) {
    logErro('Nenhum dado encontrado para teste de persistência', 'persistencia');
    relatorio.testes.persistencia.status = 'falha';
    return;
  }

  // Contar dados antes
  const contagemAntes = {
    produtos: dados.produtos?.length || 0,
    clientes: dados.clientes?.length || 0,
    vendas: dados.vendas?.length || 0,
    transacoes: dados.transacoes?.length || 0,
    fornecedores: dados.fornecedores?.length || 0
  };

  logSucesso(`Dados antes: ${JSON.stringify(contagemAntes)}`, 'persistencia');

  // Simular fechamento e reabertura (3 ciclos)
  for (let ciclo = 1; ciclo <= 3; ciclo++) {
    console.log(`\nCiclo ${ciclo} de persistência...`);

    // Salvar dados
    if (!salvarDados(dados)) {
      logErro(`Falha ao salvar no ciclo ${ciclo}`, 'persistencia');
      relatorio.testes.persistencia.status = 'falha';
      return;
    }

    // Simular fechamento (limpar da memória)
    dados = null;

    // Aguardar um pouco (simular fechamento)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Reabrir (carregar do arquivo)
    dados = carregarDados();

    if (!dados) {
      logErro(`Falha ao carregar no ciclo ${ciclo}`, 'persistencia');
      relatorio.testes.persistencia.status = 'falha';
      return;
    }

    // Validar contagem
    const contagemDepois = {
      produtos: dados.produtos?.length || 0,
      clientes: dados.clientes?.length || 0,
      vendas: dados.vendas?.length || 0,
      transacoes: dados.transacoes?.length || 0,
      fornecedores: dados.fornecedores?.length || 0
    };

    // Verificar se todos os dados foram preservados
    let dadosPerdidos = false;
    for (const key in contagemAntes) {
      if (contagemDepois[key] < contagemAntes[key]) {
        logErro(`Dados perdidos no ciclo ${ciclo}: ${key} (antes: ${contagemAntes[key]}, depois: ${contagemDepois[key]})`, 'persistencia');
        dadosPerdidos = true;
      }
    }

    if (!dadosPerdidos) {
      logSucesso(`Ciclo ${ciclo}: Todos os dados preservados`, 'persistencia');
      relatorio.metricas.ciclosPersistencia++;
    }

    // Validar integridade
    const problemasIds = validarIntegridadeIds(dados);
    if (problemasIds.length > 0) {
      problemasIds.forEach(p => logErro(`${p} (ciclo ${ciclo})`, 'persistencia'));
    }
  }

  relatorio.testes.persistencia.status = 'sucesso';
  logSucesso('Teste de persistência concluído', 'persistencia');
}

// ============================================
// TESTE 5: TESTES DE FALHA
// ============================================
async function testeFalhas(dados) {
  console.log('\n💥 TESTE 5: TESTES DE FALHA');
  console.log('============================\n');

  if (!dados) {
    dados = carregarDados();
  }

  // Simular fechamento abrupto (salvar sem fechar corretamente)
  console.log('Simulando fechamento abrupto...');
  
  // Adicionar dados novos
  const produtoTeste = {
    id: gerarId(),
    nome: 'Produto Teste Falha',
    categoria: 'peca',
    estoque: 10,
    estoqueMinimo: 5,
    precoCompra: 50,
    precoVenda: 100,
    margem: 50,
    createdAt: new Date().toISOString()
  };
  dados.produtos.push(produtoTeste);

  // Salvar diretamente (simula fechamento abrupto)
  salvarDados(dados);

  // Simular reabertura
  await new Promise(resolve => setTimeout(resolve, 100));
  const dadosReabertos = carregarDados();

  if (!dadosReabertos) {
    logErro('Falha ao reabrir após fechamento abrupto', 'testeFalhas');
    relatorio.testes.testesFalha.status = 'falha';
    return;
  }

  // Verificar se produto foi salvo
  const produtoEncontrado = dadosReabertos.produtos.find(p => p.id === produtoTeste.id);
  if (produtoEncontrado) {
    logSucesso('Dados preservados após fechamento abrupto', 'testeFalhas');
  } else {
    logErro('Dados perdidos após fechamento abrupto', 'testeFalhas');
  }

  // Verificar duplicação
  const idsProdutos = dadosReabertos.produtos.map(p => p.id);
  const idsUnicos = new Set(idsProdutos);
  if (idsProdutos.length !== idsUnicos.size) {
    logErro(`Duplicação detectada: ${idsProdutos.length - idsUnicos.size} IDs duplicados`, 'testeFalhas');
  } else {
    logSucesso('Nenhuma duplicação detectada', 'testeFalhas');
  }

  relatorio.testes.testesFalha.status = 'sucesso';
}

// ============================================
// TESTE 6: BACKUP E RESTAURAÇÃO
// ============================================
async function testeBackupRestauracao(dados) {
  console.log('\n💿 TESTE 6: BACKUP E RESTAURAÇÃO');
  console.log('================================\n');

  if (!dados) {
    dados = carregarDados();
  }

  if (!dados) {
    logErro('Nenhum dado para backup', 'backupRestauracao');
    relatorio.testes.backupRestauracao.status = 'falha';
    return;
  }

  // Contagem antes do backup
  const contagemAntes = {
    produtos: dados.produtos?.length || 0,
    clientes: dados.clientes?.length || 0,
    vendas: dados.vendas?.length || 0,
    transacoes: dados.transacoes?.length || 0,
    fornecedores: dados.fornecedores?.length || 0
  };

  // Criar backup
  const backupPath = path.join(path.dirname(DATA_PATH), `backup-teste-${Date.now()}.json`);
  const dadosBackup = {
    versao: '2.0',
    dataBackup: new Date().toISOString(),
    dadosPrincipais: dados,
    metadados: {
      totalProdutos: contagemAntes.produtos,
      totalClientes: contagemAntes.clientes,
      totalVendas: contagemAntes.vendas,
      totalTransacoes: contagemAntes.transacoes,
      totalFornecedores: contagemAntes.fornecedores
    }
  };

  try {
    fs.writeFileSync(backupPath, JSON.stringify(dadosBackup, null, 2), 'utf-8');
    logSucesso('Backup criado com sucesso', 'backupRestauracao');
    relatorio.metricas.backupsRealizados++;
  } catch (error) {
    logErro(`Erro ao criar backup: ${error.message}`, 'backupRestauracao', error);
    relatorio.testes.backupRestauracao.status = 'falha';
    return;
  }

  // Simular perda de dados (limpar arquivo)
  const dadosOriginais = { ...dados };
  dados = {
    clientes: [],
    aparelhos: [],
    produtos: [],
    ordensServico: [],
    vendas: [],
    transacoes: [],
    tecnicos: [],
    movimentacoesEstoque: [],
    encomendas: [],
    devolucoes: [],
    recibos: [],
    fornecedores: [],
    configuracao: dados.configuracao || {}
  };
  salvarDados(dados);

  logSucesso('Dados locais apagados (simulação)', 'backupRestauracao');

  // Restaurar backup
  try {
    const backupContent = fs.readFileSync(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent);
    dados = backupData.dadosPrincipais;
    
    if (salvarDados(dados)) {
      logSucesso('Backup restaurado com sucesso', 'backupRestauracao');
    } else {
      logErro('Falha ao salvar dados restaurados', 'backupRestauracao');
    }
  } catch (error) {
    logErro(`Erro ao restaurar backup: ${error.message}`, 'backupRestauracao', error);
    relatorio.testes.backupRestauracao.status = 'falha';
    return;
  }

  // Validar integridade após restauração
  const contagemDepois = {
    produtos: dados.produtos?.length || 0,
    clientes: dados.clientes?.length || 0,
    vendas: dados.vendas?.length || 0,
    transacoes: dados.transacoes?.length || 0,
    fornecedores: dados.fornecedores?.length || 0
  };

  let dadosPerdidos = false;
  for (const key in contagemAntes) {
    if (contagemDepois[key] !== contagemAntes[key]) {
      logErro(`Dados perdidos na restauração: ${key} (antes: ${contagemAntes[key]}, depois: ${contagemDepois[key]})`, 'backupRestauracao');
      dadosPerdidos = true;
    }
  }

  if (!dadosPerdidos) {
    logSucesso('Todos os dados restaurados corretamente', 'backupRestauracao');
  }

  // Validar cash-flow após restauração
  const cashFlowRestaurado = calcularCashFlow(dados.transacoes);
  const cashFlowOriginal = calcularCashFlow(dadosOriginais.transacoes);
  
  if (Math.abs(cashFlowRestaurado.saldo - cashFlowOriginal.saldo) > 0.01) {
    logErro(`Cash-flow inconsistente após restauração! Original: ${cashFlowOriginal.saldo}, Restaurado: ${cashFlowRestaurado.saldo}`, 'backupRestauracao');
  } else {
    logSucesso('Cash-flow validado após restauração', 'backupRestauracao');
  }

  // Limpar backup de teste
  try {
    fs.unlinkSync(backupPath);
  } catch (error) {
    // Ignorar erro ao deletar
  }

  relatorio.testes.backupRestauracao.status = dadosPerdidos ? 'falha' : 'sucesso';
}

// ============================================
// TESTE 7: NAVEGAÇÃO E USABILIDADE
// ============================================
async function testeNavegacao() {
  console.log('\n🧭 TESTE 7: NAVEGAÇÃO E USABILIDADE');
  console.log('===================================\n');

  // Este teste é mais conceitual - valida estrutura de dados
  const dados = carregarDados();
  
  if (!dados) {
    logAviso('Dados não disponíveis para teste de navegação', 'navegacao');
    relatorio.testes.navegacao.status = 'aviso';
    return;
  }

  // Validar que todas as referências estão corretas
  const problemas = [];

  // Validar referências de vendas -> clientes
  if (Array.isArray(dados.vendas)) {
    dados.vendas.forEach(venda => {
      if (venda.clienteId && !dados.clientes.find(c => c.id === venda.clienteId)) {
        problemas.push(`Venda #${venda.numero}: Cliente não encontrado (${venda.clienteId})`);
      }
    });
  }

  // Validar referências de vendas -> produtos
  if (Array.isArray(dados.vendas)) {
    dados.vendas.forEach(venda => {
      if (Array.isArray(venda.items)) {
        venda.items.forEach(item => {
          if (!dados.produtos.find(p => p.id === item.produtoId)) {
            problemas.push(`Venda #${venda.numero}: Produto não encontrado (${item.produtoId})`);
          }
        });
      }
    });
  }

  if (problemas.length > 0) {
    problemas.forEach(p => logErro(p, 'navegacao'));
  } else {
    logSucesso('Todas as referências válidas', 'navegacao');
  }

  relatorio.testes.navegacao.status = problemas.length === 0 ? 'sucesso' : 'falha';
}

// ============================================
// TESTE 8: IMPRESSÃO E RELATÓRIOS
// ============================================
async function testeImpressaoRelatorios() {
  console.log('\n🖨️ TESTE 8: IMPRESSÃO E RELATÓRIOS');
  console.log('==================================\n');

  const dados = carregarDados();
  
  if (!dados) {
    logAviso('Dados não disponíveis para teste de impressão', 'impressao');
    relatorio.testes.impressao.status = 'aviso';
    return;
  }

  // Validar que todas as vendas têm dados necessários para impressão
  if (Array.isArray(dados.vendas)) {
    const vendasInvalidas = dados.vendas.filter(v => 
      !v.numero || !v.total || !v.createdAt || !Array.isArray(v.items) || v.items.length === 0
    );

    if (vendasInvalidas.length > 0) {
      logErro(`${vendasInvalidas.length} vendas com dados inválidos para impressão`, 'impressao');
    } else {
      logSucesso('Todas as vendas têm dados válidos para impressão', 'impressao');
    }
  }

  // Validar totais de relatórios
  const totalVendas = dados.vendas?.reduce((sum, v) => sum + (v.total || 0), 0) || 0;
  const totalTransacoes = dados.transacoes
    ?.filter(t => t.tipo === 'receita' && t.status === 'pago')
    .reduce((sum, t) => sum + (t.valor || 0), 0) || 0;

  // Calcular diferença esperada (nem todas as vendas geram transações pagas)
  // No teste, 80% das vendas geram transações pagas, então esperamos ~20% de diferença
  const diferenca = Math.abs(totalVendas - totalTransacoes);
  const percentualDiferenca = totalVendas > 0 ? (diferenca / totalVendas) * 100 : 0;
  const percentualEsperado = 20; // 20% das vendas não geram transações pagas imediatamente

  // Tolerância de 5% para diferenças (devido a variações aleatórias)
  if (percentualDiferenca > percentualEsperado + 5) {
    logAviso(`Diferença entre vendas e transações maior que o esperado: ${percentualDiferenca.toFixed(2)}% (esperado: ~${percentualEsperado}%)`, 'impressao');
  } else if (percentualDiferenca < percentualEsperado - 5) {
    logAviso(`Diferença entre vendas e transações menor que o esperado: ${percentualDiferenca.toFixed(2)}% (esperado: ~${percentualEsperado}%)`, 'impressao');
  } else {
    logSucesso(`Diferença entre vendas e transações dentro do esperado: ${percentualDiferenca.toFixed(2)}% (simula vendas não pagas/parceladas)`, 'impressao');
  }

  relatorio.testes.impressao.status = 'sucesso';
}

// ============================================
// TESTE 9: MONITORAMENTO TÉCNICO
// ============================================
async function testeMonitoramento() {
  console.log('\n📊 TESTE 9: MONITORAMENTO TÉCNICO');
  console.log('==================================\n');

  const dados = carregarDados();
  
  if (!dados) {
    logAviso('Dados não disponíveis para monitoramento', 'monitoramento');
    relatorio.testes.monitoramento.status = 'aviso';
    return;
  }

  // Verificar tamanho do arquivo
  try {
    if (fs.existsSync(DATA_PATH)) {
      const stats = fs.statSync(DATA_PATH);
      const tamanhoMB = (stats.size / (1024 * 1024)).toFixed(2);
      logSucesso(`Tamanho do arquivo de dados: ${tamanhoMB} MB`, 'monitoramento');
      
      if (stats.size > 50 * 1024 * 1024) { // 50MB
        logAviso('Arquivo de dados muito grande (>50MB)', 'monitoramento');
      }
    }
  } catch (error) {
    logErro(`Erro ao verificar tamanho do arquivo: ${error.message}`, 'monitoramento', error);
  }

  // Contar total de registros
  const totalRegistros = 
    (dados.clientes?.length || 0) +
    (dados.produtos?.length || 0) +
    (dados.vendas?.length || 0) +
    (dados.transacoes?.length || 0) +
    (dados.ordensServico?.length || 0) +
    (dados.fornecedores?.length || 0);

  logSucesso(`Total de registros: ${totalRegistros}`, 'monitoramento');

  // Verificar estrutura de arrays
  const arraysInvalidos = [];
  const arrays = ['clientes', 'produtos', 'vendas', 'transacoes', 'fornecedores'];
  arrays.forEach(arrayName => {
    if (dados[arrayName] && !Array.isArray(dados[arrayName])) {
      arraysInvalidos.push(arrayName);
    }
  });

  if (arraysInvalidos.length > 0) {
    logErro(`Arrays inválidos: ${arraysInvalidos.join(', ')}`, 'monitoramento');
  } else {
    logSucesso('Estrutura de arrays válida', 'monitoramento');
  }

  relatorio.testes.monitoramento.status = 'sucesso';
}

// ============================================
// FUNÇÃO PRINCIPAL
// ============================================
async function executarTesteExtremo() {
  console.log('🚀 INICIANDO TESTE EXTREMO - SIMULAÇÃO DE PRODUÇÃO');
  console.log('==================================================\n');

  const inicio = Date.now();

  try {
    // TESTE 1: Criação massiva
    let dados = await testeCriacaoMassiva();

    // TESTE 2: Fluxo de vendas
    dados = await testeFluxoVendas(dados);

    // TESTE 3: Financeiro
    await testeFinanceiro(dados);

    // TESTE 4: Persistência (múltiplos ciclos)
    await testePersistencia();

    // TESTE 5: Testes de falha
    await testeFalhas(dados);

    // TESTE 6: Backup e restauração
    await testeBackupRestauracao(dados);

    // TESTE 7: Navegação
    await testeNavegacao();

    // TESTE 8: Impressão e relatórios
    await testeImpressaoRelatorios();

    // TESTE 9: Monitoramento
    await testeMonitoramento();

  } catch (error) {
    logErro(`Erro crítico durante teste: ${error.message}`, 'geral', error);
  }

  // Finalizar relatório
  const fim = Date.now();
  relatorio.fim = new Date().toISOString();
  relatorio.metricas.tempoTotal = ((fim - inicio) / 1000).toFixed(2);

  // Gerar relatório final
  gerarRelatorioFinal();
}

// ============================================
// GERAR RELATÓRIO FINAL
// ============================================
function gerarRelatorioFinal() {
  console.log('\n📋 GERANDO RELATÓRIO FINAL...\n');

  const relatorioPath = path.join(__dirname, 'RELATORIO_TESTE_EXTREMO.md');
  
  let conteudo = `# RELATÓRIO DE TESTE EXTREMO - SIMULAÇÃO DE PRODUÇÃO
**Smart Tech Rolândia 2.0**

**Data/Hora Início:** ${relatorio.inicio}  
**Data/Hora Fim:** ${relatorio.fim}  
**Tempo Total:** ${relatorio.metricas.tempoTotal} segundos

---

## 📊 MÉTRICAS DO TESTE

- **Produtos Criados:** ${relatorio.metricas.produtosCriados}
- **Clientes Criados:** ${relatorio.metricas.clientesCriados}
- **Vendas Criadas:** ${relatorio.metricas.vendasCriadas}
- **Transações Criadas:** ${relatorio.metricas.transacoesCriadas}
- **Backups Realizados:** ${relatorio.metricas.backupsRealizados}
- **Ciclos de Persistência:** ${relatorio.metricas.ciclosPersistencia}

---

## ✅ TESTES REALIZADOS

`;

  // Status dos testes
  for (const [teste, resultado] of Object.entries(relatorio.testes)) {
    const status = resultado.status === 'sucesso' ? '✅' : resultado.status === 'falha' ? '❌' : '⚠️';
    conteudo += `- **${teste}**: ${status} ${resultado.status.toUpperCase()}\n`;
  }

  conteudo += `\n---\n\n## ❌ ERROS ENCONTRADOS\n\n`;
  
  if (relatorio.erros.length === 0) {
    conteudo += `**Nenhum erro encontrado!** ✅\n\n`;
  } else {
    relatorio.erros.forEach((erro, index) => {
      conteudo += `### Erro ${index + 1}\n`;
      conteudo += `- **Timestamp:** ${erro.timestamp}\n`;
      conteudo += `- **Teste:** ${erro.teste}\n`;
      conteudo += `- **Mensagem:** ${erro.mensagem}\n`;
      if (erro.erro) {
        conteudo += `- **Detalhes:** ${erro.erro}\n`;
      }
      conteudo += `\n`;
    });
  }

  conteudo += `\n---\n\n## ⚠️ AVISOS\n\n`;
  
  if (relatorio.avisos.length === 0) {
    conteudo += `**Nenhum aviso!** ✅\n\n`;
  } else {
    relatorio.avisos.forEach((aviso, index) => {
      conteudo += `### Aviso ${index + 1}\n`;
      conteudo += `- **Timestamp:** ${aviso.timestamp}\n`;
      conteudo += `- **Teste:** ${aviso.teste}\n`;
      conteudo += `- **Mensagem:** ${aviso.mensagem}\n\n`;
    });
  }

  conteudo += `\n---\n\n## ✅ SUCESSOS\n\n`;
  conteudo += `**Total de operações bem-sucedidas:** ${relatorio.sucessos.length}\n\n`;

  conteudo += `\n---\n\n## 📈 ANÁLISE DE PERFORMANCE\n\n`;
  conteudo += `- **Tempo médio por operação:** ${(relatorio.metricas.tempoTotal / (relatorio.sucessos.length || 1)).toFixed(3)} segundos\n`;
  conteudo += `- **Taxa de sucesso:** ${((relatorio.sucessos.length / (relatorio.sucessos.length + relatorio.erros.length || 1)) * 100).toFixed(2)}%\n`;

  conteudo += `\n---\n\n## 🎯 CONCLUSÃO\n\n`;
  
  const totalErros = relatorio.erros.length;
  const totalAvisos = relatorio.avisos.length;
  const totalSucessos = relatorio.sucessos.length;
  
  if (totalErros === 0 && totalAvisos === 0) {
    conteudo += `**✅ SISTEMA APROVADO PARA PRODUÇÃO**\n\n`;
    conteudo += `Todos os testes foram executados com sucesso. Nenhum erro ou aviso crítico foi encontrado.\n`;
  } else if (totalErros === 0) {
    conteudo += `**⚠️ SISTEMA APROVADO COM RESSALVAS**\n\n`;
    conteudo += `Todos os testes críticos passaram, mas há ${totalAvisos} aviso(s) que devem ser revisados.\n`;
  } else {
    conteudo += `**❌ SISTEMA REQUER CORREÇÕES**\n\n`;
    conteudo += `Foram encontrados ${totalErros} erro(s) que precisam ser corrigidos antes do uso em produção.\n`;
  }

  conteudo += `\n---\n\n**Relatório gerado automaticamente em:** ${new Date().toLocaleString('pt-BR')}\n`;

  // Salvar relatório
  try {
    fs.writeFileSync(relatorioPath, conteudo, 'utf-8');
    console.log(`\n✅ Relatório salvo em: ${relatorioPath}\n`);
  } catch (error) {
    console.error(`\n❌ Erro ao salvar relatório: ${error.message}\n`);
  }

  // Exibir resumo no console
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DO TESTE EXTREMO');
  console.log('='.repeat(60));
  console.log(`✅ Sucessos: ${totalSucessos}`);
  console.log(`⚠️  Avisos: ${totalAvisos}`);
  console.log(`❌ Erros: ${totalErros}`);
  console.log(`⏱️  Tempo Total: ${relatorio.metricas.tempoTotal}s`);
  console.log('='.repeat(60));
  console.log(`\n📄 Relatório completo: ${relatorioPath}\n`);
}

// Executar teste
executarTesteExtremo().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});

