const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const origin = 'http://127.0.0.1:4173';
const output = path.resolve(__dirname, '../test-output');
fs.mkdirSync(output, { recursive: true });
const report = { origin, passed: false, checks: [], screenshots: [], pageErrors: [], protectedRequests: [], storageChecks: [] };

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const context = await browser.newContext({ viewport: { width: 393, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname.startsWith('/api/')) report.protectedRequests.push({ path: url.pathname, method: request.method() });
  });
  await context.addInitScript(() => {
    window.__foundationStorageCalls = [];
    for (const name of ['getItem', 'setItem', 'removeItem', 'clear']) {
      const original = Storage.prototype[name];
      Storage.prototype[name] = function (...args) {
        window.__foundationStorageCalls.push({ method: name, key: args[0] || null });
        return original.apply(this, args);
      };
    }
  });

  const pass = name => { report.checks.push(name); console.log(`PASS ${name}`); };
  async function heading(expected) {
    const h1 = page.getByRole('heading', { level: 1 });
    await h1.waitFor();
    assert.equal((await h1.innerText()).replace(/\s+/g, ' ').trim(), expected);
  }
  async function noOverflow(label) {
    for (const width of [320, 393, 736]) {
      await page.setViewportSize({ width, height: 1000 });
      const geometry = await page.evaluate(() => ({ available: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
      assert.ok(geometry.document <= geometry.available + 1 && geometry.body <= geometry.available + 1,
        `${label} overflows at ${width}: ${JSON.stringify(geometry)}`);
    }
    await page.setViewportSize({ width: 393, height: 1000 });
    pass(`${label}: no horizontal overflow at 320/393/736px`);
  }
  async function screenshot(name) {
    const filename = path.join(output, name);
    await page.screenshot({ path: filename, fullPage: true });
    report.screenshots.push(filename);
  }
  async function storageCheck(label) {
    const values = await page.evaluate(() => ({ localKeys: Object.keys(localStorage), sessionKeys: Object.keys(sessionStorage),
      calls: window.__foundationStorageCalls || [] }));
    report.storageChecks.push({ label, ...values });
    assert.deepEqual(values.localKeys, []);
    assert.deepEqual(values.sessionKeys, []);
    assert.deepEqual(values.calls, []);
    assert.deepEqual(await context.cookies(), []);
    pass(`${label}: no browser-storage or fake-auth data`);
  }
  async function question(number, title, choices = []) {
    await heading(title);
    assert.equal(await page.locator('.question-progress').getAttribute('aria-label'), `Question ${number} of 11`);
    for (const choice of choices) await page.getByRole('button', { name: choice, exact: true }).click();
  }
  const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();

  try {
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await heading('Meet your little protector.');
    assert.match(await page.locator('.build-status').innerText(), /email sign-in and cloud saving are not available yet/);
    await noOverflow('Welcome');
    await screenshot('foundation-welcome.png');

    await page.getByRole('button', { name: 'I already have a list', exact: true }).click();
    await heading('Growing together.');
    assert.match(await page.locator('main').innerText(), /Email sign-in is being connected/);
    assert.equal(await page.locator('input[type="email"],input[type="password"]').count(), 0);
    await noOverflow('Unconfigured account');
    await page.getByRole('button', { name: 'Back to the beginning', exact: true }).click();
    await heading('Meet your little protector.');
    pass('Account entry is honest and has a working exit');

    await page.getByRole('button', { name: 'Let’s begin', exact: true }).click();
    await question(1, 'What brought you here today?');
    assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).isDisabled(), true);
    await page.getByRole('button', { name: 'I’d like to feel more at ease on my own.', exact: true }).click();
    await next();
    await question(2, 'What does home look like for you right now?', ['I live on my own.']);
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await question(1, 'What brought you here today?', ['I want to trust myself a little more.']);
    await next();
    await question(2, 'What does home look like for you right now?');
    assert.equal(await page.getByRole('button', { name: 'I live on my own.', exact: true }).getAttribute('aria-pressed'), 'true');
    pass('Previous-answer Back/edit retains the current in-page choices');
    await next();

    await question(3, 'When would you most like to feel, “I can handle this”?', ['When I’m unwell and need to rest.']);
    assert.match(await page.locator('.gentle-comment').innerText(), /small moments of “I did that.”/);
    await noOverflow('Question with conditional comment');
    await screenshot('foundation-question.png');
    await next();
    await question(4, 'What makes that feel difficult?', ['It feels like everything depends on me.', 'I don’t know who I could turn to.']);
    await next();
    await question(5, 'How does this feel for you lately?', ['A little uncertain.']);
    assert.match(await page.locator('.gentle-comment').innerText(), /do not have to do everything yourself/);
    await next();
    await question(6, 'What might make it hard to take a first step?', ['My energy is low.', 'I need to keep costs down.']);
    await page.getByRole('button', { name: 'Nothing in particular.', exact: true }).click();
    assert.equal(await page.locator('.choice[aria-pressed="true"]').count(), 1);
    await page.getByRole('button', { name: 'My energy is low.', exact: true }).click();
    await page.getByRole('button', { name: 'I need to keep costs down.', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Nothing in particular.', exact: true }).getAttribute('aria-pressed'), 'false');
    pass('Exclusive constraint choice clears and restores multi-choice selection correctly');
    await next();
    await question(7, 'What already helps you find your footing?', ['Familiar routines.']);
    await next();
    await question(8, 'What would a stronger sense of safety feel like for you?', [
      '“I have things in place that help me feel more prepared.”', '“I feel freer to enjoy life on my own.”'
    ]);
    await page.getByRole('button', { name: '“I trust myself to take care of me.”', exact: true }).click();
    assert.equal(await page.locator('.choice[aria-pressed="true"]').count(), 2);
    await noOverflow('Long multi-choice question');
    pass('The two-choice preference limit is enforced');
    await next();
    await question(9, 'How would you like us to help you begin?', ['Suggest one gentle first step.']);
    await next();
    await question(10, 'Which country are you based in?');
    await page.getByLabel('Country or region', { exact: true }).selectOption('US');
    await next();
    await question(11, 'Anything else you’d like us to understand?');
    await page.getByLabel('Anything else to understand', { exact: true }).fill('Synthetic private note for the browser test only.');
    assert.match(await page.locator('main').innerText(), /not saved to your profile/);
    await next();
    await heading('What would you like to build?');
    pass('All 11 established questions lead to the interest screen');
    await page.getByRole('button', { name: 'Sick-day care', exact: true }).click();
    await page.getByRole('button', { name: 'Pet-care plans', exact: true }).click();
    assert.equal(await page.locator('.bubbles button[aria-pressed="true"]').count(), 2);
    await noOverflow('Interests');
    await next();

    await heading('A starting point that feels like you.');
    assert.match(await page.locator('main').innerText(), /Sick-day care · Pet-care plans/);
    assert.match(await page.locator('main').innerText(), /kept only while this page is open/);
    assert.equal(await page.getByRole('button', { name: 'Save my starting point', exact: true }).count(), 0);
    await page.getByText('Review my answers', { exact: true }).click();
    await page.getByRole('button', { name: 'Edit How would you like us to help you begin?', exact: true }).click();
    await question(9, 'How would you like us to help you begin?', ['Show me useful tools and resources.']);
    await page.getByRole('button', { name: 'Keep answer', exact: true }).click();
    await heading('A starting point that feels like you.');
    if (!(await page.locator('.answer-review').getAttribute('open'))) await page.getByText('Review my answers', { exact: true }).click();
    assert.match(await page.locator('.answer-review').innerText(), /Show me useful tools and resources/);
    pass('Recap edit returns directly with the updated answer');
    await noOverflow('Expanded recap');
    await page.getByText('Review my answers', { exact: true }).click();
    await screenshot('foundation-recap.png');

    await page.getByRole('button', { name: 'Your account', exact: true }).click();
    await heading('Growing together.');
    await page.goBack();
    await heading('A starting point that feels like you.');
    pass('Browser Back returns from account to the current recap');
    await storageCheck('Completed funnel');
    await page.reload({ waitUntil: 'networkidle' });
    await heading('A starting point that feels like you.');
    assert.match(await page.locator('main').innerText(), /Explore along the way/);
    assert.doesNotMatch(await page.locator('main').innerText(), /Sick-day care · Pet-care plans|Synthetic private note|Your starting point is saved/);
    assert.match(await page.locator('main').innerText(), /kept only while this page is open/);
    await page.getByRole('button', { name: 'Back to the beginning', exact: true }).click();
    await heading('Meet your little protector.');
    pass('Refresh clears transient choices without claiming saved data and leaves a working exit');
    await storageCheck('After refresh');
    assert.deepEqual(report.protectedRequests, []);
    pass('Unconfigured identity makes zero protected API requests');
    assert.deepEqual(report.pageErrors, []);
    pass('No JavaScript page errors');
    report.passed = true;
  } catch (error) {
    report.error = { name: error.name, message: error.message };
    await page.screenshot({ path: path.join(output, 'foundation-failure.png'), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    fs.writeFileSync(path.join(output, 'foundation-verification.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
  }
  console.log(JSON.stringify({ passed: report.passed, count: report.checks.length, screenshots: report.screenshots }));
})().catch(error => { console.error(error); process.exitCode = 1; });
