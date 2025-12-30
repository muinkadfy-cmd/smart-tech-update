/**
 * Auditoria Completa de IPCs
 * Verifica todos os handlers IPC e identifica problemas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const preloadPath = path.join(ROOT_DIR, 'electron', 'preload.js');
const mainPath = path.join(ROOT_DIR, 'electron', 'main.js');
const srcDir = path.join(ROOT_DIR, 'src');

// Ler arquivos
const preloadContent = fs.readFileSync(preloadPath, 'utf8');
const mainContent = fs.readFileSync(mainPath, 'utf8');

// Extrair todos os ipcRenderer.invoke
const invokeRegex = /ipcRenderer\.invoke\(['"]([^'"]+)['"]/g;
const invokes = [];
let match;
while ((match = invokeRegex.exec(preloadContent)) !== null) {
  invokes.push(match[1]);
}

// Extrair todos os ipcMain.handle
const handleRegex = /ipcMain\.handle\(['"]([^'"]+)['"]/g;
const handles = [];
while ((match = handleRegex.exec(mainContent)) !== null) {
  handles.push(match[1]);
}

// Buscar uso no frontend
function findIPCUsageInSrc() {
  const files = [];
  function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walkDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        files.push(fullPath);
      }
    }
  }
  walkDir(srcDir);
  
  const usage = {};
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      invokes.forEach(invoke => {
        if (content.includes(invoke)) {
          if (!usage[invoke]) usage[invoke] = [];
          usage[invoke].push(path.relative(ROOT_DIR, file));
        }
      });
    } catch (e) {
      // Ignorar erros de leitura
    }
  });
  return usage;
}

console.log('\n🔍 AUDITORIA COMPLETA DE IPCs\n');
console.log('='.repeat(70));

// Verificar correspondências
const missing = [];
const extra = [];
const unused = [];

invokes.forEach(invoke => {
  if (!handles.includes(invoke)) {
    missing.push(invoke);
  }
});

handles.forEach(handle => {
  if (!invokes.includes(handle)) {
    extra.push(handle);
  }
});

// Verificar uso no frontend
const usage = findIPCUsageInSrc();
invokes.forEach(invoke => {
  if (!usage[invoke] || usage[invoke].length === 0) {
    unused.push(invoke);
  }
});

// Resultado
console.log('\n📊 ESTATÍSTICAS:');
console.log(`   Invokes no preload.js: ${invokes.length}`);
console.log(`   Handles no main.js: ${handles.length}`);
console.log(`   Handlers usados no frontend: ${Object.keys(usage).length}`);
console.log(`   Handlers não usados: ${unused.length}`);

if (missing.length > 0) {
  console.log('\n❌ HANDLERS FALTANDO (CRÍTICO):');
  missing.forEach(name => {
    console.log(`   - ${name}`);
  });
}

if (unused.length > 0) {
  console.log('\n⚠️  HANDLERS NÃO USADOS NO FRONTEND:');
  unused.forEach(name => {
    console.log(`   - ${name}`);
  });
}

if (extra.length > 0) {
  console.log('\n📦 HANDLERS EXTRAS (não usados no preload.js):');
  extra.forEach(name => {
    console.log(`   - ${name}`);
  });
}

// Agrupar por categoria
console.log('\n📋 HANDLERS POR CATEGORIA:');
const categories = {
  'App Data': invokes.filter(i => i.includes('clear-app-data')),
  'Window': invokes.filter(i => i.startsWith('window-')),
  'Update Offline': invokes.filter(i => i.startsWith('update-') && !i.includes('online')),
  'Update Online': invokes.filter(i => i.includes('update-') && (i.includes('online') || i.includes('download') || i.includes('install'))),
  'Storage': invokes.filter(i => i.startsWith('storage-')),
};

Object.entries(categories).forEach(([cat, items]) => {
  if (items.length > 0) {
    console.log(`\n   ${cat}: ${items.length} handlers`);
    items.forEach(item => {
      const used = usage[item] ? `(${usage[item].length} uso${usage[item].length > 1 ? 's' : ''})` : '(não usado)';
      console.log(`     - ${item} ${used}`);
    });
  }
});

console.log('\n' + '='.repeat(70));

if (missing.length > 0) {
  console.log('\n❌ ERRO: Existem handlers faltando!');
  process.exit(1);
} else {
  console.log('\n✅ Todos os handlers IPC estão registrados corretamente!');
}

