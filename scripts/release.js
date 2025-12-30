/**
 * Script de Release Automático
 * Smart Tech Rolândia 2.0
 * 
 * Incrementa versão, atualiza arquivos, gera build e faz commit/push
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
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
 * Compara duas versões usando semver (x.y.z)
 * Retorna: 1 se v1 > v2, -1 se v1 < v2, 0 se v1 === v2
 * NUNCA compara como string, sempre usa semver
 */
function compareVersions(v1, v2) {
  // Validar formato semver
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(v1) || !semverRegex.test(v2)) {
    throw new Error(`Versão inválida: v1=${v1}, v2=${v2}. Use formato semver (X.Y.Z)`);
  }
  
  // Dividir em partes numéricas (semver: MAJOR.MINOR.PATCH)
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  // Garantir 3 partes (MAJOR, MINOR, PATCH)
  while (parts1.length < 3) parts1.push(0);
  while (parts2.length < 3) parts2.push(0);
  
  // Comparar MAJOR primeiro
  if (parts1[0] !== parts2[0]) {
    return parts1[0] > parts2[0] ? 1 : -1;
  }
  
  // Se MAJOR igual, comparar MINOR
  if (parts1[1] !== parts2[1]) {
    return parts1[1] > parts2[1] ? 1 : -1;
  }
  
  // Se MINOR igual, comparar PATCH
  if (parts1[2] !== parts2[2]) {
    return parts1[2] > parts2[2] ? 1 : -1;
  }
  
  // Versões iguais
  return 0;
}

/**
 * Valida formato semver
 */
