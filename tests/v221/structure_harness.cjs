'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function loadStructureUnit() {
  const root = path.resolve(__dirname, '../..');
  const baseline = fs.readFileSync(path.join(root, 'dist/2.20.0/RevisaWiki_v2_20_0_completo.js'), 'utf8');
  const helper = fs.readFileSync(path.join(root, 'src/v2_21/structure_repairs.js'), 'utf8');
  const anchor = '    const api = {';
  assert.equal(baseline.split(anchor).length, 2);
  const names = ['v221StructurePlan', 'v221StructureProof', 'v221LinkEmphasisBoundarySafe',
    'v221StructureExternalRequests', 'v221StructureResponsiveStyle'];
  const text = baseline.replace(anchor, helper + '\n' + anchor + names.join(',') + ',');
  const context = {module: {exports: {}}, exports: {}, console, URL, TextEncoder, TextDecoder,
    performance, setTimeout, clearTimeout, setInterval, clearInterval};
  vm.runInNewContext(text, context, {timeout: 15000});
  return context.module.exports;
}
module.exports = {loadStructureUnit};
