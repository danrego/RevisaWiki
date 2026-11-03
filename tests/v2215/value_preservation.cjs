'use strict';
// The original inherited contract remains unchanged; only the tested release is selected.
const path=require('node:path');
process.env.REVISAWIKI_CURRENT_CORE ||= path.resolve(process.argv[2]||path.join(__dirname,'../../dist/2.21.5/RevisaWiki_v2_21_5.js'));
require('../v2214/value_preservation.cjs');
