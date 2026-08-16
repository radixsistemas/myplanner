# Mapa de Expansão — Roadmap & Gestão de Projetos

Sistema próprio de gestão de roadmap e projetos, construído do zero (sem integrações com Jira/Trello/Asana). Separa claramente:

- **Roadmap** — grandes iniciativas futuras, agrupadas por horizonte (curto/médio/longo prazo), com fases opcionais.
- **Projetos em execução** — trabalho do dia a dia, com tarefas e subtarefas, kanban/lista e progresso.

Um item de roadmap pode ser **promovido a projeto** quando começa a ser executado — o projeto criado mantém o vínculo com o item de roadmap de origem (histórico preservado).

Inclui um motor de **detecção de estagnação**: cada item de roadmap e projeto tem sua tolerância de inatividade calculada proporcionalmente ao prazo, e o sistema alerta no dashboard e por e-mail quando algo fica parado além do esperado.

> O conteúdo anterior deste repositório (formulário "Mapa de Expansão de Visão" com Google Sheets) foi preservado em [`legacy/`](legacy/).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS + React Query |
| Backend | Node.js + Express + TypeScript |
| Banco | PostgreSQL + Prisma ORM (migrations versionadas) |
| Autenticação | JWT (access token curto + refresh token rotativo, hash em banco) |
| E-mail | Nodemailer via SMTP genérico (compatível com Resend, SendGrid, SES, etc.) |
| Agendador | `node-cron` (verificação diária de estagnação + resumo semanal) |

Monorepo com **npm workspaces**:

```
mapa-expansao/
├── apps/
│   ├── api/     # Backend Express + Prisma
│   └── web/     # Frontend React + Vite
├── packages/
│   └── shared/  # Enums, tipos e a fórmula de estagnação, compartilhados entre api e web
├── legacy/      # Conteúdo anterior do repositório (não relacionado)
└── docker-compose.yml  # Postgres local para desenvolvimento
```

## Modelo de dados

Schema completo em [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma). Principais entidades:

- `User`, `Team`, `TeamMember` (papel por time: `MANAGER` | `COLLABORATOR`; `User.globalRole` = `ADMIN` | `MEMBER`)
- `RoadmapItem` + `RoadmapPhase` (fases opcionais, com datas estimadas)
- `Project` (opcionalmente ligado a um `RoadmapItem` de origem via `roadmapItemId`)
- `Task` (auto-relação `parentTaskId` para até 2 níveis: tarefa + subtarefa)
- `ActivityEntry` (comentários + trilha de auditoria — alimenta `lastActivityAt`, base da detecção de estagnação)
- `StallRule` (`GLOBAL` ou por `TEAM`, com `tolerancePercent`, `minToleranceDays`, `maxToleranceDays`, `reminderIntervalDays`)
- `StallNotification` (histórico de envios, evita reenviar mais de 1x por `reminderIntervalDays`)

### Fórmula de estagnação

```
duraçãoTotal   = dataAlvo - dataInício            (sem data alvo, assume o teto máximo)
toleranciaDias = clamp(duraçãoTotal × tolerancePercent, minToleranceDays, maxToleranceDays)
estagnado?     = (hoje - lastActivityAt) > toleranciaDias
```

Implementada uma única vez em [`packages/shared/src/stall.ts`](packages/shared/src/stall.ts) e usada tanto pelo motor de verificação (job) quanto pelas telas que exibem "dias até o alerta". Os parâmetros (`tolerancePercent`, mín./máx. de dias, intervalo de reenvio) são configuráveis pelo admin em **Configurações → Administração**, com override opcional por time via API (`PUT /api/stall-rules/teams/:teamId`).

## Setup local

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ (local via `docker-compose`, ou uma instância própria/hospedada)

### 1. Instalar dependências

```bash
npm install
```

### 2. Banco de dados

Suba um Postgres local com Docker:

```bash
docker compose up -d
```

Ou aponte `DATABASE_URL` para qualquer Postgres já existente (local ou em nuvem).

### 3. Variáveis de ambiente

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

Edite `apps/api/.env`:

- `DATABASE_URL` — string de conexão do Postgres.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — gere valores fortes, ex: `openssl rand -hex 32`.
- `SMTP_*` / `EMAIL_FROM` — configuração do provedor de e-mail (veja seção **E-mail** abaixo). Deixe `EMAIL_DRY_RUN=true` para apenas logar os e-mails no console durante o desenvolvimento.
- `STALL_CHECK_CRON` / `WEEKLY_SUMMARY_CRON` — expressões cron para os jobs agendados.
- `APP_BASE_URL` — URL do frontend, usada para montar links nos e-mails.

