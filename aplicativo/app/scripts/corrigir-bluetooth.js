// Roda automaticamente depois de "npm install" (ver "postinstall" no package.json),
// inclusive nos servidores do EAS Build.
//
// A react-native-bluetooth-classic usa a classe BuildConfig, que as versões atuais do
// Android Gradle Plugin não geram mais por padrão. Sem isto o build falha com
// "error: cannot find symbol ... BuildConfig". Aqui ligamos a geração no build.gradle dela.

const fs = require('fs');
const path = require('path');

const arquivo = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-bluetooth-classic',
  'android',
  'build.gradle',
);

const MARCA = 'buildFeatures { buildConfig = true }';
const ANCORA = 'android {';

if (!fs.existsSync(arquivo)) {
  console.log('[corrigir-bluetooth] biblioteca não instalada, nada a fazer.');
  process.exit(0);
}

const original = fs.readFileSync(arquivo, 'utf8');

if (original.includes(MARCA)) {
  console.log('[corrigir-bluetooth] já aplicado.');
  process.exit(0);
}

if (!original.includes(ANCORA)) {
  console.error('[corrigir-bluetooth] build.gradle mudou de formato; correção NÃO aplicada.');
  process.exit(1);
}

fs.writeFileSync(arquivo, original.replace(ANCORA, `${ANCORA}\n    ${MARCA}`));
console.log('[corrigir-bluetooth] buildConfig ligado em react-native-bluetooth-classic.');
