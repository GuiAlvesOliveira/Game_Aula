# Orbit Blade

Orbit Blade é um jogo web minimalista top-down de sobrevivência e combate passivo-agressivo, escrito totalmente em Python.

## Tecnologias Utilizadas
- **Python**: Lógica do jogo.
- **pygame-ce**: Engine 2D utilizada para manipulação de gráficos e estados.
- **PyScript**: Ponte para compilar e interpretar o Python e os pacotes diretamente no navegador.

## Como Jogar Localmente

Para devido funcionamento das requisições relativas ao WebAssembly (PyScript), é recomendado rodar via um servidor local simulando GitHub Pages.

**Passo a passo:**
1. Abra um terminal na pasta onde estes arquivos estão localizados (`/Game_Aula`).
2. Execute o servidor nativo do Python:
   ```bash
   python -m http.server
   ```
3. Abra o seu navegador e acesse a URL: [http://localhost:8000](http://localhost:8000)

## Instruções do Jogo
- **Movimento**: Use as teclas **WASD** ou as **Setas Direcionais**.
- **Combate**: Você ataca girando sua espada ou dançando em volta dos zumbis. Não é necessário clicar!
- **Loja**: Após limpar todos os inimigos da fase, aperte as teclas numéricas `1`, `2` ou `3` para comprar melhorias.
- **Reviver**: Ao morrer, e caso possua dinheiro, pode utilizar a tecla `R` para voltar do mundo dos mortos imediatamente.

## Como Publicar (Deploy via GitHub Pages)
Nenhuma configuração adicional é necessária. Apenas certifique-se de realizar o commit de todos os arquivos (`index.html`, `main.py` e este README) para o repositório principal do GitHub, e ativar a opção do "GitHub Pages" utilizando a base principal do ramo (geralmente raiz `/`).