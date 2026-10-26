import { expect, test, type Page } from '@playwright/test';

async function openAurora(page: Page) {
  await page.getByRole('button', { name: 'Ver Vestido midi Aurora', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Vestido midi Aurora' });
  await expect(dialog).toBeVisible();
  return dialog;
}

test('catálogo carrega assets locais sem erros e não transborda a tela', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const failedResponses: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Seu estilo.');
  await expect(page.getByTestId('product-card')).toHaveCount(8);
  await expect(page.getByText('Prévia de desenvolvimento', { exact: false })).toBeVisible();
  await page.locator('img').evaluateAll((images) => images.forEach((image) => { if (image instanceof HTMLImageElement) image.loading = 'eager'; }));
  await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
  expect(failedResponses).toEqual([]);
  await page.screenshot({ path: `/tmp/vitrine-${testInfo.project.name}.png`, fullPage: true });
});

test('busca sem acentos, filtros, ordenação e estado vazio funcionam', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox', { name: 'Buscar produtos' }).fill('calca');
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await expect(page.getByTestId('product-card')).toContainText('Calça de alfaiataria Urban');
  await page.getByRole('searchbox').fill('produto inexistente xyz');
  await expect(page.getByTestId('product-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Nenhuma peça por aqui.' })).toBeVisible();
  await page.getByRole('button', { name: 'Limpar busca' }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(8);
  await page.getByRole('button', { name: 'Vestidos', exact: true }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Ordenar produtos' }).selectOption('price-desc');
  await expect(page.getByTestId('product-card').first()).toContainText('Vestido Noite');
  await page.getByRole('button', { name: 'Todos', exact: true }).click();
  await page.getByRole('combobox').selectOption('price-asc');
  await expect(page.getByTestId('product-card').first()).toContainText('Camiseta Todo Dia');
});

test('favoritos permanecem após recarregar e podem ser removidos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Adicionar Vestido midi Aurora aos favoritos', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remover Vestido midi Aurora dos favoritos' })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: 'Ver favoritos (1)' }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remover Vestido midi Aurora dos favoritos' }).click();
  await expect(page.getByTestId('product-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Seu estilo merece uma seleção.' })).toBeVisible();
});

test('janela nativa mantém foco e fecha com Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Ver Vestido midi Aurora', exact: true });
  const dialog = await openAurora(page);
  await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  for (let index = 0; index < 14; index += 1) await page.keyboard.press('Tab');
  await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('sacola preserva tamanho e quantidade, calcula subtotal e bloqueia pedidos demo', async ({ page }) => {
  await page.goto('/');
  const dialog = await openAurora(page);
  await dialog.getByRole('button', { name: 'M', exact: true }).click();
  await dialog.getByRole('button', { name: 'Aumentar quantidade' }).click();
  await dialog.getByRole('button', { name: 'Adicionar à sacola' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir sacola (2)' }).click();
  const cart = page.getByRole('dialog', { name: 'Sua sacola' });
  await expect(cart.getByText('M · Terracota')).toBeVisible();
  await expect(cart.getByTestId('cart-total')).toHaveText(/R\$\s*379,80/);
  await expect(cart.getByRole('button', { name: 'Pedidos indisponíveis nesta prévia' })).toBeDisabled();
  await expect(page.locator('a[href^="https://wa.me/"]')).toHaveCount(0);
  await cart.getByRole('button', { name: 'Aumentar Vestido midi Aurora' }).click();
  await expect(cart.getByTestId('cart-total')).toHaveText(/R\$\s*569,70/);
  await page.reload();
  await page.getByRole('button', { name: 'Abrir sacola (3)' }).click();
  await expect(cart.getByTestId('cart-total')).toHaveText(/R\$\s*569,70/);
  await cart.getByRole('button', { name: 'Diminuir Vestido midi Aurora' }).click();
  await expect(cart.getByTestId('cart-total')).toHaveText(/R\$\s*379,80/);
  await cart.getByRole('button', { name: 'Remover Vestido midi Aurora da sacola' }).click();
  await expect(cart.getByText('Sua sacola está vazia.', { exact: false })).toBeVisible();
});

test('dados inválidos no navegador não quebram o catálogo', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('vitrine:cart:v1', '{invalid json');
    localStorage.setItem('vitrine:favorites:v1', JSON.stringify(['fake-product', 42, {}, null]));
  });
  await page.goto('/');
  await expect(page.getByTestId('product-card')).toHaveCount(8);
  await expect(page.getByRole('button', { name: 'Ver favoritos (0)' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir sacola (0)' }).click();
  await expect(page.getByRole('dialog', { name: 'Sua sacola' }).getByText('Sua sacola está vazia.', { exact: false })).toBeVisible();
});

test('privacidade permite apagar sacola e favoritos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Adicionar Vestido midi Aurora aos favoritos' }).click();
  const product = await openAurora(page);
  await product.getByRole('button', { name: 'Adicionar à sacola' }).click();
  await page.getByRole('button', { name: 'Privacidade', exact: true }).click();
  const privacy = page.getByRole('dialog', { name: 'Sua privacidade importa.' });
  await privacy.getByRole('button', { name: 'Apagar minhas escolhas' }).click();
  await privacy.getByRole('button', { name: 'Fechar janela' }).click();
  await expect(page.getByRole('button', { name: 'Ver favoritos (0)' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir sacola (0)' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Abrir sacola (0)' })).toBeVisible();
});
