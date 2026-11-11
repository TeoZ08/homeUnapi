# Celular na Prática — Biblioteca de funções (prévia local)

## Como usar em aula

O simulador permite escolher qualquer tema pelo modo **Explorar livremente**. As opções estão separadas em **Ajustes**, **Dia a dia** e **Ferramentas**. Não existe ordem obrigatória. A **Prática guiada** preserva duas missões introdutórias, que podem ser executadas separadamente.

A interface simula o comportamento de um aparelho Android, mas não acessa dados reais do computador, contatos do participante, câmera física ou aplicações externas. O estado permanece somente em memória enquanto a página estiver aberta. Ações como instalar aplicativo, tirar foto, compartilhar arquivo, definir senha e baixar documento ocorrem apenas dentro deste ambiente de prática.

## 1. Ajustes (implementados)

- Tela e letras: brilho, aumento da fonte e visualização imediata.
- Acessibilidade: contraste reforçado, ícones maiores.
- Conexões: Wi-Fi e Bluetooth.
- Som e volume: ajuste em faixa deslizante.
- Notificações: dispensar, limpar e permitir/bloquear avisos.
- Privacidade: localização, acesso às fotos e notificações.

## 2. Dia a dia (implementados)

- Contatos: consultar e cadastrar pessoas.
- Mensagens: abrir contato, escrever, enviar e rever uma conversa.
- Alarmes: criar, ligar, desligar e excluir.
- Loja: instalar/desinstalar Bloco de Notas e Calculadora.
- Fotos: visualizar fotografias reais de oficinas UnAPI, selecionar favoritas, excluir, compartilhar.
- Câmera: escolher três cenas baseadas em fotografias reais do portal e registrar uma foto que aparece na galeria e em Arquivos.
- Calendário: cadastrar, visualizar e excluir compromissos. O cadastro também gera um aviso no celular.

## 3. Ferramentas (implementadas)

- Arquivos e Downloads: navegar por pastas, localizar, renomear, mover e excluir arquivos; restaurar da Lixeira; confirmação antes de esvaziar.
- QR Code: apresentar um SVG de QR Code válido, ler e revelar o endereço oficial do portal UnAPI.
- Captura de tela: gerar uma captura ilustrativa em SVG que fica disponível na galeria e em Arquivos.
- Compartilhar: enviar uma foto ou arquivo para um contato e recuperar a conversa.
- Bateria: nível alterável e modo de economia, inclusive no indicador superior.
- Armazenamento: visualizar consumo ilustrativo, arquivos e lixeira.
- Bloqueio de tela: configurar PIN de quatro dígitos, bloquear, testar erro e desbloquear.
- Ajustes rápidos: modo avião, lanterna, silencioso e não perturbe; indicadores de estado e links para outras configurações.

## 4. Exemplos de conexões entre módulos

- Câmera → Fotos → Compartilhar → Contato → Mensagens.
- Câmera → Arquivos / Imagens → Lixeira → Restaurar.
- Captura da tela → Arquivos → mover para Documentos.
- Calendário → Notificações.
- Loja → instalar Calculadora → abrir em Aplicativos → efetuar cálculo.
- Bloqueio de tela → PIN incorreto → PIN correto → tela inicial.
- Bateria → nível de carga → indicador superior.
- QR Code → resultado → endereço do portal.

## Critérios de qualidade

- Ícones Lucide via Supericons, fontes e cores institucionais já existentes.
- Fotografias autênticas do acervo do projeto; nenhuma ilustração abstrata adicionada.
- QR Code e captura de tela em SVG.
- Sem barra de rolagem externa em desktop testado (1280 × 720, 1366 × 768, 1440 × 900). Rolagem interna do aparelho permitida, como em um celular real.
- Navegação responsiva no smartphone (página com rolagem vertical para preservar tamanho e legibilidade dos controles).
- Uso somente local na branch `feat/celular-modulos-lab` até avaliação.

## Melhorias futuras opcionais

- Teclado virtual mais completo e reconhecimento de gestos (segurar/arrastar).
- Chamadas telefônicas de treinamento com teclado numérico.
- Compartilhamento com tela de destinos de mais de um aplicativo.
- Notificações programadas de lembretes.
- Configurações detalhadas de som, atualização do sistema e uso de armazenamento.

## Prévia

Na máquina do projeto: `http://127.0.0.1:8765/celular/`.

A versão hospedada em GitHub Pages permanece com a implementação anterior, sem esta expansão.

## Apresentação em aparelhos móveis (revisão)

Em telas de até 900 px, e também em aparelhos de toque na horizontal com altura reduzida:
- O simulador ocupa **toda a área útil visível**, como o Banco UnAPI; sem moldura de celular nem painel branco externo.
- O cabeçalho do portal, painel de missões e fundo institucional não ocupam espaço na tela do aparelho.
- A navegação inferior permanece visível, enquanto menus extensos rolam **somente dentro** do celular.
- O aplicativo **Oficinas**, com ícone próprio, abre as categorias Ajustes / Dia a dia / Ferramentas sem sair da interface.
- É possível entrar na **Prática guiada** pelo aplicativo Oficinas; no desktop, o painel lateral e a moldura continuam como antes.
- O aplicativo Oficinas inclui retorno ao catálogo do portal.
- Layout testado com Playwright em 320×568, 360×640, 390×844, 430×932, 768×1024, 800×600, 900×620 e 932×430 na horizontal; desktop preservado em 1280×720 e 1366×768.

A prévia continua **somente local**, sem commit nem publicação.
