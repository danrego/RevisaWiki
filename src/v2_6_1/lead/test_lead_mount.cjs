'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const directory=path.resolve(process.argv[2]||path.join(__dirname,'../../../dist/2.6.1'));
const report={kind:'no-lead-shortcut-dom',version:'2.6.1',checks:0,cases:[],failures:[],actualWikipediaWrites:0};
function check(actual,expected,label){report.checks++;assert.deepEqual(actual,expected,label);}
function test(name,fn){try{fn();report.cases.push({name,status:'passed'});}catch(error){report.cases.push({name,status:'failed'});report.failures.push({name,message:error.message});}}
function surface(){
    const elements=[],sections=[],hooks=[];
    class Element{
        constructor(tag){this.tagName=tag;this.dataset={};this.style={};this.className='';this.listeners={};this.removed=false;elements.push(this);}
        get classList(){return{contains:value=>this.className.split(/\s+/).includes(value)};}
        addEventListener(name,listener){this.listeners[name]=listener;}
        closest(){return null;}
        after(node){node.parentNode=this.parentNode;}
        append(node){node.parentNode=this;}
        remove(){this.removed=true;}
    }
    const heading=new Element('h1'),edit=new Element('a');edit.href='https://pt.wikipedia.org/w/index.php?title=Example&action=edit';
    for(let index=1;index<=3;index++){const link=new Element('a');link.href='https://pt.wikipedia.org/w/index.php?title=Example&action=edit&section='+index;sections.push(link);}
    const document={nodeType:9,readyState:'complete',body:new Element('body'),
        createElement:tag=>new Element(tag),getElementById:id=>id==='firstHeading'?heading:null,
        querySelector:selector=>selector==='#ca-edit a[href]'?edit:null,
        querySelectorAll(selector){if(selector==='.rw26-lead-launch')return elements.filter(e=>!e.removed&&e.classList.contains('rw26-lead-launch'));if(selector==='.mw-editsection a[href]')return sections;return[];},
        addEventListener(){}};
    const configuration={wgAction:'view',wgPageContentModel:'wikitext',wgRevisionId:100,wgCurRevisionId:100};
    const mw={config:{get:key=>configuration[key]},hook:()=>({add:fn=>hooks.push(fn)}),notify(){}};
    const root={document,location:{origin:'https://pt.wikipedia.org',hostname:'pt.wikipedia.org',href:'https://pt.wikipedia.org/wiki/Example'},setTimeout:()=>1,clearTimeout(){}};
    function stale(){const node=new Element('button');node.className='rw26-launch rw26-lead-launch';heading.append(node);return node;}
    return{root,mw,document,heading,sections,elements,hooks,configuration,stale,buttons:()=>elements.filter(e=>!e.removed&&e.tagName==='button')};
}
for(const name of ['Carregador_common_js_RevisaWiki_v2_6_1.js','Carregador_comunitario_RevisaWiki_v2_6_1.js','RevisaWiki_v2_6_1.js'])test('lazy launcher '+name,()=>{
    const code=fs.readFileSync(path.join(directory,name),'utf8'),start=code.indexOf('    function v26InstallReadLauncher(root, mw, load) {'),end=code.indexOf('\n    }\n',start)+7;
    check(start>=0&&end>start,true,'bounded launcher function found');
    const fixture=surface(),old=fixture.stale(),context=vm.createContext({URL,console});
    vm.runInContext(code.slice(start,end)+'\nglobalThis.launcher=v26InstallReadLauncher;',context);
    let loads=0;context.launcher(fixture.root,fixture.mw,()=>{loads++;});
    check(old.removed,true,'stale introduction control removed');
    check(fixture.buttons().length,3,'only section shortcuts mounted');
    check(fixture.buttons().every(e=>e.textContent==='Editar aqui'),true,'section labels unchanged');
    check(fixture.elements.filter(e=>!e.removed&&e.parentNode===fixture.heading).length,0,'page heading remains untouched');
    fixture.hooks[0](fixture.document);check(fixture.buttons().length,3,'hook remount idempotent');
    const stale=fixture.stale();fixture.hooks[0](fixture.document);check(stale.removed,true,'hook cleans a stale introduction control');
    fixture.buttons()[0].listeners.click();check(loads,1,'section launcher still loads core');
    check(new URL(fixture.root.RevisaWikiInlinePending.href).searchParams.get('section'),'1','pending section target unchanged');
    fixture.root.RevisaWikiInlineLoadSettled(fixture.root.RevisaWikiInlinePending);
    const calls=[];fixture.root.RevisaWiki={inlineEditing:{open:(...args)=>calls.push(args)}};
    fixture.buttons()[1].listeners.click();check(calls.length,1,'already-loaded section action opens editor');
    check(new URL(calls[0][0]).searchParams.get('section'),'2','second section target unchanged');
});
for(const name of ['RevisaWiki_v2_6_1.js','RevisaWiki_v2_6_1_completo.js'])test('loaded controller '+name,()=>{
    const api=require(path.join(directory,name)),fixture=surface(),old=fixture.stale();
    const controller=api.createInlineController(fixture.root,fixture.mw,{config:()=>({})});controller.mount(fixture.document);
    check(old.removed,true,'loaded controller removes stale introduction button');
    check(fixture.buttons().length,3,'loaded controller mounts only section shortcuts');
    check(fixture.buttons().every(e=>e.textContent==='Editar aqui'),true,'loaded section labels retained');
    check(fixture.elements.filter(e=>!e.removed&&e.parentNode===fixture.heading).length,0,'loaded heading stays untouched');
    controller.mount(fixture.document);check(fixture.buttons().length,3,'loaded remount idempotent');
    const stale=fixture.stale();controller.mount(fixture.document);check(stale.removed,true,'loaded hook removes stale introduction control');
    check(api.inlineHelpers.parseEditTarget('/w/index.php?title=Example&action=edit&section=0','https://pt.wikipedia.org').section,'0','programmatic introduction editing API still supported');
});
report.status=report.failures.length?'failed':'passed';console.log(JSON.stringify(report,null,2));if(report.failures.length)process.exitCode=1;