`apps/web/.env` só precisa de `VITE_API_URL` (padrão `http://localhost:3333/api`).

### 4. Migrations + seed

```bash
npm run db:migrate   # cria o schema no banco (prisma migrate dev)
npm run db:seed       # popula com dados de exemplo
```

Usuários de teste criados pelo seed (todos com senha `senha123`):

| E-mail | Papel |
|---|---|
| `admin@example.com` | Admin geral |
| `marina@example.com` | Gestora do time Produto |
| `carlos@example.com` | Gestor do time Marketing |
| `julia@example.com` | Colaboradora (Produto + Marketing) |
| `pedro@example.com` | Colaborador (Produto) |

O seed cria 2 times, itens de roadmap em cada horizonte (incluindo um com fases e um propositalmente parado há 40 dias para testar o alerta de estagnação), um projeto ativo com tarefas/subtarefas (incluindo uma tarefa atrasada) e um projeto nascido de um item de roadmap promovido.

### 5. Rodar em desenvolvimento

Em dois terminais:

```bash
npm run dev:api   # http://localhost:3333
npm run dev:web   # http://localhost:5173
```

### 6. Rodar o job de verificação de estagnação manualmente

O job roda sozinho no cron configurado (`STALL_CHECK_CRON`) enquanto a API está de pé, mas também pode ser disparado manualmente a qualquer momento:

```bash
npm run stall:check
```

Isso varre todos os itens de roadmap e projetos ativos, calcula a tolerância de cada um e envia (ou loga, se `EMAIL_DRY_RUN=true`) os alertas de estagnação — respeitando o limite de reenvio (`reminderIntervalDays`, padrão 1x por semana).

## E-mail (SMTP)

O envio usa Nodemailer com um transporte SMTP genérico — funciona com qualquer provedor:

| Provedor | Host | Porta | Usuário | Senha |
|---|---|---|---|---|
| Resend | `smtp.resend.com` | 587 | `resend` | sua API key |
| SendGrid | `smtp.sendgrid.net` | 587 | `apikey` | sua API key |
| SMTP próprio | seu host | conforme seu provedor | — | — |

Com `EMAIL_DRY_RUN=true` (padrão), nada é enviado de verdade — os e-mails são apenas logados no console da API, o que permite testar todo o fluxo de estagnação sem credenciais SMTP configuradas.

## Perfis de acesso

- **Admin** (`globalRole=ADMIN`): acesso total, configura a regra global de estagnação, times e papéis de usuários.
- **Gestor** (`teamRole=MANAGER` em um time): CRUD completo de roadmap/projetos/tarefas dos times em que é gestor.
- **Colaborador** (`teamRole=COLLABORATOR`): leitura dos times em que está, edição restrita a tarefas atribuídas a si (status, progresso e descrição).

O primeiro usuário registrado no sistema vira Admin automaticamente.

## Scripts principais (raiz)

| Comando | O que faz |
|---|---|
| `npm run dev:api` / `dev:web` | Sobe API e frontend em modo desenvolvimento |
| `npm run build` | Typecheck da API + build de produção do frontend |
| `npm run start:api` | Roda a API (via `tsx`, sem etapa de bundle separada) |
| `npm run db:migrate` | Aplica migrations (`prisma migrate dev`) |
| `npm run db:migrate:deploy` | Aplica migrations em produção (`prisma migrate deploy`) |
| `npm run db:seed` | Popula o banco com dados de exemplo |
| `npm run db:studio` | Abre o Prisma Studio para inspecionar o banco visualmente |
| `npm run stall:check` | Roda a verificação de estagnação uma vez, manualmente |

## Deploy

Guia passo a passo para colocar em produção (Render para API + banco, Vercel para o
frontend, deploy automático a cada push) em [`DEPLOY.md`](DEPLOY.md).

## Limitações conhecidas (v1)

- Override de regra de estagnação por time é feito via API (`PUT /api/stall-rules/teams/:teamId`, permitido a gestores do time); a UI de administração expõe apenas a regra global.
- Kanban de tarefas não tem drag-and-drop — a mudança de status é feita pelo seletor no próprio card.
- Sem upload de avatar/anexos — `avatarUrl` aceita apenas uma URL externa.
