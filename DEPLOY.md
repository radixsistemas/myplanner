# Deploy — Render (API + Postgres) + Vercel (frontend)

Este guia assume a estratégia: **Render** hospeda a API + o banco Postgres (serviço que
fica sempre no ar, com o cron interno de estagnação rodando em background), e
**Vercel** hospeda o frontend estático (build do Vite), com deploy automático a cada
`git push`.

Os arquivos de configuração já estão prontos no repositório:
- [`render.yaml`](render.yaml) — Blueprint do Render (API + banco)
- [`apps/web/vercel.json`](apps/web/vercel.json) — build do frontend no monorepo
- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — typecheck + build automáticos em todo push/PR

## 1. Ambientes: dev, staging e produção

- **Local (dev)**: como já está no [README](README.md) — `npm run dev:api` / `dev:web` na sua máquina.
- **Produção**: branch `main` → deploy automático no Render (API) e Vercel (frontend).
- **Preview/staging**: a Vercel cria automaticamente uma URL de preview para cada Pull
  Request (sem custo extra). Para testar essas previews contra uma API real, crie um
  **segundo serviço no Render** (ex: `mapa-expansao-api-staging`) apontando para uma
  branch de staging, com seu próprio banco — o `render.yaml` pode ser reaproveitado
  criando um segundo Blueprint ou duplicando o serviço manualmente no painel.

Para começar, o mais simples é ter só **produção** funcionando primeiro (main → Render
+ Vercel) e adicionar staging depois, quando fizer sentido.

## 2. Passo a passo (você faz, nas contas Render/Vercel)

### Render — API + banco

1. Crie uma conta em [render.com](https://render.com) e conecte sua conta do GitHub.
2. **New → Blueprint** → selecione o repositório `mapa-expansao` → Render detecta o
   `render.yaml` automaticamente e propõe criar o banco `mapa-expansao-db` e o serviço
   web `mapa-expansao-api`.
3. Antes de confirmar, revise: os secrets `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` são
   gerados automaticamente (`generateValue: true`). As variáveis marcadas como
   "preencher manualmente" (`CORS_ORIGIN`, `APP_BASE_URL`, `SMTP_*`, `EMAIL_FROM`)
   ficam vazias — você as edita em **Environment** depois que o serviço existir.
4. Depois do primeiro deploy, anote a URL pública da API (algo como
   `https://mapa-expansao-api.onrender.com`).
5. Rode o seed de dados de exemplo uma vez (opcional), via **Shell** do próprio Render
   no serviço da API: `npm run db:seed -w apps/api`.

### Vercel — frontend

1. Crie uma conta em [vercel.com](https://vercel.com) e conecte o GitHub.
2. **Add New → Project** → selecione `mapa-expansao`.
3. Em **Root Directory**, selecione `apps/web` (importante — o `vercel.json` de
   dentro dessa pasta assume isso).
4. Em **Environment Variables**, adicione:
   - `VITE_API_URL` = `https://mapa-expansao-api.onrender.com/api` (a URL do Render do
     passo anterior, com `/api` no final)
5. Deploy. Anote a URL pública (ex: `https://mapa-expansao.vercel.app`).

### Fechando o ciclo: CORS

Volte no Render, no serviço da API, e defina:
- `CORS_ORIGIN` = `https://mapa-expansao.vercel.app` (a URL da Vercel do passo anterior)
- `APP_BASE_URL` = a mesma URL — é usada para montar os links dentro dos e-mails de
  estagnação

Pode listar múltiplas origens separadas por vírgula em `CORS_ORIGIN` se precisar
liberar mais de um domínio (ex: produção + um domínio próprio depois).

### E-mail (SMTP)

Enquanto não configurar um provedor real, deixe `EMAIL_DRY_RUN=true` no Render — os
e-mails de estagnação só são logados, não enviados. Quando for configurar de verdade,
veja as opções (Resend, SendGrid, SMTP próprio) na seção **E-mail** do
[README](README.md#e-mail-smtp).

## 3. Domínio próprio (opcional)

Se quiser usar um domínio seu (ex: `app.radixeditora.com.br`) em vez das URLs
`.vercel.app` / `.onrender.com`:
- Na Vercel: **Project → Settings → Domains** → adicione o domínio e siga as
  instruções de DNS (geralmente um registro `CNAME`).
- No Render, também é possível apontar um domínio próprio para a API se quiser, embora
  normalmente só o frontend precisa de um domínio "bonito" — a API pode continuar na
  URL padrão do Render.

Isso não depende do HostGator nem substitui ele — você mantém o domínio onde ele já
está registrado e só aponta os registros DNS para Vercel/Render.

## 4. O que o CI (GitHub Actions) já garante

A cada push ou Pull Request, [`.github/workflows/ci.yml`](.github/workflows/ci.yml)
roda automaticamente: instala dependências, gera o Prisma Client, faz o typecheck da
API e do frontend, e builda o frontend de produção. Se algo quebrar, o PR mostra a
falha antes de qualquer deploy acontecer — o Render e a Vercel fazem o deploy de forma
independente (via a própria integração deles com o GitHub), então a CI aqui funciona
como um "portão de qualidade", não como o disparador do deploy em si.
