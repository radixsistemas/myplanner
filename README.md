# Mapa de Expansão da Visão — integração com Google Sheets

Formulário de diagnóstico (Método Mover · Aula 1). As respostas são salvas em
uma planilha do Google Sheets e a aba "Ver resultados (mentora)" lê os dados
consolidados dessa mesma planilha.

- `mapa_expansao_visao.html` — o widget completo (HTML + JS), incorporável
  onde for necessário.
- `google-apps-script/Code.gs` — backend que roda como Google Apps Script Web
  App, vinculado à planilha, e expõe:
  - `doPost` — recebe uma resposta do formulário e adiciona uma linha.
  - `doGet` — devolve todas as respostas em JSON para montar o gráfico e as
    listas de respostas abertas.

A planilha usada é **"Mapa de expansao de visao"**, no Drive da Radix
(colunas: `timestamp, nome, scores, open1, open2`).

## Como implantar (passo a passo, feito uma única vez)

1. Abra a planilha **Mapa de expansao de visao** no Google Sheets.
2. Vá em **Extensões → Apps Script**.
3. Apague o conteúdo padrão de `Código.gs` e cole o conteúdo de
   [`google-apps-script/Code.gs`](google-apps-script/Code.gs) deste repositório.
4. Salve o projeto (ícone de disquete).
5. Clique em **Implantar → Nova implantação**.
   - Tipo: **App da Web**.
   - Executar como: **Eu** (sua conta, dona da planilha).
   - Quem tem acesso: **Qualquer pessoa**.
6. Clique em **Implantar** e autorize as permissões solicitadas (é a sua
   própria conta Google pedindo acesso à sua própria planilha).
7. Copie a **URL do app da Web** gerada (algo como
   `https://script.google.com/macros/s/XXXXX/exec`).
8. Abra `mapa_expansao_visao.html` e substitua o valor de
   `SHEETS_WEBAPP_URL` (no topo do `<script>`) por essa URL.

Pronto: os envios do formulário passam a virar linhas na planilha, e a aba de
resultados lê e agrega esses dados em tempo real.

## Atualizações futuras no código do backend

Sempre que o conteúdo de `google-apps-script/Code.gs` mudar, é preciso ir de
novo em **Implantar → Gerenciar implantações → editar (ícone de lápis) →
Nova versão → Implantar** dentro do editor do Apps Script — só editar o
arquivo aqui no repositório não atualiza o Web App em produção.
