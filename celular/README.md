# Celular na Prática — protótipo de validação (fase 1)

Nova atividade do Portal UnAPI UFMS / PET Sistemas. Compatível com a hospedagem estática do GitHub Pages e integrada a `ferramentas/index.html`.

## Como testar localmente

Na raiz do repositório, execute `python3 -m http.server 8765 --bind 127.0.0.1` e abra `http://127.0.0.1:8765/celular/`.

1. Na prática guiada, abra Configurações e confira a conclusão da primeira missão.
2. Avance e abra Configurações → Tela. Aumente o tamanho do texto e confira a mudança visível e a conclusão da segunda missão.
3. Teste as três dicas, a opção Mostrar o caminho, Voltar, Início, Aplicativos e Recomeçar atividade.
4. Mude para Explorar livremente e teste Wi-Fi, Bluetooth, brilho, volume e pesquisa de configurações.
5. Reinicie toda a experiência e confira o retorno ao estado inicial.

## Implementação

- `celular/index.html`: marcação e navegação externa.
- `../css/celular.css`: visual acessível com tokens institucionais.
- `../js/celular.js`: um estado compartilhado para telas, configurações e missões.
- A aplicação não utiliza API do celular, não instala aplicativos e não grava dados pessoais.
- Todo o estado é temporário na memória da página.

## Etapas futuras, após aprovação

Ampliar as missões para notificações, Bluetooth, loja fictícia, instalação, atualização, desinstalação, permissões e desafio final. A navegação e o modelo de estado da fase 1 já permitem essa evolução sem reescrever o simulador.

## Revisão de interface — outubro de 2026

- O layout de laboratório usa toda a viewport: sem rolagem externa em 1366×768, 1280×720 e 1440×900.
- Rodapé de marcas e avisos repetidos retirados desta ferramenta (marca UnAPI permanece no cabeçalho).
- Instruções condensadas e dicas oferecidas sob demanda.
- Tela inicial com relógio e data locais, barra de status, câmera frontal, botões de navegação e moldura Android.
- Ajustes rápidos acessíveis pela barra superior; animações de navegação discretas e suporte a redução de movimento.
- Em telas móveis pequenas, a disposição vertical permite rolar a página para preservar legibilidade e tamanho dos controles.
- As alterações permanecem apenas na branch local de prévia; publicação exige aprovação.

## Ícones SVG

O simulador e a capa do cartão utilizam ícones da biblioteca [Lucide](https://lucide.dev/), selecionados por meio do Supericons. Os símbolos são incorporados diretamente como SVG, sem dependência de CDN. A licença ISC e os créditos de terceiros estão em `LUCIDE-LICENSE.txt`.
