'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),args=process.argv.slice(2),files=args.filter(x=>!x.startsWith('--')).map(x=>path.resolve(x)),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const report={kind:'finite-image-and-official-site-translation-safety',status:'passed',runnerSha256:sha(fs.readFileSync(__filename)),
    helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/translation_safety.js'))),bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(x,m)=>{report.checks++;assert.ok(x,m);};
function test(bundle,id,fn){try{const evidence=fn();report.cases.push({...evidence,bundle,id,status:'passed'});}catch(e){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:e.message});}}
for(const file of files){
    const bytes=fs.readFileSync(file),api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeVersion:api.version,runtimeSha256:sha(bytes),bytes:bytes.length,helperPreview:false});
    for(const name of ['v219ImageAliasContract','v219NativeImageOption','v219TranslatedImageOption','v219OfficialSiteFields','v219OfficialSiteCall',
        'v219ForeignTemplateContract','v219ForeignTemplateIdentity','v219TranslationProfile','v219NumberedCitationRole','v219NumberedCitationAccepts',
        'v219LocalCitationRedirectProfile','v219LocalCitationRedirectIdentity','v219LocalCitationRedirectCall','v219NativeMixedParameterRefusal'])
        assert.equal(typeof api[name],'function','The actual production bundle exports '+name);
    const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
        authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,
        registryDoiCheck:false,referenceColumns:false,externalLinkColumns:false,endMatterColumns:false},
        calculate=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),imageOptions=api.translationRules.imageOptions;
    test(bundle,'all-image-alias-arity-accounting',()=>{
        eq(Object.keys(imageOptions).length,519,'All 519 recorded image aliases are examined');
        const refused=Object.entries(imageOptions).filter(([alias,rule])=>!api.v219ImageAliasContract(alias,rule));
        eq(refused.map(([alias])=>alias),['替代文字'],'The single malformed placeholder-arity mapping is refused');
    });
    for(const [alias,rule]of Object.entries(imageOptions)){
        const key=sha(alias).slice(0,16),valid=api.v219ImageAliasContract(alias,rule),parameterized=alias.includes('$1');
        const values=parameterized?(rule.kind==='img_width'?['120','120x80','x80']:['Valor literal','$&','$1','$$',"$`","$'",'文字 literal','']):[''];
        for(const value of values)test(bundle,'image-alias-'+key+'-'+sha(value).slice(0,10),()=>{
            const raw=parameterized?alias.replace('$1',()=>value):alias,
                expected=valid&&!(parameterized&&value===''&&/[ \t]\$1$/.test(alias))?api.v219NativeImageOption(raw)?raw:parameterized?rule.target.replace('$1',()=>value):rule.target:null;
            eq(api.v219TranslatedImageOption(alias,rule,raw),expected,'A value-bound alias copies the literal payload without replacement-string expansion');
            if(expected!==null){eq(api.v219TranslatedImageOption(alias,rule,'  '+raw+' '),'  '+expected+' ','Outer scalar padding is retained');}
            const source='[[File:Figura fictícia.svg|'+raw+'|Legenda literal.]]',first=calculate(source),second=calculate(first.text);
            eq(second.text,first.text,'The complete image transaction is stable after one action');
            if(!valid)ok(first.text.includes('|'+raw+'|'),'An invalid catalog mapping does not consume or rewrite the original scalar option');
            else if(parameterized&&value)ok(first.text.includes(value),'The real production action retains the exact literal option payload');
            if(valid&&api.v219NativeImageOption(raw))ok(first.text.includes('|'+raw+'|'),'Already accepted native image-option spellings remain unchanged in the real action');
            eq(first.text,source,'An accepted native File namespace does not prove that foreign option-like caption text is imported syntax');
            return {evidenceKind:'native-media-complete-source-preservation-with-separate-scalar-contract',runtimeSha256:sha(bytes),sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(cfg)),expectedEndpointSha256:sha(source),actualEndpointSha256:sha(first.text),appliedRuleIds:first.changes.map(change=>change.id),scenarioSha256:sha(JSON.stringify({sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(cfg)),expectedEndpointSha256:sha(source),action:'adjust'}))};
        });
    }
    for(const rule of [null,{}, {target:'alt=$1',kind:'img_alt'},{target:'$1',kind:'img_alt'},
        {target:'alt=$1$1',kind:'img_alt'},{target:'alt=$2',kind:'img_alt'},{target:'alt=$1',kind:'constructor'},
        {target:'alt=$1',kind:'img_width'},{target:'alt=$1',kind:'__proto__'}])test(bundle,'invalid-rule-'+sha(JSON.stringify(rule)).slice(0,14),()=>{
        eq(api.v219ImageAliasContract('palavra',rule),false,'Malformed, mismatched and inherited-property catalog entries cannot define a translation');
        eq(api.v219TranslatedImageOption('palavra',rule,'palavra'),null,'A refused contract has no replacement endpoint');
    });
    for(const value of ['texto','100%','1.5','10 20','120x','x','-100','120px','constructor'])test(bundle,'unproved-width-'+value,()=>{
        eq(api.v219TranslatedImageOption('$1px',{target:'$1px',kind:'img_width'},value+'px'),null,'Unproved width text is preserved as text, not guessed as a dimension');
    });
    test(bundle,'refused-scalar-remains-caption-obligation',()=>{
        const before='[[File:Figura fictícia.svg|thumb|替代文字]]',changed='[[File:Figura fictícia.svg|thumb|alt=$1]]';
        ok(api.preservationAudit(before,changed,cfg).length,'The malformed bare alias remains a caption/prose obligation in the independent guard');
        // Image-caption loss is an independent preservation obligation. The structural
        // composition check does not duplicate the prose-preservation inventory.
        const first=calculate(before);ok(first.text.includes('|替代文字]]'),'The production transaction preserves the complete caption');
    });
    for(const [alias,target]of [['Cite web','Citar web'],['Cite news','Citar jornal'],['Cite book','Citar livro'],['Cite journal','Citar periódico'],['Cite magazine','Citar revista']])for(const prefix of ['', 'Template:', 'Predefinição:'])for(const fields of [
        'title=Fonte fictícia|last2=Sobrenome literal','título=Fonte fictícia|autor=Nome literal',
        'title=Fonte fictícia|título=|last2=Sobrenome literal|first2=Nome literal',
        'título=Fonte fictícia|campo-desconhecido=Valor literal|1=Valor posicional',
        'title=Fonte fictícia|url=https://example.org/?a=1&b=2|pontofinal=|ref=',
        'title=Fonte fictícia|last2= Sobrenome <!--comentário literal--> |first2=Nome literal'
    ])test(bundle,'native-local-redirect-'+sha(prefix+alias+fields).slice(0,20),()=>{
        const source='{{'+prefix+alias+'|'+fields+'}}',expected='{{'+target+'|'+fields+'}}',profile=api.v219LocalCitationRedirectProfile(source),
            migration=api.v219LocalCitationRedirectCall(source,cfg,profile);
        ok(profile&&profile.v219LocalCitationRedirect===true,'The exact local alias receives its own pinned native-interface profile');
        eq(profile.target,target,'An unrelated foreign same-title profile cannot choose a different citation family');
        ok(api.v219LocalCitationRedirectIdentity(source,profile),'The exact original alias and chosen native family share the proved local interface');
        eq(migration.text,expected,'The local redirect migration changes only the header and preserves all argument bytes');
        const result=calculate(source);eq(result.text,calculate(expected).text,'The complete action reaches the same native interface in one transaction');
        eq(calculate(result.text).text,result.text,'The local header repair leaves no delayed second-click mutation');
    });
    for(const [alias,target]of [['Cite web','Citar web'],['Cite news','Citar jornal'],['Cite book','Citar livro'],['Cite journal','Citar periódico'],['Cite magazine','Citar revista']])for(const prefix of ['', 'Template:', 'Predefinição:'])for(const [key,value]of [['editor-último','Nome literal'],['editor-primeiro','Nome literal'],['capitulo-url','https://example.org/'],['auteur','Nome literal'],['pág','5']])test(bundle,'local-key-optout-'+sha(prefix+alias+key).slice(0,20),()=>{
        const source='{{'+prefix+alias+'|title=Fonte fictícia|'+key+'='+value+'}}',expected='{{'+target+'|title=Fonte fictícia|'+key+'='+value+'}}',options={automaticParameterNames:false},result=calculate(source,options);
        eq(result.text,expected,'Disabling native key adaptation still permits only the proved local header rename');
        eq(calculate(result.text,options).text,result.text,'The canonical native call cannot bypass the option on another click');
    });
    for(const source of ['{{Citar jornal|editor-último=Nome literal}}','{{Citar web|capitulo-url=https://example.org/}}','{{Info/Biografia|birth_date=5 de março de 2001}}'])test(bundle,'native-mixed-optout-'+sha(source).slice(0,20),()=>{
        eq(calculate(source,{automaticParameterNames:false}).text,source,'An existing native citation or infobox respects the invalid-key option');
    });
    test(bundle,'native-date-value-independent-of-key-optout',()=>{
        const source='{{Info/Biografia|nascimento_data=5 de março de 2001}}',expected='{{Info/Biografia|nascimento_data={{DataExt|5|3|2001}}}}',result=calculate(source,{automaticParameterNames:false});
        eq(result.text,expected,'Disabling parameter-name correction does not disable a separately enabled complete native date-value repair');
        eq(calculate(result.text,{automaticParameterNames:false}).text,result.text,'The independent native date-value repair is stable');
    });
    for(const source of [
        '{{London Gazette|issue=12345|data=5 de março de 2001|página=5}}',
        '{{Webarchive|url=https://web.archive.org/web/20010305000000/https://example.org/|data=2001-03-05|título=Fonte fictícia}}',
        '{{Webarchive|url=https://web.archive.org/web/20010305000000/https://example.org/|data1=2001-03-05}}',
        '{{wayb|url=https://example.org/|data=2001}}','{{Referência múltipla|página=5}}'
    ])test(bundle,'specialized-native-boundary-'+sha(source).slice(0,20),()=>{
        const result=calculate(source);
        eq(result.text,source,'A proved accepted native alias or confirmed missing template is preserved without an invented replacement');
        eq(calculate(result.text).text,result.text,'The specialized preservation boundary is stable');
    });
    for(const [sourceKey,targetKey]of [['auteur','autor'],['langue','língua'],['redaktör','editor']])for(const prefix of ['', 'Template:', 'Predefinição:'])test(bundle,'local-redirect-mixed-'+prefix+sourceKey,()=>{
        const value=sourceKey==='langue'?'en':'Nome literal',source='{{'+prefix+'Cite web|title=Fonte fictícia|last2=Sobrenome literal|'+sourceKey+'='+value+'}}',
            expected='{{Citar web|title=Fonte fictícia|last2=Sobrenome literal|'+targetKey+'='+value+'}}',
            result=calculate(source);
        eq(result.text,calculate(expected).text,'The existing safe native mixed-field migration composes with the local header in one action');
        ok(result.text.includes('|title=Fonte fictícia|last2=Sobrenome literal|'),'Already accepted native fields retain their original exact spellings');
        eq(calculate(result.text).text,result.text,'No mixed-language field is delayed until a second action');
        eq(api.preservationAudit(source,result.text,cfg),[],'The local native continuation retains metadata identities');
    });
    for(const [sourceKey,targetKey]of [['auteur','autor'],['langue','língua'],['redaktör','editor']])for(const value of ['', 'Outro valor'])test(bundle,'local-redirect-mixed-collision-'+sourceKey+'-'+sha(value).slice(0,8),()=>{
        const source='{{Cite web|title=Fonte fictícia|'+sourceKey+'='+(sourceKey==='langue'?'en':'Nome literal')+'|'+targetKey+'='+value+'}}',
            expected='{{Citar web'+source.slice('{{Cite web'.length),result=calculate(source);
        eq(result.text,expected,'The independently pinned local redirect permits only the header rename while the competing field or blank prevents mixed-field adaptation');
        eq(result.text.slice(result.text.indexOf('|')),source.slice(source.indexOf('|')),'Every original argument, order and explicit blank remains exact');
        eq(calculate(result.text).text,result.text,'The header migration and refused field adaptation are stable in one action');
        eq(api.preservationAudit(source,result.text,cfg),[],'Header-only forwarding retains the same native field interface');
        eq(api.safeComposition(source,result.text,cfg),'','The field-collision refusal composes with exact native header forwarding');
    });
    for(const name of ['Citar web','Citar jornal','Citar livro','Citar periódico','Citar revista'])test(bundle,'native-accepted-aliases-'+name,()=>{
        const source='{{'+name+'|title=Fonte fictícia|last2=Sobrenome literal|first2=Nome literal}}';
        eq(calculate(source).text,source,'Already accepted native parameter aliases are not cosmetically translated');
    });
    for(const raw of ['superiordireito=','upright=','página=','page=','alt=','link='])test(bundle,'native-empty-image-'+raw,()=>{
        ok(api.v219NativeImageOption(raw),'The pinned native option spelling is recognized without inventing a missing value');
        const source='[[File:Figura fictícia.svg|'+raw+'|Legenda literal.]]';
        ok(calculate(source).text.includes('|'+raw+'|'),'The complete image formatter preserves the original native scalar and its empty value');
    });
    const pairs=[
        ['{{Official website|https://example.org/|Rótulo literal}}','{{Oficial|https://example.org/|Rótulo literal}}'],
        ['{{Official website|name=Rótulo literal|https://example.org/}}','{{Oficial|name=Rótulo literal|https://example.org/}}'],
        ['{{Official website|2=Rótulo literal|1=https://example.org/}}','{{Oficial|2=Rótulo literal|1=https://example.org/}}'],
        ['{{Official website|URL=https://example.org/|name=Rótulo literal}}','{{Oficial|URL=https://example.org/|name=Rótulo literal}}'],
        ['{{Official website|url=https://example.org/?a=1&b=2|name=A=B}}','{{Oficial|url=https://example.org/?a=1&b=2|name=A=B}}'],
        ['{{Official website|https://example.org/}}','{{Oficial|https://example.org/}}'],
        ['{{Site officiel|https://example.org/|titre=Rótulo literal}}','{{Oficial|1=https://example.org/|nome=Rótulo literal}}'],
        ['{{Site officiel|en|https://example.org/|titre=Rótulo literal}}','{{Oficial|1=https://example.org/|nome=Rótulo literal|2=en}}'],
        ['{{Site officiel|1=en|2=https://example.org/|title=Rótulo literal}}','{{Oficial|1=https://example.org/|nome=Rótulo literal|2=en}}'],
        ['{{Site officiel|2=https://example.org/|titre=Rótulo literal}}','{{Oficial|1=https://example.org/|nome=Rótulo literal}}'],
        ['{{Site officiel|url=https://example.org/|langue=fr|titre=Rótulo literal}}','{{Oficial|1=https://example.org/|nome=Rótulo literal|2=fr}}'],
        ['{{Site officiel|url=https://example.org/|lang=pt-BR|title=Rótulo literal}}','{{Oficial|1=https://example.org/|nome=Rótulo literal|2=pt-BR}}']
    ];
    for(const [before,after]of pairs)test(bundle,'official-roles-'+sha(before).slice(0,16),()=>{
        const call=api.v219OfficialSiteCall(before,cfg);ok(call&&!call.blocked,'The exact language-specific role pattern is proved');
        eq(call.text,after,'The URL, label and optional language retain their separate native roles');
        const result=calculate(before),expected=calculate(after);eq(result.text,expected.text,'The real production action reaches the exact native endpoint');
        eq(calculate(result.text).text,result.text,'The complete migration has no delayed second action');
        eq(result.preservation||[],[],'No source URL, label or language obligation is lost');
        eq(api.preservationAudit(before,result.text,cfg),[],'The separate preservation audit agrees');
        eq(api.safeComposition(before,result.text,cfg),'','The production endpoint composes with the complete source');
    });
    for(const source of [
        '{{Official website}}','{{Official website|name=Nome}}','{{Official website|Q123}}','{{Official website|{{Url fictícia}}}}',
        '{{Official website|https://example.org/|Rótulo|Terceiro}}','{{Official website|1=https://example.org/|url=https://example.org/}}',
        '{{Official website|https://example.org/|2=Rótulo|name=Outro}}','{{Official website|1=https://example.org/|https://example.org/}}',
        '{{Official website|https://example.org/|titre=Rótulo}}','{{Official website|https://example.org/|name=}}',
        '{{Site officiel|https://example.org/|Rótulo literal}}','{{Site officiel|en|https://example.org/|lang=fr}}',
        '{{Site officiel|https://example.org/|titre=Rótulo|title=Outro}}','{{Site officiel|url=https://example.org/|2=https://example.org/}}',
        '{{Site officiel|url=https://example.org/|lang=zz}}','{{Site officiel|wikidata=Q123}}','{{Site officiel|url=javascript:alert(1)}}',
        '{{Site officiel|url=https://example.org/|nocaturl=1}}','{{Official website|1=https://example.org/|name=[[Tema|Rótulo]]}}'
    ])test(bundle,'unproved-official-'+sha(source).slice(0,16),()=>{
        const call=api.v219OfficialSiteCall(source,cfg);
        // Official website46302697 is a LOCAL redirect to Oficial70230751.
        // Redirect forwarding preserves unknown/blank/dynamic arguments verbatim.
        if(source.startsWith('{{Official website')){
            const expected=source.replace('{{Official website','{{Oficial');
            ok(call&&!call.blocked&&call.profile.source.language==='pt'&&call.profile.source.oldid===46302697,'Exact local native identity has priority over the foreign role classifier');
            eq(call.text,expected,'Only the exact local redirect header changes; every raw argument is retained');
            const result=calculate(source);eq(result.text,expected,'The full native action preserves supplied unknown and conflicting arguments');
            eq(result.preservation||[],[],'The independent local forwarding action has no retention finding');
            eq(calculate(expected).text,expected,'Native argument preservation finishes in one action');
            return;
        }
        ok(call&&call.blocked,'Dynamic, unknown, conflicting and positional role guesses are refused');
        eq(call.text,source,'Every original field remains intact after refusal');
    });
    for(const [language,source]of [['en','{{Official website|https://example.org/|Rótulo literal}}'],['fr','{{Site officiel|en|https://example.org/|titre=Rótulo literal}}']]){
        for(const [label,wrap]of [['nowiki',s=>'<nowiki>'+s+'</nowiki>'],['code',s=>'<code>'+s+'</code>'],['comment',s=>'<!--'+s+'-->'],
            ['straight',s=>'"'+s+'"'],['italic',s=>"''"+s+"''"],['quotation',s=>'{{Quotation|'+s+'}}']])test(bundle,'official-protected-'+language+'-'+label,()=>{
            const literal=wrap(source);eq(calculate(literal).text,literal,'A newly reachable conversion never rewrites a literal quoted example');
        });
    }
    for(const extra of [{multilingual:false},{auxiliaryTemplates:false}])test(bundle,'official-option-'+sha(JSON.stringify(extra)).slice(0,10),()=>{
        const source=pairs[0][0],call=api.v219OfficialSiteCall(source,{...cfg,...extra});
        ok(call&&call.blocked&&call.converted===false&&call.quietNativeRefusal===true,'The disabled migration returns an explicit local-interface refusal to prevent foreign fallback');
        eq(call.text,source,'The disabled local migration retains all supplied bytes');
        eq(calculate(source,extra).text,source,'The disabled native migration performs no whole-article edit');
    });
    const prefixed=[
        ['шаблон:Примітки','group=nota','{{Referências|grupo=nota|nível=0}}','uk'],
        ['Шаблон:примітки','group=nota','{{Referências|grupo=nota|nível=0}}','uk'],
        ['template:Примітки','group=nota','{{Referências|grupo=nota|nível=0}}','uk'],
        ['format:Reflist','group=nota','{{Referências|grupo=nota|nível=0}}','ro'],
        ['Format:reflist','group=nota','{{Referências|grupo=nota|nível=0}}','ro'],
        ['skabelon:Cite news','title=Fonte fictícia|url=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','da'],
        ['Skabelon:cite news','title=Fonte fictícia|url=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','da'],
        ['Kilde nyheder','title=Fonte fictícia|url=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','da'],
        ['kilde nyheder','title=Fonte fictícia|url=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','da'],
        ['skabelon:Kilde nyheder','title=Fonte fictícia|url=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','da'],
        ['template:Kilde nyheder','title=Fonte fictícia|url=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','da'],
        ['استشهاد بخبر','عنوان=Fonte fictícia|مسار=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','ar'],
        ['قالب:استشهاد بخبر','عنوان=Fonte fictícia|مسار=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','ar'],
        ['template:استشهاد بخبر','عنوان=Fonte fictícia|مسار=https://example.org/','{{Citar jornal|título=Fonte fictícia|url=https://example.org/}}','ar'],
        ['قالب:استشهاد بدورية','عنوان=Fonte fictícia|مسار=https://example.org/','{{Citar periódico|título=Fonte fictícia|url=https://example.org/}}','ar'],
        ['template:استشهاد بدورية','عنوان=Fonte fictícia|مسار=https://example.org/','{{Citar periódico|título=Fonte fictícia|url=https://example.org/}}','ar'],
        ['قالب:استشهاد ويب','عنوان=Fonte fictícia|مسار=https://example.org/','{{Citar web|título=Fonte fictícia|url=https://example.org/}}','ar'],
        ['template:استشهاد ويب','عنوان=Fonte fictícia|مسار=https://example.org/','{{Citar web|título=Fonte fictícia|url=https://example.org/}}','ar']
    ];
    for(const [name,fields,expected,language]of prefixed)test(bundle,'finite-prefix-'+sha(name).slice(0,16),()=>{
        const source='{{'+name+'|'+fields+'}}',proof=api.v219ForeignTemplateContract(source);ok(proof,'The exact foreign namespace alias has a pinned contract');
        eq(proof.contract.language,language,'The explicit namespace alias retains its own verified language');
        ok(api.v215LiteralTemplateIdentity(source),'The canonical production identity gate reaches the finite alias');
        const migration=api.migrateForeignTemplate(source,cfg);ok(migration&&!migration.blocked,'The declared migration is executable');
        eq(migration.profile.source.language,language,'Field scoring cannot silently select another same-title language');
        eq(migration.text,expected,'The finite alias reaches its native formatter');
        const result=calculate(source);eq(result.text,calculate(expected).text,'The real article transaction reaches the expected native endpoint');
        eq(calculate(result.text).text,result.text,'The complete route is idempotent');
        eq(api.preservationAudit(source,result.text,cfg),[],'The independent preservation guard accepts the exact route');
        eq(api.safeComposition(source,result.text,cfg),'','The complete article composition remains proved');
        for(const wrap of [s=>'<nowiki>'+s+'</nowiki>',s=>'"'+s+'"',s=>"''"+s+"''",s=>'{{Quotation|'+s+'}}']){
            const literal=wrap(source);eq(calculate(literal).text,literal,'Literal examples are never newly reachable executable calls');
        }
        eq(calculate(source,{multilingual:false}).text,source,'The multilingual feature switch remains authoritative');
    });
    for(const name of ['шаблон:ПРИМІТКИ','format:REFLIST','skabelon:Cite NEWS','Kilde Nyheder','skabelon:Kilde Nyheder','skabelon:Unknown alias',
        'template:{{Nome fictício}}','subst:шаблон:Примітки','raw:format:Reflist','xx:Примітки','قالب:استشهاد مجهول'])test(bundle,'unproved-prefix-'+sha(name).slice(0,16),()=>{
        eq(api.v219ForeignTemplateContract('{{'+name+'}}'),null,'The bounded namespace adapter does not accept unrelated titles or fabricated capitalization');
    });
    const newspaper=api.templateCatalog['citar jornal'];
    // Local Cita noticia50501995 redirects to Citar jornal55834874 and forwards
    // native arguments. It cannot acquire a same-spelled Spanish interface.
    // The independently proved invalid enlaceeditorN key repair remains separate.
    for(const index of [1,2,3,7,10,42,99])for(const [key,target,companion]of [
        ['autor','autor',''],['apellido','último',''],['apellidos','último',''],
        ['nombre','primeiro','|autor'+index+'=Sobrenome literal'],
        ['enlaceautor','autorlink','|autor'+index+'=Sobrenome literal'],
        ['editor','editor',''],['enlaceeditor','editorlink','|editor'+index+'=Editor literal']
    ])test(bundle,'numbered-news-'+key+'-'+index,()=>{
        const fields='título=Fonte fictícia|url=https://example.org/|'+key+index+'=Valor literal'+companion,
            source='{{Cita noticia|'+fields+'}}',native='{{Citar jornal|'+fields+'}}',
            expected='{{Citar jornal|'+(key==='enlaceeditor'?fields.replace('enlaceeditor'+index+'=','editor-link'+index+'='):fields)+'}}',
            profile=api.v219LocalCitationRedirectProfile(source),migration=api.migrateForeignTemplate(source,cfg);
        ok(profile&&profile.nativeAliasOldid===50501995&&profile.nativeTemplateOldid===55834874,'The exact local native forwarding source controls the interface');
        ok(migration&&!migration.blocked,'The exact local redirect remains executable');
        eq(migration.profile.source.language,'pt','The native invocation does not acquire a foreign same-name field consumer');
        eq(migration.text,native,'The redirect itself preserves every argument byte and changes only its header');
        const result=calculate(source);eq(result.text,expected,'Only a separately contracted invalid native editor-link key may compose with the local header forward');
        eq(calculate(result.text).text,expected,'No foreign field activation is delayed until a second action');
        eq(result.preservation||[],[],'The completed result has no hidden preservation failure');
        eq(api.preservationAudit(source,result.text,cfg),[],'The independent citation inventory retains the native argument interface');
        eq(api.safeComposition(source,result.text,cfg),'','The complete action remains source-bound');
        return {evidenceKind:'pinned-local-native-redirect-interface-priority',sourceSha256:sha(source),optionsSha256:sha(JSON.stringify(cfg)),expectedEndpointSha256:sha(expected),actualEndpointSha256:sha(result.text),appliedIds:(result.changes||[]).filter(row=>row.count>0).map(row=>row.id),scenarioSha256:sha(JSON.stringify([sha(source),sha(JSON.stringify(cfg)),sha(expected)]))};
    });
    for(const fields of ['autor1=Nome|apellido1=Outro','autor1=Nome|apellido1=',
        'autor1=Nome|autor=Outro','autor1=Nome|last1=Outro','autor1=Nome|author1-last=Outro',
        'enlaceautor1=Nome|author-link1=Outro','editor1=Nome|editor-sobrenome1=Outro',
        'enlaceeditor1=Nome|editor-link1=Outro','autor1=Nome|autores=Nome livre',
        'autor1=Nome|vauthors=Nome livre','editor1=Nome|editores=Nome livre'])test(bundle,'numbered-native-collision-'+sha(fields).slice(0,16),()=>{
        const source='{{Cita noticia|título=Fonte fictícia|url=https://example.org/|'+fields+'}}',profile=api.migrateForeignTemplate(source,cfg).profile;
        eq(api.v219NumberedCitationAccepts(newspaper,/^editor|^enlaceeditor/.test(fields)?'editor1':'autor1',source,profile),false,
            'Competing native roles, including blank overrides and first-index aliases, prevent the new acceptance path');
        const result=calculate(source);for(const field of fields.split('|'))ok(result.text.includes(field),'A refused conflicting call retains every original field');
    });
    for(const key of ['autor0','autor01','autor100','autor-1','autor#','autor1suffix','tradutor1','constructor1'])test(bundle,'unproved-numbered-role-'+key,()=>{
        const source='{{Cita noticia|título=Fonte fictícia|'+key+'=Valor literal}}',profile=api.migrateForeignTemplate(source,cfg).profile;
        eq(api.v219NumberedCitationAccepts(newspaper,key,source,profile),false,'Unsupported number shapes and unproved families retain their old behavior');
    });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
