# Portal UnAPI - Oficinas de Informatica

Site estatico para apoiar as oficinas de informatica da UnAPI UFMS. O portal reune a pagina inicial, a area de ferramentas praticas, a galeria de videos, atividades de teclado e mouse e mockups educativos sobre o gov.br.

## Estrutura

```text
.
├── index.html
├── ferramentas/
│   └── index.html
├── videos/
│   └── index.html
├── teclado/
│   └── index.html
├── mouse/
│   └── index.html
├── gov/
│   └── index.html
├── prova-de-vida/
│   └── index.html
├── assinatura-eletronica/
│   └── index.html
├── seguranca-digital/
│   └── index.html
├── pix/
│   ├── index.html
│   ├── qr/
│   │   └── index.html
│   └── tests/
│       └── account.test.cjs
├── mobilidade/
│   ├── index.html
│   ├── uber/
│   │   └── index.html
│   └── maps/
│       └── index.html
├── css/
│   ├── base.css
│   ├── home.css
│   ├── ferramentas.css
│   ├── videos.css
│   ├── teclado.css
│   ├── mouse.css
│   ├── gov.css
│   ├── prova-vida.css
│   ├── assinatura-eletronica.css
│   ├── seguranca-digital.css
│   ├── pix.css
│   ├── mobilidade.css
│   ├── mobilidade-uber.css
│   └── mobilidade-maps.css
├── js/
│   ├── teclado.js
│   ├── mouse.js
│   ├── gov.js
│   ├── prova-vida.js
│   ├── assinatura-eletronica.js
│   ├── seguranca-digital.js
│   ├── pix.js
│   ├── pix-account.js
│   ├── pix-qr.js
│   ├── mobilidade-location.js
│   ├── mobilidade-map.js
│   ├── mobilidade-uber.js
│   ├── mobilidade-maps.js
│   └── vendor/
│       ├── qrcode-generator.js
│       └── qrcode-generator.LICENSE.txt
└── img/
    ├── ferramentas/
    │   └── pix.svg
    ├── pix/
    │   └── banco-unapi-logo.svg
    └── demais imagens compartilhadas em WebP e SVG
```

## Como executar

Por ser um site estatico, basta abrir o arquivo `index.html` no navegador.

Se preferir servir localmente, rode um servidor simples na raiz do projeto:

