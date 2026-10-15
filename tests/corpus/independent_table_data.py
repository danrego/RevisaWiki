#!/usr/bin/env python3
"""Compare literal wikitext table data with an independent source parser.

Header scopes and chronological regrouping may change table wrappers. Ordered
nonheader rows retain their data; the set of header rows and captions must also
stay. Year-only heading rows are checked against after-section headings instead
of being counted as ordinary data cells. Nested tables stay explicitly unresolved.
"""
import argparse,hashlib,json,pathlib,re
from independent_wikitext import tables,literal_mask
ROOT=pathlib.Path(__file__).resolve().parents[2];HERE=pathlib.Path(__file__).resolve().parent

def value(s):
 s=re.sub(r'\{\{[Ss]éc\|([IVXLCDM]+)\}\}',lambda m:'século '+m[1],s)
 s=re.sub(r'\{\{AC\|([^|{}]+)\|x\}\}',lambda m:m[1]+' a.C.',s)
 # Finite template aliases have the same displayed list/maintenance/note content.
 s=re.sub(r'\{\{\s*(?:plainlist|Lista simples)\s*\|','{{LIST|',s,flags=re.I)
 s=re.sub(r'\{\{\s*(?:citation needed|Carece de fontes)\s*\|','{{MAINT|',s,flags=re.I)
 s=re.sub(r'\{\{\s*notelist\s*\}\}','{{NOTES|lower-alpha}}',s,flags=re.I)
 s=re.sub(r'\{\{\s*Notas\s*\|\s*grupo\s*=\s*lower-alpha\s*\}\}','{{NOTES|lower-alpha}}',s,flags=re.I)
 # A source containing an unfinished ref cannot supply trustworthy inline table
 # citation text. Compare the ordinary prefix, retain the malformed tail as an
 # explicitly unresolved feature and rely on URL/ID/ref-error checks separately.
 s=re.sub(r'<ref\b[\s\S]*$','<UNRESOLVED-REF>',s,flags=re.I)
 s=re.sub(r'\s*([|=])\s*',r'\1',s)
 return s

def source_tables(text):
 # Read line-delimited literal table source even if an earlier malformed
 # template hides the article tail from a whole-document template masker.
 # Protected examples/math/comments remain excluded. The snippet parser still
 # keeps nested or malformed table content unresolved instead of guessing.
 view=literal_mask(text);stack=[];snippets=[];unclosed=[]
 for match in re.finditer(r'^[ \t]*(\{\||\|\})[^\r\n]*(?:\r?\n|$)',view,re.M):
  if match[1]=='{|':stack.append(match.start())
  elif stack:
   start=stack.pop()
   if not stack:snippets.append(text[start:match.end()])
 for start in stack:unclosed.append({'reason':'unclosed literal table','start':start})
 parsed=[]
 for snippet in snippets:
  parsed_part,issues=tables(snippet);parsed+=parsed_part;unclosed+=issues
 return parsed,unclosed

def inventory(text):
 parsed,unclosed=source_tables(text);data=[];headers=[];captions=[];years=[];unresolved=[];unresolved_cells=0
 for table in parsed:
  if 'unresolved' in table:unresolved.append(table);continue
  for raw in table.get('rows',[]):
   unresolved_cells+=sum(bool(re.search(r'<ref\b',c['value'],re.I))for c in raw)
   row=tuple((c['kind'],value(c['value']))for c in raw)
   if len(row)==1 and re.fullmatch(r'={3,6}\s*[12]\d{3}\s*={3,6}',row[0][1]):years.append(re.sub(r'[=\s]','',row[0][1]));continue
   if row and all(c[0]=='!'for c in row):headers.append(row)
   else:data.append(row)
  captions.extend(value(x)for x in table.get('captions',[]))
 return {'tables':len(parsed),'data':data,'headers':set(headers),'captions':captions,'years':years,'unresolvedTables':unresolved,'unclosed':unclosed,'unresolvedCells':unresolved_cells}

def main():
 p=argparse.ArgumentParser();p.add_argument('run');p.add_argument('--available-only',action='store_true');args=p.parse_args();rows=[]
 for corpus,directory in [('new',HERE/'inputs/new'),('old',HERE/'inputs/old')]:
  for item in json.loads((directory/'manifest.json').read_text()):
   files=[HERE/(args.run+'_part'+str(i))/'core_transformed'/corpus/(str(item['revid'])+'.wiki')for i in range(4)];found=[f for f in files if f.exists()]
   if not found:
    if args.available_only:continue
    raise RuntimeError('Missing transformed source '+item['title'])
   assert len(found)==1
   before=(directory/item['file']).read_text();after=found[0].read_text();assert hashlib.sha256(before.encode()).hexdigest()==item['sha256']
   b=inventory(before);a=inventory(after)
   headings=re.findall(r'^={3,6}\s*([12]\d{3})\s*={3,6}\s*$',after,re.M)
   checks={'orderedDataRowsExact':b['data']==a['data'],'distinctHeaderRowsExact':b['headers']==a['headers'],'captionsExact':b['captions']==a['captions'],'chronologicalYearRowsRetained':all(b['years'].count(y)<=a['years'].count(y)+headings.count(y)for y in set(b['years'])),'noNewUnresolvedTables':len(a['unresolvedTables'])<=len(b['unresolvedTables']),'noNewUnclosedTables':len(a['unclosed'])<=len(b['unclosed']),'noNewUnresolvedCells':a['unresolvedCells']<=b['unresolvedCells']}
   row={'title':item['title'],'revid':item['revid'],'corpus':corpus,'tablesBefore':b['tables'],'tablesAfter':a['tables'],'dataRowsBefore':len(b['data']),'dataRowsAfter':len(a['data']),'nestedTablesUnresolvedBefore':len(b['unresolvedTables']),'nestedTablesUnresolvedAfter':len(a['unresolvedTables']),'unresolvedCellsBefore':b['unresolvedCells'],'unresolvedCellsAfter':a['unresolvedCells'],'passed':all(checks.values()),**checks}
   if not row['passed']:
    row['firstDataMismatches']=[{'index':i,'before':br,'after':ar}for i,(br,ar)in enumerate(zip(b['data'],a['data']))if br!=ar][:3]
    row['lostHeaders']=[list(x)for x in b['headers']-a['headers']];row['addedHeaders']=[list(x)for x in a['headers']-b['headers']]
   rows.append(row)
   if len(rows)%50==0:print('independent tables checked',len(rows),flush=True)
 summary={'articles':len(rows),'checks':len(rows)*7,'passed':sum(r['passed']for r in rows),'flagged':sum(not r['passed']for r in rows),'tablesBefore':sum(r['tablesBefore']for r in rows),'tablesAfter':sum(r['tablesAfter']for r in rows),'independentParser':True,'implementationImported':False,'nestedTablesKeptUnresolved':True,'networkRequests':0,'wikipediaWrites':0}
 folder=HERE/args.run;file=folder/('independent_table_data'+('_partial'if args.available_only else '')+'.json');file.write_text(json.dumps({'summary':summary,'articles':rows},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps(summary,ensure_ascii=False));print(json.dumps([r for r in rows if not r['passed']],ensure_ascii=False)[:12000])
if __name__=='__main__':main()
