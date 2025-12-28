/**
 * Script de Build de Atualização Automática
 * Smart Tech Rolândia 2.0
 * 
 * Este script:
 * 1. Lê a versão atual do package.json
 * 2. Valida se a versão mudou (não gera update se não mudou)
 * 3. Gera update-VERSAO.zip com o build final (dist/)
 * 4. Calcula tamanho do arquivo
 * 5. Atualiza update.json com versão anterior → nova versão
 * 6. Atualiza version.json
 * 7. Prepara arquivos para GitHub Pages (pasta /update)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWriteStream } from 'fs';
import archiver from 'archiver';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const copyFile = promisify(fs.copyFile);

// Configurações
const GITHUB_PAGES_BASE_URL = 'https://muinkadfy-cmd.github.io/smart-tech-update';
const UPDATE_OUTPUT_DIR = path.join(__dirname, 'update-build');
const UPDATE_DIR = path.join(__dirname, 'update'); // Pasta para GitHub Pages
const DIST_DIR = path.join(__dirname, 'dist');
const PACKAGE_JSON_PATH = path.join(__dirname, 'package.json');
const UPDATE_JSON_PATH = path.join(UPDATE_OUTPUT_DIR, 'update.json');
const VERSION_JSON_PATH = path.join(UPDATE_OUTPUT_DIR, 'version.json');

/**
 * Valida formato semver (X.Y.Z)
 */
function validateSemver(version) {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  if (!semverRegex.test(version)) {
    throw new Error(`Versão inválida: ${version}. Use formato semver (X.Y.Z)`);
  }
  return true;
}

/**
 * Compara duas versões semver
 * Retorna: 1 se v1 > v2, -1 se v1 < v2, 0 se v1 === v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}

/**
 * Lê a versão atual do package.json
 */
async function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(await readFile(PACKAGE_JSON_PATH, 'utf8'));
    const version = packageJson.version;
    validateSemver(version);
    return version;
  } catch (error) {
    console.error('❌ Erro ao ler package.json:', error.message);
    process.exit(1);
  }
}

/**
 * Lê a versão anterior do update.json (se existir)
 */
async function getPreviousVersion() {
  try {
    if (fs.existsSync(UPDATE_JSON_PATH)) {
      const updateJson = JSON.parse(await readFile(UPDATE_JSON_PATH, 'utf8'));
      return updateJson.version || null;
    }
  } catch (error) {
    // Se não conseguir ler, retorna null (primeira vez)
    console.log('ℹ️  update.json não encontrado ou inválido - primeira execução');
  }
  return null;
}

/**
 * Verifica se a versão mudou
 */
async function hasVersionChanged(newVersion) {
  const previousVersion = await getPreviousVersion();
  
  if (!previousVersion) {
    console.log('ℹ️  Primeira execução - gerando update inicial');
    return true;
  }
  
  const comparison = compareVersions(newVersion, previousVersion);
  
  if (comparison === 0) {
    console.log(`⚠️  Versão não mudou: ${newVersion}`);
    console.log('   Não será gerado novo update.');
    return false;
  }
  
  if (comparison < 0) {
    console.log(`⚠️  ATENÇÃO: Nova versão (${newVersion}) é menor que a anterior (${previousVersion})`);
    console.log('   Isso pode causar problemas. Continuando mesmo assim...');
  }
  
  return true;
}

/**
 * Cria diretórios necessários
 */
async function ensureDirectories() {
  // Criar update-build (trabalho interno)
  if (!fs.existsSync(UPDATE_OUTPUT_DIR)) {
    await mkdir(UPDATE_OUTPUT_DIR, { recursive: true });
    console.log('✅ Diretório update-build/ criado');
  }
  
  // Criar update/ (para GitHub Pages)
  if (!fs.existsSync(UPDATE_DIR)) {
    await mkdir(UPDATE_DIR, { recursive: true });
    console.log('✅ Diretório update/ criado (GitHub Pages)');
  }
}

/**
 * Verifica se o diretório dist existe
 */
async function checkDistExists() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Erro: Diretório dist/ não encontrado!');
    console.error('   Execute "npm run build" primeiro para gerar os arquivos de produção.');
    process.exit(1);
  }
}

/**
 * Copia diretório recursivamente
 */
