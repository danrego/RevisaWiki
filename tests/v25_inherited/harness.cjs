'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, path.basename(__dirname)==='artifacts'?'../../..':'../..');
const expectedVersion = process.env.REVISAWIKI_EXPECTED_VERSION || '2.5.0';
const fileVersion = process.env.REVISAWIKI_FILE_VERSION || 'v2_5';
const outDir = path.resolve(root, process.env.REVISAWIKI_OUTDIR || 'dist/2.5.0');
const apiPath = path.resolve(process.env.REVISAWIKI_SCRIPT || path.join(outDir, 'RevisaWiki_' + fileVersion + '_completo.js'));
const api = require(apiPath);
if (api.version !== expectedVersion) throw new Error('Wrong QA target: expected ' + expectedVersion + ', found ' + api.version + ' at ' + apiPath);
const sha256 = require('node:crypto').createHash('sha256').update(fs.readFileSync(apiPath)).digest('hex');
function output(stem, extension) { return path.join(outDir, stem + '_' + fileVersion + '.' + extension); }
module.exports = {root, expectedVersion, fileVersion, outDir, apiPath, api, sha256, output};
