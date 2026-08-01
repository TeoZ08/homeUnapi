# Sistema de interface — Portal UnAPI Oficinas

## Intent

Usuario: pessoas idosas em oficinas de informatica e instrutores da UnAPI UFMS.

Tarefa principal: acessar ferramentas educativas, praticar teclado/mouse, assistir videos e acompanhar guias GOV.BR.

Sensacao desejada: acessivel, claro, acolhedor, institucional e conectado como uma jornada de oficina.

## Domain

Oficina, informatica basica, teclado, mouse, videos, GOV.BR, prova de vida, assinatura eletronica, documento digital, seguranca digital, aprendizagem, instrutor, pessoa idosa.

## Color World

- Roxo UnAPI para identidade e navegacao.
- Roxo escuro para contraste.
- Amarelo para acao, destaque e foco.
- Fundo claro quente para leitura confortavel.
- Branco/creme para superficies e areas de conteudo.

## Signature

Mascote/identidade UnAPI + ferramentas educativas com controles grandes e linguagem direta.

A assinatura compositiva das paginas de entrada e uma mesa de oficina grafica: imagem e tipografia dividem o mesmo plano, enquanto faixas impressas levemente deslocadas, recortes, carimbos e divisorias criam materialidade. Roxo e amarelo formam os planos, sem brilho ou cores adicionais. O mascote permanece como a grande imagem de acolhimento da Home, sem ser repetido como decoracao em todos os blocos.

Nos treinamentos GOV.BR, usar mockup central com aviso permanente de simulacao e explicacao didatica ao lado ou abaixo. O mockup pode alternar entre celular e navegador quando o fluxo real muda de dispositivo.

## Defaults a rejeitar

- Layout infantilizado; preferir acolhimento adulto e claro.
- Interface densa com muitos elementos por tela; preferir foco por atividade.
- Mockup GOV.BR que pareca coleta real; preferir aviso e comportamento demonstrativo.
- Grades extensas de cards iguais; preferir hierarquia editorial, listas conectadas e uma acao principal por conjunto.
- Numeracao decorativa, contadores de conteudo, etapas em bolinhas e linhas de processo quando nao existe uma ordem obrigatoria.
- Fotos de campus, depoimentos, estatisticas promocionais ou filtros sem funcao real apenas para imitar templates universitarios.
- Repetir a marca UnAPI como estampa ou marca-d'agua em todas as secoes.

## Tokens e padroes atuais

- `--unapi-fundo`: fundo claro quente.
- `--unapi-roxo` e `--unapi-roxo-escuro`: identidade, topbar e navegacao.
- `--unapi-amarelo`: chamadas, hover e foco visivel.
- `--unapi-borda`: raio amplo para superficies amigaveis.
- `--unapi-sombra`: profundidade leve para cards e barras.
- Fonte: Segoe UI/Tahoma/Verdana/sans-serif.

## Composicao das paginas de entrada

- Home: hero com o mascote olhando para tras integrado a tipografia, manifesto curto em roxo e dois acessos como cartazes sobrepostos: praticar e relembrar.
- Ferramentas: introducao amarela, indice textual e grupos em grandes planos alternados. Cada atividade e uma linha editorial inteira, nao um card isolado.
- Videos: abertura roxa com carimbo textual, um registro em destaque e os demais em lista compacta sem numeracao.
- Mobilidade: abertura roxa e experiencias em linhas amplas, mantendo as ilustracoes autorais do mascote como impresso levemente deslocado.
- Blocos encostam ou compartilham bordas quando pertencem a mesma narrativa. Reservar cards arredondados e sombra para controles independentes, simuladores e elementos realmente flutuantes. Nas paginas de entrada, preferir recortes retos.

## Uso da marca UnAPI

- Usar `img/unapi-marca.webp` como selo no cabecalho das paginas de entrada: Home, Ferramentas, Videos, Mobilidade e Seguranca Digital.
- Manter as marcas institucionais completas no rodape. O selo no topo orienta; o rodape atribui autoria e parcerias.
- Nao inserir o selo dentro de cada atividade, item de lista ou passo. Mockups GOV.BR mantem a identidade do ambiente simulado e nao recebem o selo no corpo.

