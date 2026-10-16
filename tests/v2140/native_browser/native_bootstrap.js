'use strict';
// This local fixture never submits a form. The shortcut is observed as a click,
// without pretending that a Wikimedia diff page has been loaded.
(() => {
 const qa=window.__rw26QA,params=new URLSearchParams(location.search);
 if(!qa||params.get('scenario')!=='native-editor')return;
 const state=window.__rwNativeUI={diffClicks:0,saveClicks:0,formSubmits:0,mode:params.get('nativeControl')||'direct-button'};
 const form=document.createElement('form');form.id='editform';
 form.addEventListener('submit',event=>{event.preventDefault();state.formSubmits++;});
 for(const id of ['wpTextbox1','wpSummary']){const element=document.getElementById(id);if(element)form.append(element);}
 const save=document.createElement('button');save.id='wpSave';save.name='wpSave';save.type='submit';save.textContent='Publicar página';save.addEventListener('click',event=>{event.preventDefault();state.saveClicks++;});form.append(save);
 const mode=state.mode,control=mode.endsWith('input')?document.createElement('input'):document.createElement('button');
 control.type=mode==='wrong-type'?'button':'submit';control.name=mode==='wrong-name'?'wpSave':'wpDiff';control.id=mode.startsWith('widget')?'native-widget-diff':'wpDiff';
 control.disabled=mode==='disabled';
 if(control.tagName==='INPUT')control.value='Mostrar alterações';else control.textContent='Mostrar alterações';
 control.addEventListener('click',event=>{event.preventDefault();state.diffClicks++;});
 if(mode==='outside-form')document.body.append(control);
 else if(mode==='wrong-form'){const other=document.createElement('form');other.id='other-native-form';document.body.append(other);control.setAttribute('form',other.id);form.append(control);}
 else if(mode.startsWith('widget')){const widget=document.createElement('span');widget.id='wpDiffWidget';widget.append(control);form.append(widget);}
 else if(mode!=='missing')form.append(control);
 document.body.append(form);
 if(params.get('engine')==='fallback')window.Worker=undefined;
})();
