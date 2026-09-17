// Run with a separately installed Playwright; see README verification notes.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';
const output = process.env.TEST_ARTIFACTS_ROOT ?? '/tmp/dope-wars-checks';
await fs.mkdir(output, { recursive: true });
const fixtures = JSON.parse(await fs.readFile(process.env.GAME_FIXTURES_PATH ?? '/tmp/dope-fixtures.json', 'utf8'));
const errors = [];
const results = [];
async function open(fixture, viewport = { width:375,height:667 }, extra = {}) {
  const context = await browser.newContext({ viewport, ...extra });
  await context.addInitScript(saved => {
    if (!localStorage.getItem('test-initialized')) {
      if (saved) localStorage.setItem('dope-wars-save', saved);
      localStorage.setItem('test-initialized', '1');
    }
  }, fixture);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', e => { if(e.type()==='error') errors.push(e.text()); });
  await page.goto(base+'/game');
  await page.waitForFunction(() => !!window.render_game_to_text);
  if (fixture !== 'corrupt') await page.waitForFunction(() => JSON.parse(window.render_game_to_text()).phase);
  return { page, context };
}
const state = page => page.evaluate(() => JSON.parse(window.render_game_to_text()));
const snap = async (page, name) => { await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {})))); await page.screenshot({path:`${output}/${name}.png`, animations:'disabled'}); };
const visible = async locator => { await locator.waitFor({state:'visible'}); assert(await locator.isVisible()); };
try {
  // Real onboarding, returning home, and the continue path.
  {
    const context=await browser.newContext({viewport:{width:320,height:568}});const page=await context.newPage();
    await page.goto(base); await page.getByRole('button',{name:'NEW GAME',exact:true}).click();
    await page.getByRole('button',{name:'30 DAYS',exact:true}).click(); await page.getByRole('button',{name:'SKIP',exact:true}).click();
    await visible(page.getByRole('button',{name:'Buy Ecstasy',exact:true}));
    const before=await state(page);await page.goto(base);await page.getByRole('link',{name:/CONTINUE/}).click();
    assert.equal((await state(page)).seed,before.seed);await snap(page,'onboarding-320');await context.close();results.push('onboarding and Continue');
  }
  for (const viewport of [{width:320,height:568},{width:375,height:667},{width:768,height:1024},{width:1440,height:900},{width:667,height:375}]) {
    const {page,context}=await open(fixtures.classic,viewport);
    const before=await state(page);
    await page.getByRole('button',{name:'Buy Ecstasy',exact:true}).click();
    await page.getByLabel('Exact quantity',{exact:true}).fill('2');
    await page.getByRole('button',{name:'Buy 2 Ecstasy',exact:true}).click();
    assert.equal((await state(page)).cash,before.cash-before.market.Ecstasy*2);
    await page.getByRole('button',{name:'Sell Ecstasy',exact:true}).click();await page.getByLabel('Exact quantity',{exact:true}).fill('1');
    await page.getByRole('button',{name:'Sell 1 Ecstasy',exact:true}).click();
    assert.equal((await state(page)).inventory.find(s=>s.drug==='Ecstasy').quantity,1);
    await page.getByRole('button',{name:/^Bank:/}).click();await page.getByLabel('Exact deposit amount',{exact:true}).fill('500');
    await page.getByRole('button',{name:'Deposit',exact:true}).click();assert.equal((await state(page)).bank,500);
    await page.getByLabel('Exact withdrawal amount',{exact:true}).fill('100');await page.getByRole('button',{name:'Withdraw',exact:true}).click();
    assert.equal((await state(page)).bank,400);
    for(let tab=0;tab<12;tab++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>!!document.activeElement.closest('[role="dialog"]')));}
    await snap(page,`bank-${viewport.width}x${viewport.height}`);await page.keyboard.press('Escape');
    await page.getByRole('button',{name:/^Debt:/}).click();await page.getByLabel('Exact debt payment',{exact:true}).fill('100');
    await page.getByRole('button',{name:'Pay',exact:true}).click();assert.equal((await state(page)).debt,4900);await page.keyboard.press('Escape');
    const saved=await state(page);await page.reload();await page.waitForFunction(()=>!!window.render_game_to_text);
    assert.deepEqual(await state(page),saved);
    const overflows=await page.evaluate(()=>[...document.querySelectorAll('.market-row')].some(e=>e.scrollWidth>e.clientWidth+1));assert.equal(overflows,false);
    // The final row and both actions remain scrollable above the footer.
    await page.getByRole('button',{name:'Buy Weed',exact:true}).evaluate(el => { for(let p=el.parentElement;p;p=p.parentElement) if(getComputedStyle(p).overflowY==='auto') {p.scrollTop=p.scrollHeight;break;} });
    const lastRow=await page.getByRole('button',{name:'Buy Weed',exact:true}).boundingBox();
    const footer=await page.getByText('Travel · one day per trip',{exact:true}).boundingBox();
    if(lastRow.y+lastRow.height > footer.y) { console.log({viewport,lastRow,footer}); await snap(page,'footer-failure'); }
    assert(lastRow.y+lastRow.height <= footer.y, 'last trade row must scroll above travel footer');
    await snap(page,`market-${viewport.width}x${viewport.height}`);
    const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));assert(!resources.some(r=>/sprites\/(events|combat)\/.*\.gif/.test(r)));
    await context.close();results.push(`trade, finance, reload, focus, layout ${viewport.width}x${viewport.height}`);
  }
  for(const fixture of ['event','combat','pro-event','pro-combat','pro-armed-combat']) {
    const {page,context}=await open(fixtures[fixture]);const before=await state(page);
    await snap(page,fixture);await page.reload();await page.waitForFunction(()=>!!window.render_game_to_text);assert.deepEqual(await state(page),before);
    if(before.phase==='event') {
      const choice=page.getByRole('button',{name:'Take it!',exact:true});
      if(await choice.count())await choice.click();else await page.getByRole('button',{name:'Continue',exact:true}).click();
      assert.notEqual((await state(page)).phase,'event');
    } else {
      await page.getByRole('button',{name:'Fight!',exact:true}).click();
      if((await state(page)).phase==='loadout') { await page.getByRole('button',{name:/ARM & FIGHT/}).click(); }
      // Reload after a round and compare exact replayed state.
      const round=await state(page);await page.reload();await page.waitForFunction(()=>!!window.render_game_to_text);assert.deepEqual(await state(page),round);
      if(round.phase==='combat'){await page.getByRole('button',{name:'Run!',exact:true}).click();}
    }
    await snap(page,fixture+'-resolved');await context.close();results.push(fixture+' resume and actions');
  }
  {
    const {page,context}=await open(fixtures['last-day']);
    await page.getByRole('button',{name:'Brooklyn',exact:true}).click();
    await visible(page.getByText('Warning: This is the last day! Traveling will end the game.'));
    await page.getByRole('button',{name:/Brooklyn/}).click();assert.equal((await state(page)).phase,'game_over');
    await snap(page,'game-over');await page.reload();await page.waitForFunction(()=>!!window.render_game_to_text);assert.equal((await state(page)).phase,'game_over');
    await page.getByRole('button',{name:'PLAY AGAIN',exact:true}).click();assert.equal((await state(page)).currentDay,1);
    await context.close();results.push('final-day warning, game over, restore, restart');
  }
  {
    const {page,context}=await open('corrupt');await visible(page.getByText('Saved progress could not be loaded.',{exact:false}));await page.getByRole('button',{name:'START NEW GAME'}).click();assert.equal((await state(page)).currentDay,1);await context.close();results.push('corrupt save recovery');
  }
  {
    const {page,context}=await open(fixtures['combat'],{width:375,height:667},{reducedMotion:'reduce'});
    await page.waitForFunction(()=>[...document.images].some(i=>i.currentSrc.endsWith('-still.webp')));
    await snap(page,'reduced-motion');await context.close();results.push('reduced-motion still art');
  }
  {
    const {page,context}=await open(fixtures['pro-assets']);
    await page.getByRole('button',{name:/Assets/}).click();
    await page.getByRole('button',{name:'Buy Stash House',exact:true}).click();
    assert((await state(page)).assets.some(a=>a.type==='Stash House'));
    await page.getByRole('button',{name:'Open Lab',exact:true}).click();
    await page.getByRole('button',{name:/Speed/}).click();
    await snap(page,'pro-lab');await page.getByRole('button',{name:'CUT DRUGS',exact:true}).click();
    assert.notEqual((await state(page)).phase,'lab');
    await context.close();results.push('Pro assets and lab');
  }
  {
    const {page,context}=await open(fixtures['pro-lab-pending']);
    await visible(page.getByRole('button',{name:'CUT DRUGS',exact:true}));
    await page.getByRole('button',{name:'CANCEL',exact:true}).click();assert.equal((await state(page)).phase,'market');
    await page.getByRole('button',{name:/Travel/}).click();
    const before=await state(page);await page.getByRole('button',{name:'Travel to Miami',exact:true}).click();
    const after=await state(page);assert.equal(after.currentDistrict,'Miami');assert.equal(after.currentDay,before.currentDay+1);
    await context.close();results.push('pending lab recovery and unlocked city travel');
  }
  {
    const {page,context}=await open(fixtures.pro);
    await page.getByRole('button',{name:/Travel/}).click();assert(await page.getByRole('button',{name:'Travel to Medellin',exact:true}).isDisabled());
    await context.close();results.push('locked cities stay disabled');
  }
  {
    const context=await browser.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true});
    await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage disabled','SecurityError');};Storage.prototype.getItem=function(){throw new DOMException('Storage disabled','SecurityError');};});
    const page=await context.newPage();await page.goto(base+'/game');await page.getByRole('button',{name:'START NEW GAME'}).tap();
    await visible(page.getByText('Progress could not be saved on this device.',{exact:false}));
    await page.getByRole('button',{name:/^Bank:/}).tap();await visible(page.getByRole('dialog'));
    await context.close();results.push('touch input and unavailable storage');
  }
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:results,errors},null,2));
} finally { await browser.close(); }
