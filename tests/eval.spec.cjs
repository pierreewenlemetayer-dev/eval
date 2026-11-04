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
 await page.locator('[data-star="1"]').click();
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
   if(i<9)await page.locator('#next').click();
 }
 await expect(page.getByText('Étape terminée')).toBeVisible();
 await page.locator('#go').click();
}
test('parcours complet et note finale',async({page})=>{
 await start(page);
 await completeConj(page,5);
 await completeNatures(page,5);
 await completeRec(page);
 await expect(page.getByText('Résultat de l’évaluation')).toBeVisible();
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
 await expect(page.locator('#starButtons')).toBeVisible();
 await expect(page.locator('[data-star="9"]')).toBeDisabled();
 await expect(page.locator('[data-star="10"]')).toBeDisabled();
 await expect(page.locator('[data-star="12"]')).toBeDisabled();
});
test('correction différée et texte consultable',async({page})=>{
 await start(page,{correction:'end',keep:'yes'});
 for(let i=0;i<5;i++){await page.locator('[data-option]').first().click();await page.locator('#next').click()}
 await expect(page.getByText('Voir le corrigé de conjugaison')).toBeVisible();
});

test('le mode sans texte retire le récit des questions',async({page})=>{
 await start(page,{keep:'no'});
 await completeConj(page,5);
 await completeNatures(page,5);
 page.on('dialog',d=>d.accept());
 await expect(page.locator('article.story')).toBeVisible();
 await page.locator('#next').click();
 await expect(page.locator('article.story')).toHaveCount(0);
 await expect(page.getByText('QCM sans le texte')).toBeVisible();
});
test('la reprise conserve la fin de la première étape',async({page})=>{
 await start(page);
 await completeConj(page,5);
 await page.reload();
 await page.locator('#resume').click();
 await expect(page.getByText('Identifiez la classe grammaticale')).toBeVisible();
});
test('les sous-catégories grammaticales sont sélectionnables',async({page})=>{
 await start(page);
 await completeConj(page,5);
 await page.locator('[data-class=pronom]').click();
 await expect(page.locator('[data-answer="pronom:personnel"]')).toBeVisible();
 await page.locator('[data-answer="pronom:personnel"]').click();
 await expect(page.locator('#next')).toBeEnabled();
});

test('Entrée permet de passer à la conjugaison suivante après correction',async({page})=>{
 await start(page,{mode:'write',correction:'progress'});
 const first=await page.locator('.prompt').textContent();
 await page.locator('#writeAnswer').fill('réponse de test');
 await page.locator('#writeAnswer').press('Enter');
 await expect(page.locator('#next')).toHaveText('Suivant');
 await page.keyboard.press('Enter');
 await expect(page.getByText('Question 2 / 5')).toBeVisible();
 await expect(page.locator('.prompt')).not.toHaveText(first);
});
test('les paramètres restent disponibles après une nouvelle évaluation',async({page})=>{
 await start(page);
 page.on('dialog',d=>d.accept());
 await page.locator('#home').click();
 await expect(page.locator('#storyMode')).toBeVisible();
 await page.locator('#storyMode').selectOption('stars');
 await expect(page.locator('#starButtons')).toBeVisible();
 await expect(page.locator('[data-star="9"]')).toBeDisabled();
});

test('douze étoiles, choix par défaut et score non redondant',async({page})=>{
 await expect(page.locator('#storyMode')).toHaveValue('stars');
 await expect(page.locator('[data-star]')).toHaveCount(12);
 await expect(page.locator('#stars')).toHaveValue('');
 await page.locator('[data-star="2"]').click();
 await expect(page.locator('#stars')).toHaveValue('2');
 await start(page,{conj:5,nat:5});
 await completeConj(page,5);
 await completeNatures(page,5);
 await completeRec(page);
 await expect(page.getByText('Score total')).toHaveCount(0);
 await expect(page.getByText('Note sur vingt')).toBeVisible();
 await expect(page.locator('.results-title')).toHaveText('Résultat de l’évaluation');
});
test('Entrée permet de continuer après Natures et à la fin de chaque étape',async({page})=>{
 await start(page);
 for(let i=0;i<5;i++){await page.locator('[data-option]').first().click();await page.locator('#next').click();await page.locator('#next').click()}
 await expect(page.locator('#go')).toBeVisible();
 await page.keyboard.press('Enter');
 await expect(page.getByText('Identifiez la classe grammaticale')).toBeVisible();
 await page.locator('[data-class=nom]').click();
 await page.keyboard.press('Enter');
 await expect(page.getByText('Mot 2 / 5')).toBeVisible();
});

test('la difficulté est obligatoire et aucune étoile ne démarre sélectionnée',async({page})=>{
 await expect(page.locator('#stars')).toHaveValue('');
 await expect(page.locator('.star-choice.active')).toHaveCount(0);
 await page.locator('#name').fill('Élève test');
 await page.locator('#begin').click();
 await expect(page.getByRole('alert')).toContainText('Choisissez un niveau de difficulté en cliquant sur une étoile.');
 await page.locator('[data-star="1"]').click();
 await page.locator('#begin').click();
 await expect(page.getByText('Conjugaison',{exact:true})).toBeVisible();
});
test('Entrée passe à la suite sans ouvrir le corrigé de conjugaison',async({page})=>{
 await start(page,{correction:'end'});
 for(let i=0;i<5;i++){await page.locator('[data-option]').first().click();await page.locator('#next').click()}
 await expect(page.locator('.correction-details')).not.toHaveAttribute('open','');
 await page.keyboard.press('Enter');
 await expect(page.getByText('Identifiez la classe grammaticale')).toBeVisible();
});
test('le texte reste consultable pendant le QCM',async({page})=>{
 await start(page,{keep:'yes'});
 await completeConj(page,5);
 await completeNatures(page,5);
 page.on('dialog',d=>d.accept());
 await page.locator('#next').click();
 await expect(page.locator('.reading-reference')).toHaveAttribute('open','');
 await expect(page.locator('.reading-reference article.story')).toBeVisible();
});
test('Entrée valide les réponses du QCM de compréhension',async({page})=>{
 await start(page);
 await completeConj(page,5);
 await completeNatures(page,5);
 page.on('dialog',d=>d.accept());
 await page.locator('#next').click();
 await page.locator('[data-option]').first().click();
 await page.keyboard.press('Enter');
 await expect(page.getByText('Question 2 / 10')).toBeVisible();
 await expect(page.locator('#next')).toHaveText('Valider');
});
