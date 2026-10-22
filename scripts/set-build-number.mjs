import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const BUILD_NUMBER_OFFSET = 100;

const rawSource = process.argv[2];
const source = Number.parseInt(rawSource ?? '', 10);

if (!Number.isFinite(source) || source <= 0) {
  console.error('Usage: node scripts/set-build-number.mjs <positive-integer>');
  process.exit(1);
}

const buildNumber = String(BUILD_NUMBER_OFFSET + source);

// This project uses app.config.ts (Expo) instead of app.json.
const appConfigPath = 'app.config.ts';
if (existsSync(appConfigPath)) {
  const sourceText = readFileSync(appConfigPath, 'utf8');
  const pattern = /(buildNumber:\s*["'])([^"']*)(["'])/;
  if (!pattern.test(sourceText)) {
    console.error(`Could not find buildNumber in ${appConfigPath}`);
    process.exit(1);
  }
  const nextText = sourceText.replace(pattern, `$1${buildNumber}$3`);
  writeFileSync(appConfigPath, nextText);
  console.log(`iOS buildNumber set to ${buildNumber} (source ${source}) in ${appConfigPath}`);
  process.exit(0);
}

// Fallback for projects that use app.json.
const appJsonPath = 'app.json';
const config = JSON.parse(readFileSync(appJsonPath, 'utf8'));
config.expo = config.expo ?? {};
config.expo.ios = config.expo.ios ?? {};
config.expo.ios.buildNumber = buildNumber;
writeFileSync(appJsonPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`iOS buildNumber set to ${buildNumber} (source ${source}) in ${appJsonPath}`);