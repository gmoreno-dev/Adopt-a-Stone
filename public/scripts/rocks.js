
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
  // Cria o renderizador
  const render = Matter.Render.create({
    element: document.getElementById("monte-de-pedras"),
    engine: engine,
    options: {
      width: 1000,
      height: 600,
      wireframes: false,
      background: "transparent",
      // ... outras opções
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
  const chao = Matter.Bodies.rectangle(500, 610, 1020, 60, { isStatic: true, isWall: true });
  const paredeEsquerda = Matter.Bodies.rectangle(-10, 300, 60, 600, { isStatic: true, isWall: true });
  const paredeDireita = Matter.Bodies.rectangle(1010, 300, 60, 600, { isStatic: true, isWall: true });

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
}

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
    infoDiv.style.position = 'absolute';
    infoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    infoDiv.style.color = 'white';
    infoDiv.style.padding = '10px';
    infoDiv.style.borderRadius = '5px';
    infoDiv.style.pointerEvents = 'none';
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
  div.style.left = canvasBounds.left + position.x + 15 + 'px';
  div.style.top = canvasBounds.top + position.y + 15 + 'px';
}


// Função para adicionar uma pedra ao mundo
export function adicionarPedra(pedra) {
  Matter.World.add(world, pedra);
}

// Exportar objetos necessários
export { engine, world };
