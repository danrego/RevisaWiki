// A template-name prefix alone does not prove that the output is an infobox.
function v2216LayoutWrappers(source,cfg={}){
 return v2217Previous_v2216LayoutWrappers(source,cfg).filter(edit=>edit.kind!=='native-infobox-wrapper'||v2217StandaloneInfobox(edit.text));
}