async function copyDirectory(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src);
  
  for (const entryName of entries) {
    const srcPath = path.join(src, entryName);
    const destPath = path.join(dest, entryName);
    const entryStats = await stat(srcPath);
    
    if (entryStats.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

/**
 * Gera o arquivo update-VERSAO.zip com os arquivos necessários
 */
async function createUpdateZip(version) {
  const zipPath = path.join(UPDATE_OUTPUT_DIR, `update-${version}.zip`);
  
  // Se já existe, remover
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
    console.log('🗑️  Arquivo ZIP anterior removido');
  }
  
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Máxima compressão
    });

    output.on('close', () => {
      const sizeBytes = archive.pointer();
      const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
      const sizeKB = (sizeBytes / 1024).toFixed(2);
      console.log(`✅ ZIP criado: ${sizeMB} MB (${sizeKB} KB)`);
      resolve({ zipPath, sizeBytes });
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('⚠️  Aviso:', err.message);
      } else {
        reject(err);
      }
    });

    archive.pipe(output);

    // Adicionar todos os arquivos do diretório dist
    console.log('📦 Compactando arquivos do dist/...');
    archive.directory(DIST_DIR, 'dist', false);

    // Adicionar package.json (para atualizar versão)
    if (fs.existsSync(PACKAGE_JSON_PATH)) {
      archive.file(PACKAGE_JSON_PATH, { name: 'package.json' });
      console.log('📄 package.json incluído');
    }

    // Adicionar electron/ (importante para atualizações)
    const electronDir = path.join(__dirname, 'electron');
    if (fs.existsSync(electronDir)) {
      archive.directory(electronDir, 'electron', false);
      console.log('⚡ electron/ incluído');
    }

    archive.finalize();
  });
}

/**
 * Calcula tamanho do arquivo ZIP
 */
async function getZipSize(zipPath) {
  try {
    const stats = await stat(zipPath);
    return stats.size;
  } catch (error) {
    console.error('❌ Erro ao calcular tamanho do ZIP:', error.message);
    return 0;
  }
}

/**
 * Atualiza o arquivo version.json
 */
async function updateVersionJson(version, zipSize) {
  const versionData = {
    version: version,
    releaseDate: new Date().toISOString(),
    downloadUrl: `${GITHUB_PAGES_BASE_URL}/update-${version}.zip`,
    size: zipSize,
    checksum: null // Pode ser adicionado se necessário
  };

  const versionJsonPath = path.join(UPDATE_OUTPUT_DIR, 'version.json');
  await writeFile(versionJsonPath, JSON.stringify(versionData, null, 2), 'utf8');
  console.log('✅ version.json atualizado');
  
  return versionData;
}

/**
 * Atualiza o arquivo update.json com versão anterior → nova versão
 */
async function updateUpdateJson(newVersion, previousVersion, versionData) {
  const updateData = {
    available: true,
    version: newVersion,
    currentVersion: previousVersion || newVersion, // Versão ANTERIOR (para usuários atualizarem)
    description: `Atualização ${newVersion} do Smart Tech Rolândia 2.0`,
    date: new Date().toISOString(),
    downloadUrl: versionData.downloadUrl,
    size: versionData.size,
    changelog: [
      `Versão ${newVersion}`,
      '- Melhorias de performance',
      '- Correções de bugs',
      '- Atualizações de segurança'
    ],
    minVersion: '2.0.0', // Versão mínima necessária para atualizar
    requiresRestart: true
  };

  const updateJsonPath = path.join(UPDATE_OUTPUT_DIR, 'update.json');
  await writeFile(updateJsonPath, JSON.stringify(updateData, null, 2), 'utf8');
  console.log('✅ update.json atualizado');
  
  return updateData;
}

/**
 * Copia arquivos finais para pasta /update (GitHub Pages)
 */
