/* Release verification: isolated browser context and newly-created synthetic pets only. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const base = process.env.LIVING_GENOME_BASE_URL || 'http://127.0.0.1:3001';
const output = '/tmp/living-genome-evidence';
const viewports = [
  {width:320,height:568}, {width:360,height:800}, {width:390,height:844},
  {width:430,height:932}, {width:844,height:390}, {width:1280,height:800},
];
(async () => {
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:viewports[2],hasTouch:true,reducedMotion:'reduce'});
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const report={viewports:[],capture:false,breeding:false,certificate:false,arcade:false,errors};
  async function go(route) {
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded'});
    assert.ok(response && response.ok(),`${route} returned ${response?.status()}`);
  }
  async function skipTutorial() {
    const tutorial=page.getByRole('dialog',{name:'Meta-Pet tutorial'});
    if(await tutorial.isVisible()) await tutorial.getByRole('button',{name:'Skip',exact:true}).click();
  }
  async function noOverflow(scope='body') {
    const result=await page.locator(scope).evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,viewport:innerWidth,page:document.documentElement.scrollWidth}));
    assert.ok(result.page<=result.viewport+1,`Page overflow: ${JSON.stringify(result)}`);
    assert.ok(result.scroll<=result.width+1,`${scope} overflow: ${JSON.stringify(result)}`);
  }
  async function recordState() {
    return page.evaluate(async()=>{
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('MetaPetRegistryDB',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
      const read=(store,key)=>new Promise((resolve,reject)=>{const r=key===undefined?db.transaction(store).objectStore(store).getAll():db.transaction(store).objectStore(store).get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
      const active=await read('registryMeta','activePetId'); const records=await read('petRecords');db.close();
      return {active,count:records.length};
    });
  }
  try {
    await go('/pet');
    await page.getByRole('button',{name:/Advanced \/ Mechanics Lab/}).waitFor();
    await skipTutorial();
    await page.waitForFunction(()=>document.querySelector('[data-testid$="pet-runtime"]'));
    await page.waitForFunction(async()=>{
      if(!(await indexedDB.databases()).some(db=>db.name==='MetaPetRegistryDB')) return false;
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('MetaPetRegistryDB',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
      if(!db.objectStoreNames.contains('registryMeta')){db.close();return false;}
      const active=await new Promise((resolve,reject)=>{const r=db.transaction('registryMeta').objectStore('registryMeta').get('activePetId');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});db.close();return !!active;
    });
    const initial=await recordState();assert.ok(initial.active);

    await go('/app/battle');
    await page.locator('[data-geometry-sprite]>svg').first().waitFor();
    await page.getByRole('button',{name:'Enter Arena',exact:true}).click();
    await page.getByRole('heading',{name:'Choose Your Opponent'}).waitFor();
    await page.locator('.living-world .grid.grid-cols-2 button').first().click();
    const move=page.locator('.living-move').first();
    const pp=Number((await move.innerText()).match(/PP\s+(\d+)/)[1]);
    await move.click();
    await page.waitForFunction(()=>document.querySelector('.living-move[aria-pressed="true"]') && document.querySelector('.living-world[aria-busy="false"]'));
    assert.equal(Number((await move.innerText()).match(/PP\s+(\d+)/)[1]),pp-1);
    for(const viewport of viewports) {
      await page.setViewportSize(viewport);
      const svg=page.locator('[data-geometry-sprite]>svg').first();
      const box=await svg.boundingBox();
      assert.ok(box && box.width>=80 && box.height>=80 && Math.abs(box.width-box.height)<2,`Geometry viewport collapsed: ${JSON.stringify(box)}`);
      await noOverflow('.living-world');
      const controls=await page.locator('.living-move').evaluateAll(nodes=>nodes.map(node=>({w:node.getBoundingClientRect().width,h:node.getBoundingClientRect().height,scroll:node.scrollWidth,width:node.clientWidth})));
      assert.ok(controls.every(c=>c.w>=44 && c.h>=44 && c.scroll<=c.width+1),JSON.stringify(controls));
      await page.screenshot({path:`${output}/battle-${viewport.width}x${viewport.height}.png`,fullPage:true});
      report.viewports.push({screen:'battle',...viewport,overflow:false,geometry:box});
    }

    await go('/app/activities?tab=vimana');
    await page.getByRole('combobox',{name:'Destination'}).waitFor();
    await page.getByRole('combobox',{name:'Destination'}).selectOption({index:1});
    for(const viewport of viewports) {
      await page.setViewportSize(viewport);await noOverflow('.living-world');
      assert.ok(await page.getByRole('combobox',{name:'Destination'}).evaluate(node=>parseFloat(getComputedStyle(node).fontSize)>=16));
      if(viewport.width<768) assert.ok(await page.locator('.vimana-inspector').evaluate(node=>getComputedStyle(node).order==='-1'));
      await page.screenshot({path:`${output}/vimana-${viewport.width}x${viewport.height}.png`,fullPage:true});
      report.viewports.push({screen:'vimana',...viewport,overflow:false});
    }
    await page.setViewportSize(viewports[2]);
    const scan=page.locator('.vimana-inspector').getByRole('button',{name:/Detect Signal|Scan Signal|Enter Field|Deep Scan/}).first();
    if(await scan.count()) await scan.click();

    await go('/pet');await page.getByRole('button',{name:/Advanced \/ Mechanics Lab/}).waitFor();await skipTutorial();
    await page.getByRole('button',{name:/Advanced \/ Mechanics Lab/}).click();
    await page.getByRole('tab',{name:'Systems',exact:true}).click();
    await page.getByRole('button',{name:'Breed Geometry',exact:true}).click();
    const chamber=page.getByTestId('breeding-chamber');await chamber.waitFor();
    const founder=chamber.getByRole('button',{name:'Awaken Second Founder'});
    if(await founder.count()) { await founder.click(); }
    await chamber.getByRole('button',{name:'Blend Geometry',exact:true}).waitFor();
    await chamber.getByLabel('Offspring name').fill('QA hatchling');
    await chamber.getByRole('button',{name:'Blend Geometry',exact:true}).click();
    await chamber.getByRole('button',{name:'Register This Exact Child'}).waitFor();
    await noOverflow('.lineage-chamber');
    await page.screenshot({path:`${output}/breeding-mobile.png`,fullPage:true});
    await chamber.getByRole('button',{name:'Register This Exact Child'}).click();
    await chamber.getByRole('button',{name:'View birth certificate'}).waitFor();report.breeding=true;
    await chamber.getByRole('button',{name:'View birth certificate'}).click();
    const certificate=page.getByRole('dialog',{name:'Registration certificate'});await certificate.waitFor();
    await certificate.getByRole('heading',{name:'QA hatchling',exact:true}).waitFor();
    for(const viewport of viewports) {
      await page.setViewportSize(viewport);await noOverflow('.registry-dialog');
      await certificate.getByRole('button',{name:'Save pet backup'}).scrollIntoViewIfNeeded();
      const close=certificate.getByRole('button',{name:'Close certificate'});
      const closeBox=await close.boundingBox(),dialogBox=await certificate.boundingBox();
      assert.ok(closeBox && dialogBox && closeBox.y>=dialogBox.y-1 && closeBox.y+closeBox.height<=dialogBox.y+dialogBox.height+1,`Close is unreachable: ${JSON.stringify({closeBox,dialogBox})}`);
      await page.screenshot({path:`${output}/certificate-${viewport.width}x${viewport.height}.png`,fullPage:true});
      report.viewports.push({screen:'certificate',...viewport,overflow:false});
    }
    const download=page.waitForEvent('download');await certificate.getByRole('button',{name:'Save pet backup'}).click();
    const backup=await download;assert.match(await fs.readFile(await backup.path(),'utf8'),/^MP2\./);
    await page.keyboard.press('Escape');await certificate.waitFor({state:'hidden'});report.certificate=true;
    const after=await recordState();assert.equal(after.active,initial.active);assert.equal(after.count,3);

    await page.setViewportSize(viewports[2]);await go('/app/battle');
    await page.locator('[data-geometry-sprite]>svg').first().waitFor();
    await page.getByRole('button',{name:'Play geometry in Monkey Invaders',exact:true}).click();
    await page.waitForURL('**/monkey-invaders.html');
    await page.getByRole('button',{name:'Pilot: Geometry',exact:true}).waitFor();report.capture=true;
    await page.getByRole('button',{name:'Pilot: Geometry',exact:true}).click();
    await page.getByRole('button',{name:'Pilot: Monkey',exact:true}).click();
    await page.getByRole('button',{name:'Pilot: Geometry',exact:true}).waitFor();
    await page.getByRole('button',{name:'Insert Coin',exact:true}).click();
    await page.getByRole('button',{name:/^(Press Start|Tap Level To Start)$/}).click();
    await page.locator('#startScreen').waitFor({state:'hidden'});
    for(const viewport of [viewports[2],viewports[4]]) {
      await page.setViewportSize(viewport);await noOverflow();
      await page.screenshot({path:`${output}/invaders-${viewport.width}x${viewport.height}.png`,fullPage:true});
    }
    report.arcade=true;
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify(report));
  } finally {
    await fs.writeFile(`${output}/result.json`,JSON.stringify(report,null,2));
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exit(1);});
