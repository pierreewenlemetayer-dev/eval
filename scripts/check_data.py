import json
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'data'
conj=json.loads((base/'conjugaison.json').read_text(encoding='utf-8'))
nat=json.loads((base/'natures.json').read_text(encoding='utf-8'))
rec=json.loads((base/'recits.json').read_text(encoding='utf-8'))
assert len(conj)>=5000 and len(nat)>=250 and len(rec)>=70
times={'indicatif_présent','indicatif_passé_composé','indicatif_imparfait','indicatif_plus_que_parfait','indicatif_passé_simple','conditionnel_présent','subjonctif_présent'}
assert times.issubset({q['t'] for q in conj})
assert all(q['v'] and q['a'] and q['p'] for q in conj)
assert len({w for w,_ in nat})==len(nat)
assert all(w and answers and isinstance(answers,list) for w,answers in nat)
assert len({r['numero'] for r in rec})==len(rec)
for r in rec:
    assert 1<=r['etoiles']<=12 and len(r['qcm'])==10 and r['texte'].strip()
    for i,q in enumerate(r['qcm'],1):
        assert q['numero']==i and len(q['options'])==4 and 0<=q['reponse']<4
print(f'OK : {len(conj)} formes, {len(nat)} mots, {len(rec)} récits')
