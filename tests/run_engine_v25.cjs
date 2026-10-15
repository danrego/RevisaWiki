'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
for(const name of ['run_contracts.cjs','run_integration.cjs','run_composition_options.cjs','run_quote_lexer.cjs','run_corpus_regressions.cjs']) {
    const result=spawnSync(process.execPath,[path.join(__dirname,'v25_engine',name)],{cwd:root,stdio:'inherit',env:process.env});
    if(result.status!==0)process.exit(result.status||1);
}
