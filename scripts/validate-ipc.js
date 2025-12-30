/**
 * Script de Validação IPC
 * Verifica que todos os ipcRenderer.invoke têm ipcMain.handle correspondentes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const preloadPath = path.join(ROOT_DIR, 'electron', 'preload.js');
const mainPath = path.join(ROOT_DIR, 'electron', 'main.js');

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

// Verificar correspondências
console.log('\n🔍 Validação de Handlers IPC\n');
console.log('='.repeat(60));

const missing = [];
const extra = [];

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

// Resultado
if (missing.length === 0 && extra.length === 0) {
  console.log('✅ Todos os handlers IPC estão corretos!');
  console.log(`   ${invokes.length} handlers encontrados e validados`);
} else {
  if (missing.length > 0) {
    console.log('\n❌ Handlers faltando no main.js:');
    missing.forEach(name => {
      console.log(`   - ${name}`);
    });
  }
  
  if (extra.length > 0) {
    console.log('\n⚠️  Handlers no main.js sem uso no preload.js:');
    extra.forEach(name => {
      console.log(`   - ${name}`);
    });
  }
}

console.log('\n' + '='.repeat(60));
console.log(`📊 Estatísticas:`);
console.log(`   Invokes no preload.js: ${invokes.length}`);
console.log(`   Handles no main.js: ${handles.length}`);
console.log(`   Correspondências: ${invokes.length - missing.length}`);

if (missing.length > 0 || extra.length > 0) {
  process.exit(1);
}

