import { readFileSync, writeFileSync } from 'node:fs';

const APP_CONFIG_PATH = 'app.json';
const BUILD_NUMBER_OFFSET = 100;

const rawSource = process.argv[2];
const source = Number.parseInt(rawSource ?? '', 10);

if (!Number.isFinite(source) || source <= 0) {
  console.error('Usage: node scripts/set-build-number.mjs <positive-integer>');
  process.exit(1);
}

const buildNumber = String(BUILD_NUMBER_OFFSET + source);
const config = JSON.parse(readFileSync(APP_CONFIG_PATH, 'utf8'));

config.expo = config.expo ?? {};
config.expo.ios = config.expo.ios ?? {};
config.expo.ios.buildNumber = buildNumber;

writeFileSync(APP_CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`);

console.log(`iOS buildNumber set to ${buildNumber} (source ${source})`);
