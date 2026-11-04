const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function file(p){return fs.readFileSync(path.join(ROOT,p),'utf8')}
test.beforeEach(async({page})=>{
 await page.route('**/data/*.json',async route=>{
   const name=route.request().url().split('/').pop();
   await route.fulfill({status:200,contentType:'application/json',body:file('data/'+name)});
 });
 await page.goto('http://127.0.0.1:8765/');
});
async function start(page,{conj=5,nat=5,mode='qcm',correction='progress',keep='no'}={}){
 await page.locator('#name').fill('Élève test');
 await page.locator('#conjCount').selectOption(String(conj));
 await page.locator('#natCount').selectOption(String(nat));
 await page.locator('[name=conjType][value='+mode+']').check();
 await page.locator('[name=conjCorrection][value='+correction+']').check();
 await page.locator('[name=keep][value='+keep+']').check();
 await page.locator('#begin').click();
 await expect(page.getByText('Conjugaison',{exact:true})).toBeVisible();
}
async function completeConj(page,n){
 for(let i=0;i<n;i++){
   await page.locator('[data-option]').first().click();
   await page.locator('#next').click();
   await page.locator('#next').click();
 }
 await expect(page.getByText('Étape terminée')).toBeVisible();
 await page.locator('#go').click();
}
async function completeNatures(page,n){
 for(let i=0;i<n;i++){
   await page.locator('[data-class=nom]').click();
   await page.locator('#next').click();
 }
 await expect(page.getByText('Étape terminée')).toBeVisible();
 await page.locator('#go').click();
}
async function completeRec(page){
 page.on('dialog',d=>d.accept());
 await page.locator('#next').click();
 for(let i=0;i<10;i++){
   await page.locator('[data-option]').first().click();
   await page.locator('#next').click();
   await page.locator('#next').click();
 }
 await expect(page.getByText('Étape terminée')).toBeVisible();
 await page.locator('#go').click();
}
test('parcours complet et note finale',async({page})=>{
 await start(page);
 await completeConj(page,5);
 await completeNatures(page,5);
 await completeRec(page);
 await expect(page.getByText('Résultats de l’évaluation')).toBeVisible();
 await expect(page.locator('.result')).toContainText('/ 20');
 await expect(page.locator('.result')).toContainText('/ 20');
 await expect(page.getByText('Élève test')).toBeVisible();
});
test('reprise après correction progressive sans double validation',async({page})=>{
 await start(page);
 await page.locator('[data-option]').first().click();
 await page.locator('#next').click();
 await page.reload();
 await expect(page.getByText('Évaluation enregistrée')).toBeVisible();
 await page.locator('#resume').click();
 await expect(page.locator('[data-option]').first()).toBeDisabled();
 await expect(page.locator('#next')).toHaveText('Suivant');
 await page.locator('#next').click();
 await expect(page.getByText('Question 2 / 5')).toBeVisible();
});
test('niveaux sans récit désactivés',async({page})=>{
 await page.locator('#storyMode').selectOption('stars');
 await expect(page.locator('#stars option[value="9"]')).toBeDisabled();
 await expect(page.locator('#stars option[value="10"]')).toBeDisabled();
 await expect(page.locator('#stars option[value="12"]')).toBeDisabled();
});
test('correction différée et texte consultable',async({page})=>{
 await start(page,{correction:'end',keep:'yes'});
 for(let i=0;i<5;i++){await page.locator('[data-option]').first().click();await page.locator('#next').click()}
 await expect(page.getByText('Voir le corrigé de conjugaison')).toBeVisible();
});
