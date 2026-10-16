'use strict';
const path=require('node:path'),{spawnSync}=require('node:child_process'),candidate=require('./candidate.cjs');
candidate.verify();
for(const file of ['verify_inherited.cjs','run_startup.cjs','test_no_section_buttons.cjs','run_focus.cjs','run_quote_boundaries.cjs','test_quotes.cjs','run_tag_adversarial.cjs','test_safe_automation.cjs','test_diff_reporting.cjs','test_chat_residues.cjs','test_chat_permutations.cjs','test_chemical_syntax.cjs','test_chemical_guards.cjs','test_table_syntax.cjs','test_table_guards.cjs','test_marriage_syntax.cjs','test_marriage_guards.cjs','test_biography_fields.cjs','test_biography_dates.cjs','test_multiple_marriages.cjs','test_biography_composition.cjs','test_citation_families.cjs','test_historical_citations.cjs','test_birth_categories.cjs','test_reference_repairs.cjs','test_table_repairs.cjs','test_identifier_urls.cjs','run_engine.cjs','summarize.cjs']){
 const result=spawnSync(process.execPath,[path.join(__dirname,file)],{cwd:candidate.root,env:process.env,stdio:'inherit'});
 if(result.status!==0){process.exitCode=result.status||1;break;}
}