## Estados interativos

- Foco visivel com outline amarelo.
- Hover em navegacao deve aumentar contraste, nao depender apenas de movimento.
- Botoes de avancar/voltar no GOV.BR devem permanecer grandes e legiveis.
- Simulacoes GOV.BR devem permitir setas esquerda/direita e apresentar progresso textual.
- Atividades de teclado e mouse devem ter reset/retorno claro.

## Navegacao entre paginas

- A hierarquia principal e `Inicio -> Ferramentas -> Atividade`; Mobilidade acrescenta `Mobilidade -> Experiencia`.
- Toda pagina interna deve oferecer primeiro um retorno explicito ao nivel pai, com seta e destino no rotulo: `Voltar para Ferramentas` ou `Voltar para Mobilidade`.
- `Inicio` e um atalho secundario, sem seta. Nao usar `Home` nem fazer a seta apontar diretamente para o inicio quando existe um nivel pai intermediario.
- A pagina inicial usa dois caminhos editoriais como navegacao principal; nao repetir os mesmos destinos no cabecalho.
- Controles de etapa (`Anterior` e `Proximo`) ficam separados da saida da atividade.
- Na ultima etapa, oferecer acoes distintas: rever/recomecar a pratica ou voltar para Ferramentas. Nao manter dois botoes que reiniciem o mesmo fluxo com rotulos diferentes.
- Gestos de voltar podem complementar a interface, nunca substituir um botao visivel e acessivel.

## Acessibilidade e responsividade

- Botoes grandes e espacados.
- Contraste alto entre roxo, amarelo e fundo claro.
- Poucos elementos por tela nas atividades.
- Linguagem simples e direta.
- Navegacao por teclado preservada.

## Limites

Nao remover os avisos de seguranca do GOV.BR. Os mockups nao coletam, salvam, enviam formularios, usam cookies ou localStorage. Simulacoes de reconhecimento facial nao podem abrir a camera. Simulacoes de assinatura nao podem enviar, modificar, gerar ou baixar documentos reais.

## Mobilidade

Os simuladores de mobilidade podem adotar densidade, movimento e hierarquia mais proximos de aplicativos reais. Priorizar mapas como superficie principal, folhas inferiores em camadas, transicoes direcionais, feedback ao toque e navegacao contextual dentro do aparelho.

No celular real, o aplicativo ocupa toda a viewport: remover moldura, sensores, barra de status e navegacao de sistema ficticios. Reunir retorno e reinicio em um menu lateral discreto da oficina; tela cheia fica restrita ao desktop, onde ainda existe um aparelho emoldurado. Manter botoes tradicionais mesmo quando houver gestos equivalentes. Em Mobilidade, nao exibir faixas ou avisos externos que interrompam a experiencia do aplicativo.

Kits externos podem orientar composicao, hierarquia e comportamento, mas nao devem substituir componentes locais mais atuais apenas por semelhanca visual. Priorizar folhas inferiores, cartoes flutuantes e controles contextuais sobre o mapa; evitar copiar mockups inteiros ou importar mapas estaticos.

Usar Leaflet com OpenStreetMap como base cartografica real. Trajetos devem vir de geometrias de roteamento aderentes as ruas, nunca de curvas desenhadas manualmente. Marcadores, progresso e alternativas devem compartilhar a mesma geometria geografica.

Origem e destino devem ser livres e começar vazios. A pessoa pode definir A/B por busca explícita, localização autorizada, toque ou arraste no mapa. Usar A verde para origem, B vermelho para destino, carro somente para veículo e ícones próprios para caminhada e bicicleta. Não inventar linhas, horários, paradas ou trajetos de transporte público quando não houver uma fonte verificável para o par escolhido.

No hub de Mobilidade, usar o mascote UnAPI de óculos e o conversível amarelo como assinatura visual das experiencias. As ilustrações podem variar a ação, mas devem preservar o traço preto, o rosto, a camiseta, o fundo escuro com luz dourada e a leitura adulta do personagem; evitar cenas urbanas genéricas com aparência de banco de imagens ou geração sem identidade.
