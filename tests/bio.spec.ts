import { expect, test } from '@playwright/test';

const storeUrl = 'https://vitrine-moda.shop/';
const whatsappPhone = '5531986724476';
const whatsappMessage = 'Olá! Vim pelo Instagram e gostaria de saber mais sobre a Vitrine Moda.';

test('apresenta o objetivo antes dos dois destinos corretos', async ({ page }, testInfo) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto('/');

  await expect(page).toHaveTitle(/Vitrine Moda/);
  await expect(page.getByRole('heading', { level: 1, name: 'Vitrine Moda' })).toBeVisible();
  const description = page.locator('.bio-description');
  const links = page.getByRole('navigation', { name: 'Acesse a vitrine ou fale comigo' });
  await expect(description).toBeVisible();
  await expect(description).toContainText(/moda|produtos/i);
  expect(await description.evaluate((element) => {
    const navigation = document.querySelector('nav');
    return navigation !== null && Boolean(element.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  await expect(links.getByRole('link')).toHaveCount(2);

  const website = links.getByRole('link', { name: /Acessar o site/ });
  const whatsapp = links.getByRole('link', { name: /Falar pelo WhatsApp/ });
  await expect(website).toHaveAttribute('href', storeUrl);
  const whatsappUrl = new URL((await whatsapp.getAttribute('href'))!);
  expect(whatsappUrl.origin).toBe('https://wa.me');
  expect(whatsappUrl.pathname).toBe(`/${whatsappPhone}`);
  expect(whatsappUrl.searchParams.get('text')).toBe(whatsappMessage);

  for (const link of [website, whatsapp]) {
    await expect(link).toHaveAttribute('target', '_blank');
    const rel = (await link.getAttribute('rel'))?.split(/\s+/) ?? [];
    expect(rel).toEqual(expect.arrayContaining(['noopener', 'noreferrer']));
  }
  expect(pageErrors).toEqual([]);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.screenshot({ path: `/tmp/vitrine-bio-${testInfo.project.name}.png`, fullPage: true });
});

test('permite navegação por teclado e cabe em telas de 320 pixels', async ({ page }) => {
  await page.goto('/');
  const website = page.getByRole('link', { name: /Acessar o site/ });
  const whatsapp = page.getByRole('link', { name: /Falar pelo WhatsApp/ });
  await website.focus();
  await page.keyboard.press('Tab');
  await expect(whatsapp).toBeFocused();
  expect(await whatsapp.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
  await page.keyboard.press('Shift+Tab');
  await expect(website).toBeFocused();

  await page.setViewportSize({ width: 320, height: 900 });
  await expect(website).toBeVisible();
  await expect(whatsapp).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  for (const link of [website, whatsapp]) {
    const bounds = await link.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
  }
});

test('os dois links abrem seus destinos mesmo sem JavaScript', async ({ browser, baseURL, page }) => {
  if (!baseURL) throw new Error('O teste precisa da baseURL local configurada no Playwright.');
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: page.viewportSize() ?? { width: 1280, height: 900 },
  });
  const requestedDestinations: string[] = [];
  for (const pattern of ['https://vitrine-moda.shop/**', 'https://wa.me/**']) {
    await context.route(pattern, async (route) => {
      requestedDestinations.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><html lang="pt-BR"><title>Destino interceptado</title><body>Link validado sem contato externo.</body></html>',
      });
    });
  }

  try {
    const bio = await context.newPage();
    await bio.goto(baseURL);
    await expect(bio.getByRole('heading', { level: 1, name: 'Vitrine Moda' })).toBeVisible();
    for (const name of [/Acessar o site/, /Falar pelo WhatsApp/]) {
      const link = bio.getByRole('link', { name });
      const destination = (await link.getAttribute('href'))!;
      const openedPage = context.waitForEvent('page');
      await link.click();
      const popup = await openedPage;
      await popup.waitForLoadState('domcontentloaded');
      await expect(popup).toHaveURL(destination);
      await expect(popup).toHaveTitle('Destino interceptado');
      await popup.close();
    }
    expect(requestedDestinations).toHaveLength(2);
    expect(requestedDestinations[0]).toBe(storeUrl);
    const whatsappUrl = new URL(requestedDestinations[1]);
    expect(whatsappUrl.pathname).toBe(`/${whatsappPhone}`);
    expect(whatsappUrl.searchParams.get('text')).toBe(whatsappMessage);
  } finally {
    await context.close();
  }
});
