/**
 * Script de Pós-Build Automático
 * Smart Tech Rolândia 2.0
 * 
 * Executado AUTOMATICAMENTE após cada build do Electron
 * Cria ZIP de atualização e atualiza update/update.json
 * 
 * REGRAS:
 * - Build principal (exe/instalador) NÃO será usado para update
 * - Update SEMPRE será feito via ZIP separado
 * - Código do app NÃO é alterado
 * - Sistema de update existente é respeitado
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Lê versão atual do package.json
 */
function getCurrentVersion() {
  const packagePath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

/**
 * Cria ZIP de atualização contendo APENAS o executável gerado pelo electron-builder
 * - Smart Tech Rolândia Setup X.X.X.exe (instalador NSIS)
 * 
 * IMPORTANTE: 
 * - Usa o executável já gerado pelo electron-builder
 * - Não cria outro ZIP com arquivos fonte
 * - O executável já contém tudo necessário para instalação
 */
async function createUpdateZip(version) {
  const distElectronDir = path.join(ROOT_DIR, 'dist-electron');
  const outputDir = path.join(ROOT_DIR, 'update-build');
  const zipPath = path.join(outputDir, `update-${version}.zip`);

  // Criar diretório se não existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Encontrar o executável correspondente à versão atual
  const executableName = `Smart Tech Rolândia Setup ${version}.exe`;
  const executablePath = path.join(distElectronDir, executableName);

  // Verificar se o executável existe
  if (!fs.existsSync(executablePath)) {
    throw new Error(`Executável não encontrado: ${executablePath}\nCertifique-se de que o electron-builder foi executado com sucesso.`);
  }

  log(`\n📦 Criando update-${version}.zip...`, 'cyan');
  log(`   📁 Incluindo: ${executableName}`, 'cyan');
  log(`   📍 Origem: ${executablePath}`, 'cyan');

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const size = archive.pointer();
      log(`✅ ZIP criado: ${path.basename(zipPath)} (${(size / 1024 / 1024).toFixed(2)} MB)`, 'green');
      resolve({ zipPath, size });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Adicionar o executável instalador dentro do ZIP
    // O nome dentro do ZIP será o mesmo do arquivo original
    archive.file(executablePath, { name: executableName });
    log(`   ✅ Adicionado instalador: ${executableName}`, 'green');

    // Adicionar também o ATUALIZAR.bat para facilitar a atualização
    const atualizarBatPath = path.join(ROOT_DIR, 'ATUALIZAR.bat');
    if (fs.existsSync(atualizarBatPath)) {
      archive.file(atualizarBatPath, { name: 'ATUALIZAR.bat' });
      log(`   ✅ Adicionado: ATUALIZAR.bat`, 'green');
    } else {
      log(`   ⚠️  ATUALIZAR.bat não encontrado (opcional)`, 'yellow');
    }

    archive.finalize();
  });
}

/**
 * Atualiza update/update.json com informações da nova versão
 * Formato obrigatório conforme especificação
 */
function updateUpdateJson(version, zipSize) {
  const updateDir = path.join(ROOT_DIR, 'update');
  
  // Criar pasta update/ se não existir
  if (!fs.existsSync(updateDir)) {
    fs.mkdirSync(updateDir, { recursive: true });
    log(`📁 Pasta update/ criada`, 'blue');
  }

  const updatePath = path.join(updateDir, 'update.json');
  
  // Link do GitHub Releases (formato correto)
  const downloadUrl = `https://github.com/muinkadfy-cmd/smart-tech-update/releases/download/v${version}/update-${version}.zip`;
  
  // Criar update.json no formato obrigatório
  const updateJson = {
    version: version,
    minVersion: "2.0.0",
    releaseDate: new Date().toISOString(),
    downloadUrl: downloadUrl,
    size: zipSize || 0,
    requiresRestart: true,
    changelog: [
      `Versão ${version}`,
      "- Build gerado e publicado",
      "- Correções e melhorias",
      "- Melhorias de performance",
      "- Atualizações de segurança"
    ]
  };
  
  fs.writeFileSync(updatePath, JSON.stringify(updateJson, null, 2) + '\n');
  log(`✅ update/update.json atualizado`, 'green');
  log(`   📦 Tamanho: ${(zipSize / 1024 / 1024).toFixed(2)} MB`, 'cyan');
  log(`   🔗 URL: ${downloadUrl}`, 'cyan');
}

