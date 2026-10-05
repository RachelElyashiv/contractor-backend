// Proves CLOUDINARY_URL is parsed, wins over the three separate variables, and
// that a malformed one cannot stop the server from booting.
// Each case runs in its own process because the SDK caches its config.
const { execFileSync } = require('child_process');

const cases = [
  {
    name: 'CLOUDINARY_URL alone is parsed into all three values',
    env: { CLOUDINARY_URL: 'cloudinary://111122223333444:abcdefghijklmnopqrstuvwxyz1@my-cloud' },
    expect: { source: 'CLOUDINARY_URL', cloudName: 'my-cloud', apiKeyTail: '3444', apiSecretLength: 27 },
  },
  {
    name: 'CLOUDINARY_URL wins over stale separate variables',
    env: {
      CLOUDINARY_URL: 'cloudinary://111122223333444:abcdefghijklmnopqrstuvwxyz1@my-cloud',
      CLOUDINARY_CLOUD_NAME: 'w7iyyqos',
      CLOUDINARY_API_KEY: '999999999999947',
      CLOUDINARY_API_SECRET: 'wrongwrongwrongwrongwrong12',
    },
    expect: { source: 'CLOUDINARY_URL', cloudName: 'my-cloud', apiKeyTail: '3444', apiSecretLength: 27 },
  },
  {
    name: 'without CLOUDINARY_URL the separate variables still work',
    env: {
      CLOUDINARY_CLOUD_NAME: 'other-cloud',
      CLOUDINARY_API_KEY: '555566667777888',
      CLOUDINARY_API_SECRET: 'zyxwvutsrqponmlkjihgfedcba9',
    },
    expect: { source: 'separate-variables', cloudName: 'other-cloud', apiKeyTail: '7888', apiSecretLength: 27 },
  },
  {
    name: 'a malformed CLOUDINARY_URL is reported, not thrown',
    env: { CLOUDINARY_URL: 'https://oops' },
    expect: { source: 'CLOUDINARY_URL_INVALID' },
  },
  {
    name: 'no credentials at all is reported cleanly',
    env: {},
    expect: { source: 'separate-variables', cloudName: null },
  },
  {
    name: 'a line pasted straight from the dashboard, name and all, still works',
    env: { CLOUDINARY_URL: 'CLOUDINARY_URL=cloudinary://111122223333444:abcdefghijklmnopqrstuvwxyz1@my-cloud' },
    expect: { source: 'CLOUDINARY_URL', cloudName: 'my-cloud', apiKeyTail: '3444', apiSecretLength: 27 },
  },
  {
    name: 'an exported shell line works too',
    env: { CLOUDINARY_URL: 'export CLOUDINARY_URL="cloudinary://111122223333444:abcdefghijklmnopqrstuvwxyz1@my-cloud"' },
    expect: { source: 'CLOUDINARY_URL', cloudName: 'my-cloud', apiKeyTail: '3444', apiSecretLength: 27 },
  },
  {
    name: 'a url pasted with quotes and spaces is cleaned up, not rejected',
    env: { CLOUDINARY_URL: '  "cloudinary://111122223333444:abcdefghijklmnopqrstuvwxyz1@my-cloud"  ' },
    expect: { source: 'CLOUDINARY_URL', cloudName: 'my-cloud', apiKeyTail: '3444', apiSecretLength: 27 },
  },
];

const probe = `
const { UploadsHealthController, cloudinarySource } = require('./dist/photos/photos.module');
const cloudinary = require('cloudinary').v2;
const cfg = cloudinary.config();
console.log(JSON.stringify({
  source: cloudinarySource(),
  cloudName: cfg.cloud_name || null,
  apiKeyTail: cfg.api_key ? String(cfg.api_key).slice(-4) : null,
  apiSecretLength: cfg.api_secret ? String(cfg.api_secret).length : 0,
  secure: cfg.secure === true,
}));
`;

let failed = 0;
for (const c of cases) {
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, ...c.env };
  let got;
  try {
    got = JSON.parse(execFileSync(process.execPath, ['-e', probe], { env, cwd: __dirname + '/..' }).toString());
  } catch (e) {
    console.log(`FAIL  ${c.name}\n        process died: ${e.message.split('\n')[0]}`);
    failed++;
    continue;
  }
  const bad = Object.entries(c.expect).filter(([k, v]) => got[k] !== v);
  if (bad.length) {
    console.log(`FAIL  ${c.name}\n        got ${JSON.stringify(got)}`);
    failed++;
  } else {
    console.log(`PASS  ${c.name}\n        ${JSON.stringify(got)}`);
  }
}

console.log(`\n${cases.length - failed}/${cases.length} checks passed`);
process.exit(failed ? 1 : 0);
