'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('app.js','utf8').replace(/boot\(\);\s*$/,'');
const data={conj:JSON.parse(fs.readFileSync('data/conjugaison.json')),nat:JSON.parse(fs.readFileSync('data/natures.json')),rec:JSON.parse(fs.readFileSync('data/recits.json'))};
const root={innerHTML:''};
const ctx={document:{getElementById:id=>id==='app'?root:{onclick:null},addEventListener(){}},console,localStorage:{setItem(){},removeItem(){}},Date,Math,confirm:()=>true};
ctx.__data=data;
vm.createContext(ctx);
vm.runInContext(code+'\nDATA=globalThis.__data;globalThis.__test={conjugations,natures,story,valid,canon};',ctx);
ctx.__data=data;
const t=ctx.__test;
const times=new Set(['indicatif_présent','indicatif_passé_composé','indicatif_imparfait','indicatif_plus_que_parfait','indicatif_passé_simple','conditionnel_présent','subjonctif_présent']);
for(const count of [5,10,20]){
 for(let run=0;run<100;run++){
  for(const type of ['write','qcm']){
   const qs=t.conjugations(count,type);
   assert.equal(qs.length,count);
   for(const q of qs){
    assert(times.has(q.t));
    assert(q.a.length);
    assert(t.valid(q,q.a[0]));
    if(type==='qcm'){assert.equal(q.options.length,3);assert.equal(new Set(q.options.map(t.canon)).size,3);assert.equal(q.options[q.correctIndex],q.options.find(x=>q.a.some(a=>t.canon(a)===t.canon(x))))}
   }
  }
  const qs=t.natures(count);
  assert.equal(qs.length,count);
  assert.equal(new Set(qs.map(q=>q.word)).size,count);
  assert(qs.every(q=>q.answers.some(a=>a.split(':')[0]===q.category)));
 }
}
for(const r of data.rec){
 const got=t.story({story:'number',number:r.numero});
 assert.equal(got.numero,r.numero);
 assert.equal(got.answers.length,10);
}
for(let stars=1;stars<=12;stars++){
 const options=data.rec.filter(r=>r.etoiles===stars);
 if(options.length)assert.equal(t.story({story:'stars',stars}).etoiles,stars);
}
console.log('OK : 600 tirages de conjugaison, 300 de Natures et 76 récits vérifiés.');
