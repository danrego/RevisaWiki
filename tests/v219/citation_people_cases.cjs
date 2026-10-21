'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),files=process.argv.slice(2).map(x=>path.resolve(x));
if(!files.length)files.push(...['RevisaWiki_v2_19_0.js','RevisaWiki_v2_19_0_completo.js'].map(x=>path.join(root,'dist/2.19.0',x)));
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),report={kind:'native-citation-people-priority',status:'passed',
    runnerSha256:sha(fs.readFileSync(__filename)),helperSha256:sha(fs.readFileSync(path.join(root,'src/v2_19/citation_people_safety.js'))),
    primarySources:[73016847,71860752,72936771].map(oldid=>'https://pt.wikipedia.org/w/index.php?oldid='+oldid),
    bundles:[],cases:[],checks:0,failures:[],networkRequests:0,wikipediaWrites:0};
const eq=(a,b,m)=>{report.checks++;assert.equal(JSON.stringify(a),JSON.stringify(b),m);},ok=(v,m)=>{report.checks++;assert.ok(v,m);};
function test(bundle,id,fn){try{fn();report.cases.push({bundle,id,status:'passed'});}catch(error){report.status='failed';report.cases.push({bundle,id,status:'failed'});report.failures.push({bundle,id,message:error.message});}}
for(const file of files){
    const api=require(file),bundle=path.basename(file);report.bundles.push({bundle,runtimeSha256:sha(fs.readFileSync(file)),version:api.version,helperPreview:false});
    const cfg={...api.defaults,namespaceNumber:0,pageTitle:'Tema fictício',contentModel:'wikitext',autoPreview:false,
        authorityControl:false,biographyPortal:false,automaticBiographyPortals:false,automaticTopicPortals:false,registryDoiCheck:false,
        referenceColumns:false,externalLinkColumns:false,endMatterColumns:false,automaticParameterNames:false};
    const calc=(source,extra={})=>api.calculate({kind:'adjust',source,options:{...cfg,...extra}}),
        cite=(field,name='Citar web')=>'{{'+name+'|título=Fonte literal|url=https://example.org/fonte|'+field+'}}',
        check=(source,expected,reason)=>{const result=calc(source);eq(result.text,calc(expected).text,reason);eq(calc(result.text).text,result.text,'A single action reaches a stable result');ok(!(result.preservation||[]).length,'No citation-role preservation refusal hides a writer defect');};
    test(bundle,'actual-helper-present',()=>{for(const key of ['v219CitationPeopleSplitAllowed','v219CitationPeopleTailAllowed','v219CitationCoauthorAllowed'])eq(typeof api[key],'function','The actual shipped runtime contains '+key);});
    for(const name of ['Citar web','Citar livro','Citar jornal','Citar periódico','Citar revista']){
        for(const [key,family]of [['autor','autor'],['autores','autor'],['editor','editor'],['editores','editor'],['tradutor','tradutor']])test(bundle,'safe-semicolon-'+name+'-'+key,()=>{
            check(cite(key+'=Nome Exemplo; Outra Pessoa',name),cite(family+'=Nome Exemplo|'+family+'2=Outra Pessoa',name),'Complete personal names separated by a semicolon become a native numbered list');
        });
        for(const [key,display]of [['autor','numero-autores'],['editor','numero-editores'],['último','numero-autores'],['editor-sobrenome','numero-editores']])test(bundle,'safe-etal-'+name+'-'+key,()=>{
            check(cite(key+'=Nome Exemplo et al.',name),cite(key+'=Nome Exemplo|'+display+'=et al',name),'The active author/editor display role retains an explicit et al suffix');
        });
        for(const key of ['tradutor','tradutor2','translator','translator2','tradutor-ultimo','translator-last'])test(bundle,'translator-etal-preserved-'+name+'-'+key,()=>{
            const source=cite(key+'=Nome Exemplo et al.',name);check(source,source,'A whitelist field without a renderer display role cannot replace translator text');
        });
    }
    const families=[
        {key:'autor',prefix:'AuthorList-',unstructured:['Authors','Vauthors','Coauthors'],display:'DisplayAuthors',displayKey:'numero-autores'},
        {key:'editor',prefix:'EditorList-',unstructured:['Editors','Veditors'],display:'DisplayEditors',displayKey:'numero-editores'},
        {key:'tradutor',prefix:'TranslatorList-',unstructured:[],display:null}
    ];
    for(const family of families){
        const aliases=api.citationParameters.filter(key=>api.v219NativeCitationRoles(key.replace(/#/g,'2')).some(role=>role.startsWith(family.prefix)||family.unstructured.includes(role)||role===family.display));
        for(const originalKey of aliases){const key=originalKey.replace(/#/g,'2');if(key===family.key)continue;
            for(const value of ['', 'Outro valor'])test(bundle,'split-native-priority-'+family.key+'-'+key+'-'+(value?'value':'blank'),()=>{
                const source=cite(family.key+'=Nome Exemplo; Outra Pessoa|'+key+'='+value);check(source,source,'Every competing native alias, including an explicit blank, keeps the original list intact');
            });
        }
        if(!family.display)continue;
        for(const originalKey of api.citationParameters){const roles=api.v219NativeCitationRoles(originalKey.replace(/#/g,'2'));if(!roles.includes(family.display))continue;
            for(const value of ['', '1', 'et al'])test(bundle,'etal-display-priority-'+family.key+'-'+originalKey+'-'+(value||'blank'),()=>{
                const source=cite(family.key+'=Nome Exemplo et al.|'+originalKey+'='+value);check(source,source,'An existing display role is retained without adding a competing alias');
            });
        }
    }
    for(const key of ['coautor','coautores','coauthor','coauthors']){
        test(bundle,'coauthor-safe-'+key,()=>{const source=cite('autor=Nome Exemplo|'+key+'=Outra Pessoa');check(source,source,'The consumed native deprecated Coauthors field is preserved; numbered activation changes structured metadata and may change Harvard targets');});
        test(bundle,'coauthor-ambiguous-comma-list-'+key,()=>{const source=cite('primeiro=Primeiro|ultimo=Autor|'+key+'=Pessoa Exemplo, Outra Pessoa, Terceira Pessoa|urlmorta=no');check(source,source,'A comma-separated multi-person field cannot be reinterpreted as one numbered full-name slot');});
        const aliases=api.citationParameters.filter(alias=>api.v219NativeCitationRoles(alias.replace(/#/g,'2')).some(role=>/^AuthorList-(?:First|Last|Link|Mask):2$/.test(role)));
        for(const originalKey of aliases)for(const value of ['', 'Terceiro Nome'])test(bundle,'coauthor-alias-'+key+'-'+originalKey+'-'+(value?'value':'blank'),()=>{
            const source=cite('autor=Nome Exemplo|'+key+'=Outra Pessoa|'+originalKey.replace(/#/g,'2')+'='+value);check(source,source,'A second-person slot is never activated over an English or Portuguese native alias');
        });
        for(const other of ['autor3=Terceiro Nome','last3=','authors=Nome coletivo','vauthors=Exemplo N','coautor=Terceiro Nome'])test(bundle,'coauthor-other-list-'+key+'-'+other,()=>{
            const source=cite('autor=Nome Exemplo|'+key+'=Outra Pessoa|'+other);check(source,source,'Converting coauthors cannot change list priority or person order');
        });
    }
    for(const [before,after]of [['autor=Exemplo HP, Modelo SM, da Silva JD, et al.','autor=Exemplo HP, Modelo SM, da Silva JD|numero-autores=et al'],
        ['último=Exemplo et al.|primeiro=Nome','último=Exemplo|primeiro=Nome|numero-autores=et al'],
        ['editor-sobrenome=Exemplo et al.|editor-nome=Nome','editor-sobrenome=Exemplo|editor-nome=Nome|numero-editores=et al']])test(bundle,'proved-personal-tail-'+sha(before).slice(0,16),()=>{
        check(cite(before),cite(after),'A complete provided personal name/list, with its existing native first/last association, retains the et al meaning');
    });
    for(const before of ['autor=Nome Exemplo et al.|autor2=Outra Pessoa','editor=Nome Exemplo et al.|editor2=',
        'último=Exemplo et al.|primeiro=Instituto','editor-sobrenome=Exemplo et al.|editor-nome=Empresa'])test(bundle,'tail-companion-priority-'+sha(before).slice(0,16),()=>{
        const source=cite(before);check(source,source,'A later slot, blank alias or institutional companion prevents an inferred person-list rewrite');
    });
    for(const family of families)for(const value of ["''Nome Exemplo et al.''","'''Nome Exemplo et al.'''",'"Nome Exemplo et al."','{{Nome fictício}} et al.',
        'Nome Exemplo<!--nota--> et al.','Nome Exemplo & Outra Pessoa','Centro de Pesquisa; Fundação Exemplo',
        'Nome Exemplo; Outra Pessoa; Fundação Exemplo','Instituto Exemplo et al.','Research Group Et Al.','Empresa Modelo et al.'])test(bundle,'literal-name-'+family.key+'-'+sha(value).slice(0,12),()=>{
        const source=cite(family.key+'='+value);check(source,source,'Formatting, organizations and ambiguous personal-name boundaries remain exact');
    });
    for(const value of ['Nome Exemplo; Outra Pessoa','Nome Exemplo et al.'])for(const family of families)for(const extra of [{authors:false},{citations:false}])test(bundle,'option-'+family.key+'-'+sha(value+JSON.stringify(extra)).slice(0,12),()=>{
        const source=cite(family.key+'='+value);eq(calc(source,extra).text,source,'Explicit author/citation opt-outs prevent people-field normalization');
    });
}
report.caseCount=report.cases.length;process.stdout.write(JSON.stringify(report,null,2)+'\n');if(report.status!=='passed')process.exitCode=1;
