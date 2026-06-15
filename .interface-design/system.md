# Sistema de interface — Portal UnAPI Oficinas

## Intent

Usuario: pessoas idosas em oficinas de informatica e instrutores da UnAPI UFMS.

Tarefa principal: acessar ferramentas educativas, praticar teclado/mouse, assistir videos e acompanhar guias GOV.BR.

Sensacao desejada: acessivel, claro, acolhedor e institucional.

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

Nos treinamentos GOV.BR, usar mockup central com aviso permanente de simulacao e explicacao didatica ao lado ou abaixo. O mockup pode alternar entre celular e navegador quando o fluxo real muda de dispositivo.

## Defaults a rejeitar

- Layout infantilizado; preferir acolhimento adulto e claro.
- Interface densa com muitos elementos por tela; preferir foco por atividade.
- Mockup GOV.BR que pareca coleta real; preferir aviso e comportamento demonstrativo.

## Tokens e padroes atuais

- `--unapi-fundo`: fundo claro quente.
- `--unapi-roxo` e `--unapi-roxo-escuro`: identidade, topbar e navegacao.
- `--unapi-amarelo`: chamadas, hover e foco visivel.
- `--unapi-borda`: raio amplo para superficies amigaveis.
- `--unapi-sombra`: profundidade leve para cards e barras.
- Fonte: Segoe UI/Tahoma/Verdana/sans-serif.

## Estados interativos

- Foco visivel com outline amarelo.
- Hover em navegacao deve aumentar contraste, nao depender apenas de movimento.
- Botoes de avancar/voltar no GOV.BR devem permanecer grandes e legiveis.
- Simulacoes GOV.BR devem permitir setas esquerda/direita e apresentar progresso textual.
- Atividades de teclado e mouse devem ter reset/retorno claro.

## Acessibilidade e responsividade

- Botoes grandes e espacados.
- Contraste alto entre roxo, amarelo e fundo claro.
- Poucos elementos por tela nas atividades.
- Linguagem simples e direta.
- Navegacao por teclado preservada.

## Limites

Nao remover os avisos de seguranca do GOV.BR. Os mockups nao coletam, salvam, enviam formularios, usam cookies ou localStorage. Simulacoes de reconhecimento facial nao podem abrir a camera. Simulacoes de assinatura nao podem enviar, modificar, gerar ou baixar documentos reais.
