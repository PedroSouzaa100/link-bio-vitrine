# Vitrine Moda · Link na bio

Página de apresentação para usar na bio do Instagram. Explica o objetivo da Vitrine Moda antes de oferecer apenas dois acessos:

- **Acessar o site:** https://vitrine-moda.shop/
- **Falar pelo WhatsApp:** número (31) 98672-4476, com uma mensagem de apresentação já preenchida.

A mensagem só é enviada se o visitante confirmar no WhatsApp. A página funciona mesmo sem JavaScript e não usa cookies, armazenamento local, formulários ou rastreamento.

## Executar

Use Node.js 24 e npm. A versão validada neste ambiente é Node.js 24.19.0.

```sh
npm ci
npm run dev
```

O servidor de desenvolvimento usa a porta 5173. Para gerar a versão publicável:

```sh
npm run build
```

O resultado é salvo em `dist/`. `npm run preview` permite validar esse resultado na porta 4173.

## Publicar no Netlify

1. Importe o repositório `PedroSouzaa100/link-bio-vitrine` e selecione a branch `main`.
2. O `netlify.toml` configura automaticamente o build `npm run build`, a pasta de publicação `dist` e o Node.js 24.
3. Após o deploy, copie o endereço fornecido pelo Netlify e use-o no campo de links da bio do Instagram.

Use um endereço próprio para a página da bio, como o endereço fornecido pelo Netlify ou um subdomínio. Mantenha `vitrine-moda.shop` apontando para a vitrine existente, pois o botão desta página leva para esse site. Apontar o mesmo domínio para a bio faria o botão voltar para a própria página.

## Personalizar

- `index.html`: apresentação, marca, metadados e os dois destinos. O telefone público do WhatsApp está no link no formato internacional `5531986724476`.
- `src/bio.css`: cores, fontes, espaçamento e layout responsivo.
- `public/favicon.svg`: ícone da página.
- `public/_headers`: cabeçalhos de segurança aplicados pelo Netlify.

As fontes são servidas junto com o site; a página não depende de recursos externos para renderizar. Não são necessárias variáveis de ambiente, banco de dados ou chaves de API.

## Verificar

```sh
npm run build
npm test
```

Os testes de navegador verificam os destinos e a mensagem do WhatsApp, a apresentação antes dos links, navegação por teclado, layout em celular e funcionamento sem JavaScript. Os cliques externos são interceptados pelos testes: nenhuma mensagem é enviada nem requisição real é feita aos destinos.

O Playwright usa `/usr/bin/chromium` quando disponível. Em outra máquina, instale o navegador com `npx playwright install chromium` ou configure `PLAYWRIGHT_CHROMIUM_EXECUTABLE`. O servidor de teste é iniciado automaticamente.

## Ambiente da nuvem

Use o checkout existente em `/workspace/link-bio-vitrine`. Cada tarefa já é isolada; não crie um Git worktree sem pedido explícito. O servidor precisa ser reiniciado em cada tarefa, mesmo que as dependências e o build tenham sido preservados na imagem.