```sh
python3 -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

## Organizacao

- `css/base.css` guarda tokens visuais, reset, fundo, navegacao comum, botoes e rodapes.
- Os arquivos `css/*.css` restantes guardam estilos especificos de cada pagina.
- `js/teclado.js` controla o destaque das teclas, tela cheia, familias de teclas e escala responsiva.
- `js/mouse.js` controla o arrastar das folhas, troca de cor, retorno por rolagem, reinicio e escala responsiva.
- `gov/` contem um mockup educativo para orientar a criacao de conta gov.br em oficina.
- `js/gov.js` controla a apresentacao passo a passo do mockup GOV.BR.
- `prova-de-vida/` contem uma simulacao educativa da Prova de Vida digital, sem camera ou coleta de dados.
- `js/prova-vida.js` controla as nove etapas, os avisos de seguranca e a navegacao da simulacao.
- `assinatura-eletronica/` contem uma simulacao educativa da Assinatura Eletronica gov.br.
- `js/assinatura-eletronica.js` controla as dez etapas, o arquivo ficticio e a posicao visual da assinatura.
- `seguranca-digital/` contem o Desafio Antigolpe, um simulador de decisoes para WhatsApp, e-mail e SMS.
- `js/seguranca-digital.js` controla todos os dialogos pre-programados, as ramificacoes e o progresso temporario dos cenarios.
- `pix/` contem o Banco UnAPI, uma experiencia bancaria com Pix, pagamentos, extrato, cartoes e reserva em memoria.
- `pix/qr/` abre cobrancas simuladas a partir dos cenarios fechados da dinamica presencial.
- `css/pix.css` guarda a identidade propria e responsiva do aplicativo ficticio, sem alterar o visual das outras atividades.
- `js/pix.js` renderiza as telas, controla a navegacao e compartilha os fluxos de pagamento entre `pix/` e `pix/qr/`.
- `js/pix-account.js` concentra o catalogo fechado de contatos e contas, o saldo em centavos, o extrato e as regras de cartoes e reserva. Nao depende do DOM nem possui persistencia.
- `js/pix-qr.js` define os cenarios da oficina, monta suas URLs e QR Codes locais e controla o painel externo, a tela cheia e o gesto de voltar.
- `pix/tests/account.test.cjs` verifica as regras da conta com o executor nativo de testes do Node.js, sem instalar dependencias.
- `js/vendor/qrcode-generator.js` e a copia local, sob licenca MIT, usada somente para desenhar os QR Codes no navegador, sem consultar servicos externos.
- `mobilidade/` reúne duas experiências interativas: solicitação de corrida e planejamento personalizado de rotas.
- `js/mobilidade-uber.js` e `js/mobilidade-maps.js` controlam os fluxos temporários das experiências de mobilidade.
- `js/mobilidade-location.js` faz busca explícita de locais e solicita rotas temporárias sem guardar as escolhas.
- `js/mobilidade-map.js` integra Leaflet, tiles do OpenStreetMap, marcadores A/B e geometrias de rota alinhadas à malha viária.
- `js/portal-motion.js` conecta as aberturas, textos e fichas das páginas de entrada com animações progressivas por viewport. O movimento usa APIs nativas, não bloqueia a rolagem e é desativado quando o navegador prefere movimento reduzido.
- As imagens institucionais foram convertidas para WebP para reduzir o peso do carregamento.

## Guia GOV.BR

A pagina `gov/` e um mockup educativo para apoio em oficina. Ela nao coleta dados, nao salva informacoes, nao envia formularios, nao usa cookies, nao usa `localStorage` e nao possui integracao real com servicos oficiais.

Os campos exibidos podem ser preenchidos durante a demonstracao, mas ficam apenas na tela enquanto o passo esta aberto. Ao trocar de passo ou recarregar a pagina, os valores digitados somem.

## Prova de Vida Digital

A pagina `prova-de-vida/` simula o fluxo geral da Prova de Vida no aplicativo gov.br para uso em oficina. Ela usa somente dados ficticios, nao possui campos de entrada, nao abre a camera, nao salva informacoes e nao chama APIs ou servicos oficiais.

O aviso `Ambiente de treinamento — não use dados reais` permanece visivel durante toda a atividade.

## Assinatura Eletronica

A pagina `assinatura-eletronica/` apresenta o fluxo de escolha, conferencia, assinatura e download de um documento digital ficticio. Ela nao faz login, nao permite upload real, nao pede codigos reais, nao gera arquivos e nao integra com gov.br ou ITI.

O documento `documento-treinamento.pdf`, o codigo `000000` e o selo final existem somente na tela da simulacao.

## Desafio Antigolpe

A pagina `seguranca-digital/` ensina a regra `PARE -> CONFIRA -> DECIDA` por meio de conversas e mensagens ficticias. Os tres cenarios usam somente respostas pre-programadas e ficam inteiramente no navegador durante a sessao atual.

O desafio nao coleta dados, nao abre links externos, nao usa inteligencia artificial, nao chama APIs, nao usa cookies nem `localStorage` e nao aceita senhas, codigos, cartoes ou documentos.

## Banco UnAPI — Dia a dia

O Banco UnAPI e um banco digital ficticio criado exclusivamente para as oficinas da UnAPI UFMS. A atividade `pix/` apresenta uma conta bancaria interativa, com linguagem curta e navegacao propria de aplicativo. O participante entra na conta de Maria Oliveira, com saldo inicial de R$ 1.250,00, e pode praticar:

- Pix por CPF/CNPJ, celular, e-mail e chave aleatoria, usando contatos de um catalogo fechado;
- conferencia de destinatario, documento, chave e valor, cancelamento, confirmacao e comprovante;
- cobrancas por QR Code e Pix Copia e Cola com codigos exclusivos da oficina;
- recebimento com valor escolhido, QR Code e copia da chave ou do codigo;
- pagamento de tres contas ficticias pela lista, codigo fornecido ou leitura simulada, com beneficiario, valor, vencimento e situacao;
- agendamento, consulta e cancelamento de pagamentos, sem debito antecipado;
- extrato e central de comprovantes com busca por nome/pagamento, entradas/saidas e periodo;
- notificacoes internas de contas, agendamentos, recebimentos e compras, com leitura e destino vinculados ao estado;
- consulta de compras com estabelecimento, data, valor e cartao utilizado, reconhecimento e acesso ao bloqueio temporario;
- fatura, pagamento da fatura, ajuste de limite, bloqueio/desbloqueio de cartao fisico e virtual, compras on-line e aproximacao;
- guardar dinheiro e resgatar da reserva, ocultar saldo, consultar perfil e ajuda.

Pagamentos efetivados na sessao atualizam o saldo, a situacao da conta e o extrato. O comprovante e derivado da transacao, inclusive quando aberto pela conta paga ou pelo agendamento concluido. Cancelar nao debita, saldo insuficiente bloqueia a operacao e contas/fatura pagas nao podem ser debitadas novamente. Guardar e resgatar apenas transferem valores entre conta e reserva. Nao ha produtos de credito, investimentos reais ou operacoes financeiras externas.

A home preserva os quatro atalhos Pix, Pagar, Receber e Guardar. Comprovantes tem acesso proprio logo abaixo, seguido da fatura e das ultimas movimentacoes. Uma lembranca contextual aparece quando ha pagamento agendado. O sino abre as notificacoes de contas e compras; ler uma notificacao nao paga uma conta nem reconhece uma compra. A rolagem interna funciona por toque, roda do mouse e teclado, sem uma barra lateral aparente.

`js/pix-account.js` concentra as regras e os dados. `js/pix-daily.js` renderiza as novas telas de rotina usando os mesmos helpers de `js/pix.js`, que continua responsavel pela navegacao e pelas acoes. Os dois pontos de entrada (`pix/` e `pix/qr/`) carregam os mesmos modulos. Nao houve migracao de framework nem inclusao de dependencias.

A identidade do aplicativo usa o roxo, creme e amarelo do portal, as fontes locais Atkinson Hyperlegible e Fraunces e as marcas institucionais existentes. Os estilos e scripts do Banco UnAPI ficam isolados da Mobilidade e das demais atividades. A unica biblioteca adicionada e o gerador de QR Code local, com versao e licenca registradas em `js/vendor/qrcode-generator.LICENSE.txt`; nao ha instalacao nem etapa de build.

As chaves, pessoas, documentos, saldos, valores e identificadores exibidos sao ficticios. A simulacao nao solicita senha, cartao, codigo bancario, CPF real ou chave Pix real; nao movimenta dinheiro, nao abre aplicativos bancarios, nao acessa Open Finance, nao usa APIs financeiras e nao envia dados para servidores.

Todo o estado fica somente na memoria da pagina. Nao ha cookies, `localStorage`, `sessionStorage`, IndexedDB ou persistencia: ao atualizar ou fechar a pagina, o progresso e os dados da sessao sao perdidos. `Recomecar` tambem restaura a conta inicial. Os avisos de treinamento e a orientacao para usar apenas dados ficticios ficam fora do aplicativo, no painel lateral fixo da oficina. No celular, esse painel se recolhe na faixa `Oficina UnAPI · Treinamento`, acima do banco, liberando a area de interacao. A recapitulacao de seguranca fica em `Cuidados antes de pagar`.

Copiar chave/codigo ou comprovante so acessa a area de transferencia apos um clique explicito. Se o navegador negar essa permissao, o botao `Colar codigo` reaproveita a copia mantida em memoria. Para comprovantes, a falha e informada e os dados continuam disponiveis na tela. Uma copia autorizada na area de transferencia do sistema pode permanecer depois de fechar a pagina; ela contem somente dados ficticios. O texto do comprovante traz `COMPROVANTE DE TREINAMENTO` e `SEM VALOR FINANCEIRO`. Nao ha envio automatico, integracao com mensageiros ou geracao de PDF.

### Contas e agendamentos

Os vencimentos sao calculados a partir do dia em que a conta e iniciada: energia no dia seguinte, agua em cinco dias e internet em oito. O pagamento de agua de R$ 90,00 no historico e identificado como uma conta anterior, diferente da atual de R$ 86,40. Todos os codigos continuam exclusivos da oficina; o desenho de barras e ilustrativo, nao e um codigo bancario. A leitura simulada nao solicita camera e permite escolher uma das tres contas ficticias.

Jornada: `Pagar -> Ler codigo / Digitar codigo / Minhas contas -> Conferir conta -> Pagar ou agendar -> Data -> Confirmar -> Resultado`. A conta paga continua acessivel e abre seu comprovante. Para pagar imediatamente uma conta ja agendada, primeiro cancele o agendamento.

O agendamento aceita datas futuras ate o vencimento. Ele possui as situacoes pendente, cancelado, concluido ou nao realizado. Somente a execucao concluida gera debito e transacao financeira. O historico de tentativas e mantido mesmo depois de cancelar, reagendar ou pagar por outro caminho.

A data e o relogio da simulacao ficam fixos durante a atividade. Para demonstrar a execucao, use `Simular dia DD/MM/AAAA` no painel externo `Oficina UnAPI · Treinamento`. Esse controle aparece quando existe agendamento pendente e avanca ate a proxima data agendada. Todos os pagamentos daquele dia sao processados em ordem de criacao, usando o saldo restante. Nao ha espera real, processamento em segundo plano, reserva antecipada de saldo ou novas tentativas automaticas.

Se faltar saldo, o agendamento fica como nao realizado e a conta permanece em aberto. A notificacao leva ao resultado, de onde e possivel voltar a conta e pagar novamente. Novas movimentacoes usam a data simulada. `Recomecar` restaura o dia atual e todos os dados iniciais.

### Compras e atividades

As tres compras da fatura sao dados da conta, somam R$ 184,90 e permanecem consultaveis depois do pagamento. Reconhecer uma compra nao altera a fatura. Bloquear o cartao e reversivel e nao remove compras anteriores, nao abre contestacao e nao resolve uma compra desconhecida. Cartao virtual, compras on-line e aproximacao preservam os controles existentes; nao existe autorizacao de novas compras nem uma disputa bancaria completa.

Situacoes curtas que podem ser exploradas:

- A energia vence amanha: localizar a conta, conferir e decidir quando pagar.
- A agua deve ser paga daqui a alguns dias: agendar, consultar e depois cancelar ou simular a data.
- Foi pago um valor ontem: buscar `agua` em Comprovantes e identificar a conta anterior.
- Uma compra de R$ 65,00 apareceu: abrir a notificacao, conferir a farmacia e o cartao utilizado.
- O cartao nao foi encontrado: bloquear temporariamente e desbloquear quando localizado.
- O saldo foi usado antes da data agendada: consultar a falha e verificar que nao houve pagamento.

Recarga, DDA, debito automatico, Pix Automatico, camera real e persistencia ficam fora desta versao.

### Modo oficina e QR Codes

Para projetar os cenarios, abra o Banco UnAPI e use o controle `QR Codes da dinâmica`. Os codigos sao gerados localmente pelo navegador, mas sempre apontam para a publicacao institucional do PET Sistemas: `https://pet-sistemas.github.io/unapi-oficinas/pix/qr/?cenario=...`. Eles nao usam payload Pix EMV, nao representam cobranca real e nao tentam abrir um aplicativo bancario.

No celular, abra a faixa `Oficina UnAPI · Treinamento` para acessar os controles. O acesso direto ao modo do facilitador e `pix/?modo=oficina`. Escolha um cenario, pressione `Projetar QR Code` e use `Abrir em tela cheia` se desejar. A projecao mostra a tarefa esperada sem revelar qual divergencia o participante deve identificar. Os alunos usam a camera normal do celular; o site nao solicita acesso a camera. Dentro da area Pix, `Ler QR Code` orienta a leitura do codigo projetado; a lista de previa local fica disponivel somente quando o banco e aberto com `?modo=oficina`.

O QR nao usa `localhost` nem o IP do computador do facilitador. Isso permite projetar um codigo em um computador e abrir a cobranca em celulares de outras redes, desde que a oficina esteja publicada no PET Sistemas. A URL canonica e definida em `js/pix-qr.js` e usada tanto nos cenarios quanto no QR de recebimento.

Para revisar a interface antes da publicacao, ainda e possivel servir uma copia local por HTTP:

```sh
python3 -m http.server 8000
```

Depois, abra `http://localhost:8000/pix/` apenas para testar a interface no computador. Os QR Codes continuarao apontando para `https://pet-sistemas.github.io/unapi-oficinas/`; portanto, para o ensaio com os alunos, publique/atualize primeiro o `main` do repositorio `PET-Sistemas/unapi-oficinas`.

Os tres cenarios da dinamica treinam uma cobranca correta, um destinatario diferente do esperado e um valor diferente do combinado. O aluno escaneia o QR com a camera normal e abre `pix/qr/index.html?cenario=...`, uma rota separada do portal. Essa pagina mostra a cobranca recebida; `Continuar no Banco UnAPI` leva para a conferencia do pagamento, seguindo depois pelo mesmo fluxo de cancelar, continuar e confirmar usado no Pix por chave. A rota nao mostra os controles do facilitador.

- `cantina`: Cantina UnAPI, R$ 12,00; conferir e confirmar.
- `destinatario-errado`: espera-se Cantina UnAPI, mas aparece Carlos Eduardo Pereira; cancelar.
- `valor-errado`: espera-se R$ 15,00, mas aparece R$ 150,00; cancelar.

Nos dois cenarios divergentes, `Continuar` bloqueia a confirmacao. A explicacao e o retorno educativo ficam no painel externo da oficina, junto do contexto esperado. Identificadores de cenario desconhecidos abrem `Cobranca nao encontrada`, sem criar destinatarios.

### Receber e Pix Copia e Cola

Em `Receber`, informe um valor e gere o QR Code. Ele aponta para `https://pet-sistemas.github.io/unapi-oficinas/pix/qr/?receber=<centavos>`, sempre para a destinataria ficticia Maria Oliveira. O parametro aceita apenas inteiros positivos de ate R$ 10.000,00; nao permite definir nome, documento ou chave. O codigo de copia e cola correspondente e `UNAPI:RECEBER:<centavos>`. A cobranca da cantina usa `UNAPI:CANTINA:1200`. Nenhum desses codigos e um payload EMV ou funciona em um banco real; codigos externos sao rejeitados.

Cada pagina/aparelho possui sua propria conta temporaria, sem sincronizacao. Pagar um QR em outro aparelho **nao credita automaticamente** a conta que o gerou. Para demonstrar a entrada de dinheiro, depois de gerar um QR use `Registrar recebimento na conta` no painel externo. O controle registra uma unica entrada por cobranca gerada; gerar uma nova cobranca permite uma nova demonstracao.

### Validacao local

```sh
node --test pix/tests/account.test.cjs
node --check js/pix-account.js
node --check js/pix-daily.js
node --check js/pix.js
node --check js/pix-qr.js
git diff --check
```

Os testes do modelo verificam formatos monetarios, catalogo fechado, saldo insuficiente, pagamentos unicos, conservacao de valores da reserva, reconciliacao do extrato, cartoes e reinicio. Tambem verificam datas, agendamento sem debito, cancelamento, duplicidade, execucao em ordem, falhas, vinculos com transacoes/notificacoes e isolamento dos snapshots.

O teste opcional `pix/tests/browser.test.cjs` usa o protocolo do Chromium por WebSocket nativo do Node 22+, sem instalar uma biblioteca de automacao no portal. Com o servidor local ativo e `agent-browser` ja instalado, abra uma sessao isolada:

```sh
agent-browser --session unapi-test open http://127.0.0.1:8000/pix/
agent-browser --session unapi-test set viewport 1440 1000
agent-browser --session unapi-test get cdp-url
```

Passe o endereco retornado em `UNAPI_CDP_URL` ao executar `node --test pix/tests/browser.test.cjs`. Se o Chromium exigir neste ambiente, use `--args '--no-sandbox'` ao abrir a sessao. `UNAPI_TEST_URL` altera o endereco base e `UNAPI_SCREENSHOTS` pode apontar para um diretorio existente para receber capturas PNG. Sem `UNAPI_CDP_URL`, os testes de navegador ficam explicitamente ignorados. Feche somente a sessao de teste com `agent-browser --session unapi-test close` ao terminar.

Os testes de navegador percorrem as jornadas novas em 360, 390, 430 px e desktop, verificam rolagem, alvos, overflow e console, e incluem regressao dos fluxos Pix, QR, reserva, cartoes e teclado. A leitura pela camera de aparelhos fisicos deve ser ensaiada na rede/projetor que sera usado na oficina; teclado virtual nativo, VoiceOver e TalkBack tambem exigem ensaio no aparelho.

## Mobilidade com o celular

As experiências de corrida e planejamento de rotas usam HTML, CSS, JavaScript e Leaflet 1.9.4. Partida e destino não são pré-definidos: podem ser escolhidos por busca explícita, toque no mapa, arraste dos marcadores A/B ou geolocalização autorizada pelo usuário.

A busca de endereços usa o Nominatim somente após o botão `Buscar`, com limitação local e cache temporário em memória. As rotas são consultadas em serviços OSRM distintos para carro, caminhada e bicicleta, evitando apresentar um trajeto de carro como se fosse outro modal. O modo de transporte público usa o traçado viário apenas como base visual e simula horários, linhas, paradas, esperas e baldeações para a atividade; ele não informa a operação real dos ônibus. Tiles, busca e roteamento requerem internet, mas não exigem token, cadastro ou chave. As escolhas não são armazenadas; a simulação não realiza pagamentos, chamadas telefônicas ou solicitações de corrida reais.

No celular, cada experiência ocupa toda a viewport, sem moldura, barra de status ou navegação de sistema fictícias. Retorno e reinício ficam em um menu lateral recolhido da oficina. Os fluxos usam transições direcionais, folhas inferiores, feedback tátil opcional quando o navegador oferece vibração e gesto de arrastar da borda esquerda para voltar. Os botões de navegação continuam disponíveis, e os ícones ficam no sprite SVG local `img/mobilidade/ui-icons.svg`.

## Publicacao

O projeto pode ser publicado em qualquer hospedagem de arquivos estaticos, como GitHub Pages, Netlify ou Vercel. Nao ha etapa de build.
