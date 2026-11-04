#!/usr/bin/env python3
"""Synchronisation en lecture seule des données depuis les dépôts sources."""
import json, pathlib, re, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'data'
BASE = 'https://raw.githubusercontent.com/pierreewenlemetayer-dev/{}/main/{}'
def fetch(repo, path):
    req = urllib.request.Request(BASE.format(repo, path), headers={'User-Agent':'Eval-corpus-sync'})
    with urllib.request.urlopen(req, timeout=40) as response:
        return response.read().decode('utf-8')
def write(name, obj):
    OUT.mkdir(exist_ok=True)
    (OUT / name).write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
def main():
    recits = json.loads(fetch('recits', 'corpus.json'))
    assert len(recits) >= 70
    assert len({r['numero'] for r in recits}) == len(recits)
    for r in recits:
        assert 1 <= r['etoiles'] <= 12 and len(r['qcm']) == 10
        for i, q in enumerate(r['qcm'], 1):
            assert q['numero'] == i and len(q['options']) == 4 and 0 <= q['reponse'] < 4
    nat = fetch('natures', 'js/data.js')
    m = re.search(r'window\.NATURES_DATA\s*=\s*(\[.*?\])\s*;', nat, re.S)
    assert m, 'Natures : données introuvables'
    natures = json.loads(m.group(1))
    assert len(natures) >= 250
    assert all(isinstance(x[0],str) and x[1] for x in natures)
    conj = fetch('conjugaison', 'index.html')
    m = re.search(r'const DATA\s*=\s*(\[.*?\])\s*;\s*const MODES', conj, re.S)
    assert m, 'Conjugaison : données introuvables'
    conjugaison = json.loads(m.group(1))
    assert len(conjugaison) >= 1000
    assert all(all(k in x for k in ('v','t','p','a','g')) for x in conjugaison)
    # Écriture seulement après validation complète des trois corpus.
    write('recits.json', recits)
    write('natures.json', natures)
    write('conjugaison.json', conjugaison)
    print(f'{len(recits)} récits, {len(natures)} mots, {len(conjugaison)} formes')
if __name__ == '__main__':
    main()
