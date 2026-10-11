import {test} from 'node:test';import assert from 'node:assert/strict';import {execFileSync,spawnSync}from 'node:child_process';import {mkdtemp,rm,readFile}from 'node:fs/promises';import {tmpdir}from 'node:os';import {join,resolve}from 'node:path';
for(const variant of ['valid','tampered','wrong-baseline','extra-root','unsafe-path'])test(`production recovery ${variant} preserves only verified pinned root bytes`,async()=>{
 const dir=await mkdtemp(join(tmpdir(),'ocw-recovery-test-'));try{
 const input=join(dir,'combined.tar'),out=join(dir,'root.tar');
 execFileSync('python3',['-c',`
import io,json,hashlib,tarfile,sys
variant=sys.argv[2]
original=b'ORIGINAL PUBLIC WEBSITE'
manifest={'productionCommit':'pinned-commit','productionRun':'123','files':[{'path':'index.html','sha256':hashlib.sha256(original).hexdigest()}]}
if variant=='wrong-baseline': manifest['productionCommit']='other-commit'
with tarfile.open(sys.argv[1],'w') as archive:
    files={'index.html':b'changed' if variant=='tampered' else original,'preview/index.html':b'NEW PREVIEW','preview/production-manifest.json':json.dumps(manifest).encode()}
    if variant=='extra-root': files['unexpected.html']=b'not approved'
    if variant=='unsafe-path': files['../escape']=b'bad'
    for name,data in files.items():
        member=tarfile.TarInfo(name);member.size=len(data);archive.addfile(member,io.BytesIO(data))
`,input,variant]);
 const result=spawnSync('python3',[resolve('scripts/recover-production.py'),input,out,'pinned-commit','123'],{encoding:'utf8'});
 if(variant==='valid'){assert.equal(result.status,0,result.stderr);const resultText=execFileSync('python3',['-c',`import tarfile,sys,json\nwith tarfile.open(sys.argv[1]) as a: print(json.dumps({'names':a.getnames(),'html':a.extractfile('index.html').read().decode()}))`,out],{encoding:'utf8'});assert.deepEqual(JSON.parse(resultText),{names:['index.html'],html:'ORIGINAL PUBLIC WEBSITE'});}
 else {assert.notEqual(result.status,0);await assert.rejects(readFile(out));}
 }finally{await rm(dir,{recursive:true,force:true});}
});
