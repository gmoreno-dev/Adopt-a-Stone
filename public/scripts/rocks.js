// rocks.js

// ======================================================================
//                          FÍSICA DAS PEDRAS
// ======================================================================

// Inicializa o motor de física
const engine = Matter.Engine.create();
const world = engine.world;

// Armazena o renderizador
let renderGlobal;

// Função para inicializar a física das pedras
export function iniciarFisicaDasPedras() {
  // Obter a largura e altura da janela
  const largura = window.innerWidth;
  const altura = window.innerHeight * 0.6; // Usar 60% da altura da janela

  // Cria o renderizador
  const render = Matter.Render.create({
    element: document.getElementById("monte-de-pedras"),
    engine: engine,
    options: {
      width: largura,
      height: altura,
      wireframes: false,
      background: "transparent",
    },
  });

  // Inicia o renderizador
  Matter.Render.run(render);

  // Cria o loop do motor
  const runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  // Armazena o renderizador globalmente
  renderGlobal = render;

  // Cria o chão e paredes com a propriedade isWall
  const chao = Matter.Bodies.rectangle(largura / 2, altura + 30, largura + 40, 60, { isStatic: true, isWall: true });
  const paredeEsquerda = Matter.Bodies.rectangle(-20, altura / 2, 60, altura, { isStatic: true, isWall: true });
  const paredeDireita = Matter.Bodies.rectangle(largura + 20, altura / 2, 60, altura, { isStatic: true, isWall: true });

  // Adiciona ao mundo
  Matter.World.add(world, [chao, paredeEsquerda, paredeDireita]);

  // Atualiza o evento para desenhar o nome no canvas
  Matter.Events.on(render, "afterRender", () => {
    const context = render.context;
    const bodies = Matter.Composite.allBodies(engine.world);

    context.font = "bold 16px Arial";
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.textAlign = "center";
    context.textBaseline = "middle";

    bodies.forEach((body) => {
      if (body.label && body.position && !body.isWall) {
        const position = body.position;

        // Desenha o contorno preto
        context.strokeText(body.label, position.x, position.y);

        // Desenha o texto branco por cima
        context.fillText(body.label, position.x, position.y);
      }
    });
  });

  // Adicionar eventos de mouse
  adicionarEventosDeMouse();

  // Atualizar o tamanho do canvas ao redimensionar a janela
  window.addEventListener('resize', () => {
    const novaLargura = window.innerWidth;
    const novaAltura = window.innerHeight * 0.6;
    render.canvas.width = novaLargura;
    render.canvas.height = novaAltura;
    Matter.Body.setPosition(chao, { x: novaLargura / 2, y: novaAltura + 30 });
    Matter.Body.setPosition(paredeEsquerda, { x: -20, y: novaAltura / 2 });
    Matter.Body.setPosition(paredeDireita, { x: novaLargura + 20, y: novaAltura / 2 });
  });
}

// Restante do código permanece o mesmo...

// Função para adicionar eventos de mouse
function adicionarEventosDeMouse() {
  const mouse = Matter.Mouse.create(renderGlobal.canvas);
  const mouseConstraint = Matter.MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,
      render: {
        visible: false,
      },
    },
  });
  Matter.World.add(world, mouseConstraint);

  renderGlobal.mouse = mouse;

  // Variável para armazenar a pedra sob o mouse
  let pedraAtual = null;

  Matter.Events.on(mouseConstraint, 'mousemove', function (event) {
    const mousePosition = event.mouse.position;
    const bodies = Matter.Composite.allBodies(engine.world);

    // Verifica se o mouse está sobre alguma pedra
    const pedras = bodies.filter((body) => body.isStone);
    const pedraEncontrada = Matter.Query.point(pedras, mousePosition)[0];

    if (pedraEncontrada && pedraAtual !== pedraEncontrada) {
      pedraAtual = pedraEncontrada;
      mostrarInformacoesPedra(pedraAtual, mousePosition);
    } else if (!pedraEncontrada && pedraAtual) {
      pedraAtual = null;
      removerInformacoesPedra();
    }
  });
}

// Função para mostrar as informações da pedra
function mostrarInformacoesPedra(pedra, position) {
  let infoDiv = document.getElementById('info-pedra');
  if (!infoDiv) {
    infoDiv = document.createElement('div');
    infoDiv.id = 'info-pedra';
    infoDiv.className = 'info-pedra';
    document.body.appendChild(infoDiv);
  }
  atualizarPosicaoInfoPedra(infoDiv, position);
  infoDiv.innerHTML = `
    <p><strong>Nome:</strong> ${pedra.customData.nome}</p>
    <p><strong>Localização:</strong> ${pedra.customData.localizacao}</p>
    <p><strong>Descrição:</strong> ${pedra.customData.descricao}</p>
  `;
}

// Função para remover as informações da pedra
function removerInformacoesPedra() {
  const infoDiv = document.getElementById('info-pedra');
  if (infoDiv) {
    infoDiv.parentNode.removeChild(infoDiv);
  }
}

// Função para atualizar a posição das informações da pedra
function atualizarPosicaoInfoPedra(div, position) {
  const canvasBounds = renderGlobal.canvas.getBoundingClientRect();
  const scrollY = window.scrollY || window.pageYOffset;
  div.style.left = canvasBounds.left + position.x + 15 + 'px';
  div.style.top = canvasBounds.top + position.y + scrollY + 15 + 'px';
}

// Função para adicionar uma pedra ao mundo
export function adicionarPedra(pedra) {
  Matter.World.add(world, pedra);
}

// Exportar objetos necessários
export { engine, world };
