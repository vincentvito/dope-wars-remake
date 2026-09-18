// Run against the local app without Supabase credentials to verify failure/retry UX.
// Server success and guest database writes are covered by the action and SQL tests.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';
const output = process.env.TEST_ARTIFACTS_ROOT ?? '/tmp/dope-score-checks';
const fixtures = JSON.parse(await fs.readFile(process.env.GAME_FIXTURES_PATH ?? '/tmp/dope-fixtures.json', 'utf8'));
const errors = [];
await fs.mkdir(output, { recursive: true });
try {
  for (const viewport of [{ width: 320, height: 568 }, { width: 375, height: 667 }, { width: 1440, height: 900 }]) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(saved => {
      if (!localStorage.getItem('dope-wars-save')) localStorage.setItem('dope-wars-save', saved);
    }, fixtures['last-day']);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(base + '/game');
    await page.getByRole('button', { name: 'Brooklyn', exact: true }).click();
    await page.getByRole('button', { name: /Brooklyn/ }).click();
    const nickname = page.getByLabel('Your nickname');
    await nickname.waitFor();
    assert.equal(JSON.parse(await page.evaluate(() => window.render_game_to_text())).phase, 'game_over');
    await nickname.fill('has space');
    assert.equal(await nickname.evaluate(input => input.checkValidity()), false);
    await nickname.fill('Street_1');
    assert.equal(await nickname.evaluate(input => input.checkValidity()), true);
    await page.getByRole('button', { name: 'POST MY SCORE' }).click();
    await page.getByRole('alert').filter({ hasText: /temporarily unavailable/ }).waitFor();
    assert.match(await page.getByRole('alert').filter({ hasText: /temporarily unavailable/ }).innerText(), /temporarily unavailable/);
    assert.equal(await nickname.inputValue(), 'Street_1');
    await page.getByRole('button', { name: 'TRY AGAIN' }).click();
    await page.getByRole('button', { name: 'TRY AGAIN' }).waitFor();
    await page.screenshot({ path: `${output}/score-retry-${viewport.width}.png`, animations: 'disabled' });
    await page.reload();
    await nickname.waitFor();
    assert.equal(JSON.parse(await page.evaluate(() => window.render_game_to_text())).phase, 'game_over');
    await page.screenshot({ path: `${output}/score-prompt-${viewport.width}.png`, animations: 'disabled' });
    assert.equal(await page.getByRole('dialog').evaluate(el => el.scrollWidth > el.clientWidth), false);
    await page.goto(base + '/leaderboard');
    await page.getByRole('alert').filter({ hasText: /temporarily unavailable/ }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Classic · 30 days' }).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.getByText('0 total scores', { exact: true }).count(), 0);
    assert.equal(await page.getByText(/No scores yet/).count(), 0);
    await page.getByRole('searchbox', { name: 'Search by username' }).fill('Street_1');
    await page.getByRole('button', { name: 'Pro · 45 days' }).click();
    await page.getByRole('alert').filter({ hasText: /temporarily unavailable/ }).waitFor();
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
    assert.equal(new URL(page.url()).searchParams.get('mode'), 'pro_45');
    await page.reload();
    assert.equal(await page.getByRole('button', { name: 'Pro · 45 days' }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Classic · 30 days' }).click();
    await page.getByRole('alert').filter({ hasText: /temporarily unavailable/ }).waitFor();
    await page.screenshot({ path: `${output}/leaderboard-unavailable-${viewport.width}.png`, animations: 'disabled' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: guest posting prompt, nickname validation, unavailable service, retry, saved-result reload, mode/search navigation and layouts at 320, 375, 1440px; no browser errors.');
} finally { await browser.close(); }
