"""Admit only the agreed technical infobox-part destinations."""
from pathlib import Path
import gzip
import importlib.util
import io
import unittest
import zipfile

ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('infobox_path_privacy',ROOT/'scripts/publication_privacy_gate.py')
privacy=importlib.util.module_from_spec(spec)
spec.loader.exec_module(privacy)


class TechnicalInfoboxParts(unittest.TestCase):
    def path(self,part='parte0001.json'):
        return privacy.TECHNICAL_SCRIPT_TITLE.rsplit('/RevisaWiki.js',1)[0]+'/RevisaWiki/Infocaixas/'+part

    def scan(self,value):
        scanner=privacy.Scanner([])
        scanner.scan('fixture.txt',value.encode()if isinstance(value,str)else value)
        return scanner.findings

    def denied(self,value):
        self.assertTrue(any(row['rule']=='unreviewed-wiki-user-destination'for row in self.scan(value)))

    def test_exact_paths_and_url_encoding(self):
        from urllib.parse import quote
        for part in ['parte0001.json','parte0010.json','parte9999.json']:
            target=self.path(part)
            self.assertEqual(self.scan(target),[])
            self.assertEqual(self.scan('https://pt.wikipedia.org/wiki/'+quote(target)),[])
            self.assertEqual(self.scan(target.replace('User'+':','Usuário'+':')),[])
            self.assertEqual(self.scan(target.replace('User'+':','Usuária'+':')),[])

    def test_only_exact_folder_and_filename_grammar(self):
        target=self.path()
        for changed in [target.replace('/RevisaWiki/','/OutraPasta/'),target.replace('/Infocaixas/','/Infoboxes/'),target.replace('/Infocaixas/','/infocaixas/'),target.replace('/RevisaWiki/','/revisawiki/'),target.replace('parte0001','Parte0001')]:
            self.denied(changed)
        for part in ['parte001.json','parte00001.json','parte00x1.json','parte１２３４.json','parte0001.js','parte0001.JSON','parte0001.json.private','parte0001.json/extra','parte0001.jsonx','../parte0001.json']:
            self.denied(self.path(part))

    def test_other_accounts_and_nontechnical_paths_still_fail(self):
        namespace='User'+':'
        self.denied(namespace+'Other account/RevisaWiki/Infocaixas/parte0001.json')
        owner=privacy.TECHNICAL_SCRIPT_TITLE.split(':',1)[1].split('/',1)[0]
        self.denied(namespace+owner+'/Página pessoal/parte0001.json')
        self.denied(namespace+owner+'/RevisaWiki/Infocaixas')
        self.denied(namespace+owner+'/RevisaWiki/Infocaixas/parte0001.json?extra='+namespace+'Other account')

    def test_surrounding_private_content_is_never_masked(self):
        target=self.path()
        self.assertTrue(any(row['rule']=='unreviewed-email'for row in self.scan(target+' '+('person'+'@'+'example.invalid'))))
        self.assertTrue(any(row['rule']=='secret-token'for row in self.scan(target+' '+('gh'+'p_'+'A'*30))))
        self.assertTrue(any(row['rule']=='private-home-path'for row in self.scan(target+' '+('/'+'Users'+'/ExampleAccount/file.txt'))))

    def test_archives_keep_the_same_exact_boundary(self):
        self.assertEqual(self.scan(gzip.compress(self.path().encode())),[])
        self.denied(gzip.compress(self.path('parte0001.json.private').encode()))
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w')as target:target.writestr('content.txt',self.path())
        self.assertEqual(self.scan(stream.getvalue()),[])
        stream=io.BytesIO()
        with zipfile.ZipFile(stream,'w')as target:target.writestr('content.txt',self.path('parte0001.json/extra'))
        self.denied(stream.getvalue())


if __name__=='__main__':unittest.main()