function validateSemver(version) {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

/**
 * Incrementa versão
 */
function incrementVersion(currentVersion, type) {
  if (!validateSemver(currentVersion)) {
    throw new Error(`Versão inválida: ${currentVersion}. Use formato semver (X.Y.Z)`);
  }

  const parts = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${parts[0] + 1}.0.0`;
    case 'minor':
      return `${parts[0]}.${parts[1] + 1}.0`;
    case 'patch':
      return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    default:
      throw new Error(`Tipo de incremento inválido: ${type}. Use: major, minor ou patch`);
  }
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
 * Atualiza versão no package.json
 */
function updatePackageJson(newVersion) {
  const packagePath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`✅ package.json atualizado para versão ${newVersion}`, 'green');
}

/**
 * Atualiza update.json na pasta update/ (ÚNICA fonte oficial)
 * 
 * IMPORTANTE:
 * - Este é o ÚNICO arquivo update.json que o app Electron consome
 * - Endpoint remoto: https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update/update.json
 * - update-build/ NÃO deve conter update.json (apenas para scripts internos)
 */
function updateUpdateJsonFile(newVersion, zipSize) {
  const updateDir = path.join(ROOT_DIR, 'update');
  
  // Criar pasta update/ se não existir
  if (!fs.existsSync(updateDir)) {
    fs.mkdirSync(updateDir, { recursive: true });
    log(`📁 Pasta update/ criada`, 'blue');
  }

  const updatePath = path.join(updateDir, 'update.json');
  
  // Link do GitHub Releases (formato correto)
  const downloadUrl = `https://github.com/muinkadfy-cmd/smart-tech-update/releases/download/v${newVersion}/update-${newVersion}.zip`;
  
  // Criar update.json no formato compatível com update manual do Electron
  const updateJson = {
    version: newVersion,
    minVersion: "2.0.0",
    releaseDate: new Date().toISOString(),
    downloadUrl: downloadUrl,
    size: zipSize || 0,
    requiresRestart: true,
    changelog: [
      `Versão ${newVersion}`,
      "- Melhorias de performance",
      "- Correções de bugs",
      "- Atualizações de segurança",
      "- Otimizações gerais"
    ]
  };
  
  fs.writeFileSync(updatePath, JSON.stringify(updateJson, null, 2) + '\n');
  log(`✅ update/update.json atualizado (ÚNICA fonte oficial)`, 'green');
  log(`   📦 Tamanho: ${(zipSize / 1024 / 1024).toFixed(2)} MB`, 'cyan');
  log(`   🔗 URL: ${downloadUrl}`, 'cyan');
  
  // Validar que é o único update.json válido
  validateSingleUpdateJson(updateDir);
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
 * Gera build do Electron
 */
function buildElectron() {
  log('\n🔨 Gerando build do Electron...', 'cyan');
  try {
    execSync('npm run electron:build', { 
      stdio: 'inherit',
      cwd: ROOT_DIR 
    });
    log('✅ Build do Electron concluído', 'green');
    return true;
  } catch (error) {
    log(`❌ Erro ao gerar build: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Gera arquivo update-X.X.X.zip
 */
async function createUpdateZip(version) {
  const distDir = path.join(ROOT_DIR, 'dist-electron', 'win-unpacked');
  const outputDir = path.join(ROOT_DIR, 'update-build');
  const zipPath = path.join(outputDir, `update-${version}.zip`);

  // Criar diretório se não existir
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Verificar se dist existe
  if (!fs.existsSync(distDir)) {
    throw new Error(`Diretório de build não encontrado: ${distDir}`);
  }

  log(`\n📦 Criando update-${version}.zip...`, 'cyan');

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const size = archive.pointer();
      log(`✅ ZIP criado: ${path.basename(zipPath)} (${(size / 1024).toFixed(2)} KB)`, 'green');
      resolve({ zipPath, size });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    // Adicionar todos os arquivos do dist
    archive.directory(distDir, false);
    archive.finalize();
  });
}

/**
 * Valida que existe apenas um update.json válido em /update
 */
function validateSingleUpdateJson(updateDir) {
  try {
    const files = fs.readdirSync(updateDir);
    const updateJsonFiles = files.filter(f => f === 'update.json' || f.startsWith('update.json'));
    
    if (updateJsonFiles.length > 1) {
      log(`⚠️  AVISO: Múltiplos arquivos update.json encontrados em /update`, 'yellow');
      log(`   Arquivos: ${updateJsonFiles.join(', ')}`, 'yellow');
    }
    
    // Garantir que existe exatamente um update.json
    const mainUpdateJson = path.join(updateDir, 'update.json');
    if (!fs.existsSync(mainUpdateJson)) {
      throw new Error('update.json não encontrado em /update após criação');
    }
    
    log(`✅ Validação: /update/update.json é a única fonte oficial`, 'green');
  } catch (error) {
    log(`⚠️  Erro na validação: ${error.message}`, 'yellow');
  }
}

/**
 * Limpa versões antigas da pasta update/
 */
function cleanOldVersions(currentVersion) {
  const updateDir = path.join(ROOT_DIR, 'update');
  
  if (!fs.existsSync(updateDir)) {
    return;
  }

  try {
    const files = fs.readdirSync(updateDir);
    let removedCount = 0;

    files.forEach((file) => {
      // Remover ZIPs de versões antigas (manter apenas o atual se existir)
      // NÃO remover update.json (é o arquivo oficial)
      if (file.startsWith('update-') && file.endsWith('.zip')) {
        const fileVersion = file.match(/update-(\d+\.\d+\.\d+)\.zip/)?.[1];
        if (fileVersion && fileVersion !== currentVersion) {
          const filePath = path.join(updateDir, file);
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
 * Remove qualquer update.json de update-build (não deve existir)
 * update-build é APENAS para scripts internos, não para consumo do app
 */
function ensureNoUpdateJsonInBuildDir() {
  const updateBuildDir = path.join(ROOT_DIR, 'update-build');
  const updateJsonInBuild = path.join(updateBuildDir, 'update.json');
  
  if (fs.existsSync(updateJsonInBuild)) {
    fs.unlinkSync(updateJsonInBuild);
    log(`🗑️  Removido update.json de update-build/ (não deve existir)`, 'yellow');
  }
}

/**
 * Copia arquivos e atualiza update.json
 * IMPORTANTE: update-build é APENAS para scripts internos
 * O app Electron consome EXCLUSIVAMENTE /update/update.json
 */
function copyUpdateFiles(version, previousVersion, zipSize, zipPath) {
  const updateBuildDir = path.join(ROOT_DIR, 'update-build');
  const updateDir = path.join(ROOT_DIR, 'update');

  // Criar pasta update-build se não existir (APENAS para scripts internos)
  if (!fs.existsSync(updateBuildDir)) {
    fs.mkdirSync(updateBuildDir, { recursive: true });
  }

  // Garantir que NÃO existe update.json em update-build
  ensureNoUpdateJsonInBuildDir();

  // Copiar ZIP para update-build (backup local - apenas para scripts internos)
  if (fs.existsSync(zipPath)) {
    const zipDest = path.join(updateBuildDir, `update-${version}.zip`);
    fs.copyFileSync(zipPath, zipDest);
    log(`📋 ZIP copiado para update-build/ (backup interno)`, 'blue');
  }

  // Atualizar update/update.json (ÚNICA fonte oficial para o Electron)
  updateUpdateJsonFile(version, zipSize);

  // Criar update/version.json
  createVersionJson(version);

  // Limpar versões antigas da pasta update/
  cleanOldVersions(version);

  log('✅ Arquivos de atualização processados', 'green');
  log('   📌 Fonte oficial: /update/update.json', 'cyan');
  log('   📌 version.json criado: /update/version.json', 'cyan');
  log('   📌 update-build/ é apenas para scripts internos', 'cyan');
}

/**
 * Faz git commit e push
 */
function gitCommitAndPush(version, type) {
  log('\n📝 Fazendo commit e push...', 'cyan');
  
  try {
    // Adicionar arquivos modificados
    execSync('git add package.json update/update.json update/version.json', { 
      stdio: 'inherit',
      cwd: ROOT_DIR 
    });

    // NOTA: Arquivos ZIP não são commitados automaticamente pois podem exceder 100MB
    // Os ZIPs devem ser enviados manualmente via GitHub Releases ou GitHub Pages
    log('   ⚠️  Arquivos ZIP não serão commitados (podem exceder 100MB)', 'yellow');
    log('   📦 Faça upload manual dos ZIPs via GitHub Releases ou GitHub Pages', 'yellow');

    // Commit
    const commitMessage = `chore: release ${version} (${type})`;
    execSync(`git commit -m "${commitMessage}"`, { 
      stdio: 'inherit',
      cwd: ROOT_DIR 
    });

    // Detectar branch atual
    let currentBranch;
    try {
      currentBranch = execSync('git branch --show-current', { 
        encoding: 'utf8',
        cwd: ROOT_DIR 
      }).trim();
    } catch {
      currentBranch = 'main'; // fallback
    }

    // Push (tentar primeiro push normal, depois com --set-upstream se necessário)
    try {
      execSync('git push', { 
        stdio: 'inherit',
        cwd: ROOT_DIR 
      });
    } catch (pushError) {
      // Se falhar, tentar com --set-upstream
      if (pushError.message.includes('no upstream branch') || pushError.message.includes('upstream')) {
        log('   Configurando upstream e fazendo push...', 'yellow');
        execSync(`git push --set-upstream origin ${currentBranch}`, { 
          stdio: 'inherit',
          cwd: ROOT_DIR 
        });
      } else {
        throw pushError;
      }
    }

    log(`✅ Commit e push concluídos: ${version}`, 'green');
    return true;
  } catch (error) {
    log(`⚠️  Erro no git: ${error.message}`, 'yellow');
    log('   Você pode fazer commit manualmente depois', 'yellow');
    return false;
  }
}

/**
 * Função principal
 */
async function release(type) {
  try {
    log('\n🚀 Iniciando release automático...', 'bright');
    log(`📌 Tipo: ${type}`, 'cyan');

    // 1. Obter versão atual
    const currentVersion = getCurrentVersion();
    log(`📌 Versão atual: ${currentVersion}`, 'cyan');

    // 2. Incrementar versão
    const newVersion = incrementVersion(currentVersion, type);
    log(`📌 Nova versão: ${newVersion}`, 'green');

    // 3. Atualizar package.json
    updatePackageJson(newVersion);

    // 4. Gerar build do Electron
    if (!buildElectron()) {
      throw new Error('Falha ao gerar build do Electron');
    }

    // 5. Gerar update-X.X.X.zip
    const { zipPath, size } = await createUpdateZip(newVersion);

    // 6. Copiar arquivos para raiz e update/ (já atualiza JSONs)
    copyUpdateFiles(newVersion, currentVersion, size, zipPath);

    // 8. Git commit e push
    gitCommitAndPush(newVersion, type);

    // Resumo final
    log('\n' + '='.repeat(60), 'bright');
    log('✅ RELEASE CONCLUÍDO COM SUCESSO!', 'green');
    log('='.repeat(60), 'bright');
    log(`📦 Versão: ${currentVersion} → ${newVersion}`, 'cyan');
    log(`📁 ZIP: update-${newVersion}.zip (${(size / 1024 / 1024).toFixed(2)} MB)`, 'cyan');
    log(`🔗 GitHub Release: https://github.com/muinkadfy-cmd/smart-tech-update/releases/download/v${newVersion}/update-${newVersion}.zip`, 'cyan');
    log(`📄 update.json: https://raw.githubusercontent.com/muinkadfy-cmd/smart-tech-update/main/update/update.json`, 'cyan');
    log('='.repeat(60), 'bright');

  } catch (error) {
    log(`\n❌ ERRO: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar
const type = process.argv[2];

if (!type || !['patch', 'minor', 'major'].includes(type)) {
  log('❌ Uso: node scripts/release.js <patch|minor|major>', 'red');
  process.exit(1);
}

release(type);