async function copyToUpdateDir(version) {
  const filesToCopy = [
    { src: path.join(UPDATE_OUTPUT_DIR, `update-${version}.zip`), dest: path.join(UPDATE_DIR, `update-${version}.zip`) },
    { src: path.join(UPDATE_OUTPUT_DIR, 'version.json'), dest: path.join(UPDATE_DIR, 'version.json') },
    { src: path.join(UPDATE_OUTPUT_DIR, 'update.json'), dest: path.join(UPDATE_DIR, 'update.json') }
  ];

  for (const file of filesToCopy) {
    if (fs.existsSync(file.src)) {
      await copyFile(file.src, file.dest);
      console.log(`📋 Copiado: ${path.basename(file.dest)} → update/`);
    } else {
      console.warn(`⚠️  Arquivo não encontrado: ${file.src}`);
    }
  }
  
  console.log('✅ Arquivos copiados para update/ (pronto para GitHub Pages)');
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando build de atualização automática...\n');

  try {
    // 1. Ler versão atual do package.json
    const newVersion = await getCurrentVersion();
    console.log(`📌 Nova versão: ${newVersion}\n`);

    // 2. Validar semver
    validateSemver(newVersion);
    console.log('✅ Versão válida (semver)\n');

    // 3. Verificar se versão mudou
    const versionChanged = await hasVersionChanged(newVersion);
    if (!versionChanged) {
      console.log('\n✅ Nenhuma atualização necessária. Build cancelado.');
      process.exit(0);
    }

    // 4. Obter versão anterior
    const previousVersion = await getPreviousVersion();
    console.log(`📌 Versão anterior: ${previousVersion || 'N/A (primeira execução)'}`);
    console.log(`📌 Nova versão: ${newVersion}`);
    console.log(`📊 Mudança: ${previousVersion ? `${previousVersion} → ${newVersion}` : 'Primeira versão'}\n`);

    // 5. Verificar se dist existe
    await checkDistExists();
    console.log('✅ Diretório dist/ encontrado\n');

    // 6. Criar diretórios necessários
    await ensureDirectories();

    // 7. Criar update-VERSAO.zip
    console.log(`📦 Criando update-${newVersion}.zip...`);
    const { zipPath, sizeBytes } = await createUpdateZip(newVersion);
    const zipSize = await getZipSize(zipPath);
    console.log(`✅ ZIP criado: ${path.basename(zipPath)}`);
    console.log(`   Tamanho: ${(zipSize / 1024 / 1024).toFixed(2)} MB (${(zipSize / 1024).toFixed(2)} KB)`);
    console.log(`   Caminho: ${zipPath}\n`);

    // 8. Atualizar version.json
    console.log('📄 Atualizando version.json...');
    const versionData = await updateVersionJson(newVersion, zipSize);

    // 9. Atualizar update.json (com versão anterior → nova)
    console.log('📋 Atualizando update.json...');
    const updateData = await updateUpdateJson(newVersion, previousVersion, versionData);

    // 10. Copiar arquivos para pasta /update (GitHub Pages)
    console.log('\n📤 Copiando arquivos para update/ (GitHub Pages)...');
    await copyToUpdateDir(newVersion);

    // 11. Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('✨ Build de atualização concluído com sucesso!');
    console.log('='.repeat(60));
    console.log(`\n📊 Resumo:`);
    console.log(`   Versão anterior: ${previousVersion || 'N/A'}`);
    console.log(`   Nova versão: ${newVersion}`);
    console.log(`   Arquivo ZIP: update-${newVersion}.zip`);
    console.log(`   Tamanho: ${(zipSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\n📁 Arquivos gerados:`);
    console.log(`   - update-build/update-${newVersion}.zip`);
    console.log(`   - update-build/version.json`);
    console.log(`   - update-build/update.json`);
    console.log(`\n📁 Arquivos para GitHub Pages (update/):`);
    console.log(`   - update/update-${newVersion}.zip`);
    console.log(`   - update/version.json`);
    console.log(`   - update/update.json`);
    console.log(`\n🌐 URLs GitHub Pages:`);
    console.log(`   - ${GITHUB_PAGES_BASE_URL}/update-${newVersion}.zip`);
    console.log(`   - ${GITHUB_PAGES_BASE_URL}/version.json`);
    console.log(`   - ${GITHUB_PAGES_BASE_URL}/update.json`);
    console.log(`\n📤 Próximos passos:`);
    console.log(`   1. Faça commit da pasta update/ no repositório GitHub`);
    console.log(`   2. Os arquivos estarão disponíveis via GitHub Pages`);
    console.log(`   3. O sistema verificará automaticamente atualizações`);
    console.log('\n✅ Sistema pronto para distribuição!\n');

  } catch (error) {
    console.error('\n❌ Erro durante o build:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Executar
main();
