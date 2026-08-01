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
│   ├── mobilidade-location.js
│   ├── mobilidade-map.js
│   ├── mobilidade-uber.js
│   └── mobilidade-maps.js
└── img/
    └── imagens compartilhadas em WebP e SVG
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

## Mobilidade com o celular

As experiências de corrida e planejamento de rotas usam HTML, CSS, JavaScript e Leaflet 1.9.4. Partida e destino não são pré-definidos: podem ser escolhidos por busca explícita, toque no mapa, arraste dos marcadores A/B ou geolocalização autorizada pelo usuário.

A busca de endereços usa o Nominatim somente após o botão `Buscar`, com limitação local e cache temporário em memória. As rotas são consultadas em serviços OSRM distintos para carro, caminhada e bicicleta, evitando apresentar um trajeto de carro como se fosse outro modal. Tiles, busca e roteamento requerem internet, mas não exigem token, cadastro ou chave. As escolhas não são armazenadas; a simulação não realiza pagamentos, chamadas telefônicas ou solicitações de corrida reais.

No celular, cada experiência ocupa toda a viewport, sem moldura, barra de status ou navegação de sistema fictícias. Retorno e reinício ficam em um menu lateral recolhido da oficina. Os fluxos usam transições direcionais, folhas inferiores, feedback tátil opcional quando o navegador oferece vibração e gesto de arrastar da borda esquerda para voltar. Os botões de navegação continuam disponíveis, e os ícones ficam no sprite SVG local `img/mobilidade/ui-icons.svg`.

## Publicacao

O projeto pode ser publicado em qualquer hospedagem de arquivos estaticos, como GitHub Pages, Netlify ou Vercel. Nao ha etapa de build.
