const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'US' },
  { name: 'organizationName', value: 'My Pearl Development' },
];

const pems = selfsigned.generate(attrs, {
  algorithm: 'sha256',
  days: 365,
  keySize: 2048,
});

const certDir = path.join(process.cwd(), 'certificates');

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir);
}

fs.writeFileSync(path.join(certDir, 'localhost.key'), pems.private);
fs.writeFileSync(path.join(certDir, 'localhost.crt'), pems.cert); 