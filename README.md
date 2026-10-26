# Vitrine Moda

Vitrine de moda responsiva em React + TypeScript, com busca, categorias, ordenação, favoritos, detalhes dos produtos e sacola. O projeto parte de um repositório vazio e usa `https://vitrine-moda.shop/` como referência informada pelo proprietário.

**Estado atual:** aplicação funcional para desenvolvimento, com catálogo, preços e ilustrações de demonstração. A identidade e o catálogo do site de referência ainda não foram importados. O envio de pedidos está bloqueado enquanto `catalogIsDemo` for `true`. Esta versão ainda não está pronta para vendas reais.

## Executar

Use Node.js 24 (versão validada: 24.19.0) e npm 11. Não são necessários banco de dados ou credenciais para desenvolver a vitrine.

```sh
cd /workspace/link-bio-vitrine
npm ci
npm run dev
```

O servidor usa a porta 5173. `npm run build` valida o TypeScript e gera a aplicação estática em `dist/`. `npm run preview` serve esse resultado na porta 4173.

## Verificar

```sh
npm run build
npm test
npm run test:e2e
```

Os testes de navegador usam o Chromium instalado em `/usr/bin/chromium` quando disponível. Em outra máquina, instale o navegador com `npx playwright install chromium`, ou defina `PLAYWRIGHT_CHROMIUM_EXECUTABLE` com o caminho do seu Chromium. O Playwright inicia o servidor automaticamente.

- Testes unitários: filtros, valores monetários, validação dos dados salvos, variações, limites de quantidade e montagem do link de atendimento.
- Testes de navegador: navegação desktop/mobile, busca, favoritos, sacola, persistência, modais e bloqueio de compra em demonstração.

## Configurar a loja real

| Arquivo | Conteúdo |
| --- | --- |
| `src/data/store.json` | Nome, apresentação, contato e políticas da loja; `catalogIsDemo` protege o catálogo ilustrativo. |
| `src/data/catalog.json` | Produtos, descrição, preço em **centavos inteiros**, variações, imagens e limite local de quantidade. |
| `public/images/` | Imagens locais. Os SVGs atuais são ilustrações originais de demonstração, não fotos de mercadorias. |
| `index.html` | Título, descrição de busca e ícone. |
| `src/styles.css` | Identidade visual e adaptação para celulares. |

Para preparar a loja para publicação:

1. Substitua todos os produtos e ilustrações de exemplo pelos produtos reais autorizados; revise preços, tamanhos, cores e descrições.
2. Confirme a identidade visual, os dados de contato, identificação do fornecedor e as políticas reais de entrega, troca e devolução.
3. Confirme o fluxo de compra desejado. A implementação atual prepara uma **consulta pelo WhatsApp**, não um pagamento online. O número pode ser configurado em `store.json` ou por `VITE_STORE_WHATSAPP` em `.env.local`, no formato `55` + DDD + número. Esse número é público no frontend e não é uma credencial.
4. Só depois de revisar os dados reais, altere `catalogIsDemo` para `false`, faça um novo build e valide o link de atendimento com o proprietário da loja.

Não coloque chaves secretas em variáveis `VITE_*`: elas são incorporadas ao código público do navegador. O arquivo `.env.example` documenta a configuração pública disponível.

## Comportamento da sacola

Sacola e favoritos ficam no `localStorage` deste navegador, sem cadastro ou rastreamento. Dados corrompidos são descartados e o usuário pode apagar suas escolhas no diálogo de privacidade.

O limite de unidades no catálogo serve para orientar a seleção e **não reserva estoque**. Preços e disponibilidade devem ser confirmados pela loja. A mensagem do WhatsApp é preparada com produtos, variações, quantidades e subtotal; o visitante precisa enviá-la no aplicativo. Não há criação de pedido no servidor ou confirmação de pagamento.

## Publicação

Publique o diretório `dist/` em uma hospedagem estática com HTTPS. Não foi realizado deploy nem alterado o domínio existente. O arquivo `public/_headers` fornece cabeçalhos para hospedagens que aceitam essa convenção; em outras plataformas, configure os cabeçalhos no provedor. Ele não se aplica automaticamente a qualquer servidor.

Contas de usuários, painel administrativo, banco de dados, checkout online, frete calculado e sincronização de estoque não fazem parte da implementação atual. Essas integrações dependem do funcionamento real da loja e do fluxo de compra a confirmar.

## Ambiente da nuvem

Use o checkout existente em `/workspace/link-bio-vitrine`. Cada tarefa já é isolada; não é necessário criar outro checkout ou um Git worktree. Dependências e arquivos compilados podem ser preservados na imagem do ambiente, mas o servidor deve ser iniciado novamente em cada tarefa.