/**
 * Cria update/version.json com informações básicas da versão
 * Criado na mesma pasta que update.json
 */
function createVersionJson(version) {
  const updateDir = path.join(ROOT_DIR, 'update');
  
  // Criar pasta update/ se não existir
  if (!fs.existsSync(updateDir)) {
    fs.mkdirSync(updateDir, { recursive: true });
  }

  const versionPath = path.join(updateDir, 'version.json');
  
  // Criar version.json com informações básicas
  const versionJson = {
    version: version,
    releaseDate: new Date().toISOString(),
    buildDate: new Date().toISOString()
  };
  
  fs.writeFileSync(versionPath, JSON.stringify(versionJson, null, 2) + '\n');
  log(`✅ update/version.json criado`, 'green');
  log(`   📌 Versão: ${version}`, 'cyan');
}

/**
 * Limpa versões antigas da pasta update-build/
 */
function cleanOldVersions(currentVersion) {
  const updateBuildDir = path.join(ROOT_DIR, 'update-build');
  
  if (!fs.existsSync(updateBuildDir)) {
    return;
  }

  try {
    const files = fs.readdirSync(updateBuildDir);
    let removedCount = 0;

    files.forEach((file) => {
      // Remover ZIPs de versões antigas
      if (file.startsWith('update-') && file.endsWith('.zip')) {
        const fileVersion = file.match(/update-(\d+\.\d+\.\d+)\.zip/)?.[1];
        if (fileVersion && fileVersion !== currentVersion) {
          const filePath = path.join(updateBuildDir, file);
          fs.unlinkSync(filePath);
          removedCount++;
          log(`🗑️  Removido: ${file} (versão antiga)`, 'yellow');
        }
      }
    });

    if (removedCount > 0) {
      log(`✅ ${removedCount} arquivo(s) de versão antiga removido(s)`, 'green');
    }
  } catch (error) {
    log(`⚠️  Erro ao limpar versões antigas: ${error.message}`, 'yellow');
  }
}

/**
 * Função principal - Executada automaticamente após build
 */
async function postBuildUpdate() {
  try {
    log('\n' + '='.repeat(60), 'bright');
    log('🔄 PROCESSO PÓS-BUILD AUTOMÁTICO', 'bright');
    log('='.repeat(60), 'bright');

    // 1. Obter versão atual do package.json
    const currentVersion = getCurrentVersion();
    log(`📌 Versão do build: ${currentVersion}`, 'cyan');

    // 2. Criar ZIP de atualização
    log('\n📦 Criando ZIP de atualização...', 'cyan');
    const { zipPath, size } = await createUpdateZip(currentVersion);

    // 3. Atualizar update/update.json
    log('\n📝 Atualizando update/update.json...', 'cyan');
    updateUpdateJson(currentVersion, size);

    // 4. Criar update/version.json
    log('\n📝 Criando update/version.json...', 'cyan');
    createVersionJson(currentVersion);

    // 5. Limpar versões antigas
    log('\n🧹 Limpando versões antigas...', 'cyan');
    cleanOldVersions(currentVersion);

    // Resumo final
    log('\n' + '='.repeat(60), 'bright');
    log('✅ PROCESSO PÓS-BUILD CONCLUÍDO!', 'green');
    log('='.repeat(60), 'bright');
    log(`📦 ZIP criado: update-${currentVersion}.zip (${(size / 1024 / 1024).toFixed(2)} MB)`, 'cyan');
    log(`📄 update.json atualizado: /update/update.json`, 'cyan');
    log(`📄 version.json criado: /update/version.json`, 'cyan');
    log(`🔗 URL de download: https://github.com/muinkadfy-cmd/smart-tech-update/releases/download/v${currentVersion}/update-${currentVersion}.zip`, 'cyan');
    log('\n📌 PRÓXIMOS PASSOS:', 'yellow');
    log('   1. Faça upload do ZIP para GitHub Releases', 'yellow');
    log('   2. Crie release com tag v' + currentVersion, 'yellow');
    log('   3. Anexe update-' + currentVersion + '.zip à release', 'yellow');
    log('='.repeat(60), 'bright');

  } catch (error) {
    log(`\n❌ ERRO no processo pós-build: ${error.message}`, 'red');
    log(`   Stack: ${error.stack}`, 'red');
    process.exit(1);
  }
}

// Executar automaticamente
postBuildUpdate();

