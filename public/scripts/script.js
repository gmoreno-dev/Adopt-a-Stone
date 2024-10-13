// script.js

// Importações
import { iniciarFisicaDasPedras, adicionarPedra, engine } from './rocks.js';
import { armazenarInformacoesDoUsuario } from './payment.js';

const imagensPedras = [
  '../images/pedra1.png',
  '../images/pedra2.png',
  '../images/pedra3.png',
  '../images/pedra4.png',
  '../images/pedra5.png',
  '../images/pedra6.png',
  '../images/pedra7.png',
  '../images/pedra8.png',
  '../images/pedra9.png',
  '../images/pedra10.png',
];

// Envolver todo o código dentro de DOMContentLoaded para garantir que o DOM esteja carregado
document.addEventListener('DOMContentLoaded', () => {
  // Verifica em qual página estamos
  const pathname = window.location.pathname;

  if (pathname === '/' || pathname === '/index.html') {
    // Código específico para a página inicial
    iniciarFisicaDasPedras();

    // Obter referência ao elemento 'minha-pedra'
    const minhaPedraDiv = document.getElementById('minha-pedra');

    // Inicializa o Stripe com sua chave pública
    const stripe = Stripe('pk_test_51Q6a6o083GKZ9SEh6e5VFtUgiNSxxqMiYpOtH8tCgJwajtGJHlhcdyc4GJAJCCB99iZ5lSLGK3CnPhnWxhsHZW9A00tL8Wd53S'); // Substitua pela sua chave pública

    // Função para adotar uma pedra
    function adotarPedra() {
      fetch('/create-checkout-session', {
        method: 'POST',
      })
        .then((response) => response.json())
        .then((session) => {
          return stripe.redirectToCheckout({ sessionId: session.id });
        })
        .then((result) => {
          if (result.error) {
            alert(result.error.message);
          }
        })
        .catch((error) => {
          console.error('Erro:', error);
        });
    }

    // Adiciona event listener no botão "Adotar Pedra"
    const botaoAdotar = document.getElementById('adotar-pedra');
    if (botaoAdotar) {
      botaoAdotar.addEventListener('click', adotarPedra);
    } else {
      console.error('Elemento adotar-pedra não encontrado.');
    }

    // Carregar as pedras salvas
    fetch('/get-stones')
      .then((response) => response.json())
      .then((stones) => {
        stones.forEach((stoneData) => {
          // Criar e adicionar a pedra ao mundo
          carregarPedra(stoneData);
        });
      })
      .catch((error) => {
        console.error('Erro ao carregar as pedras do servidor:', error);
      });

    // Verificar se há informações de pedra no localStorage
    const pedraInfoString = localStorage.getItem('pedraInfo');
    if (pedraInfoString) {
      const pedraInfo = JSON.parse(pedraInfoString);
      criarPedra(pedraInfo.nome, pedraInfo.localizacao, pedraInfo.descricao);

      // Remover as informações do localStorage
      localStorage.removeItem('pedraInfo');
    }
  }

  if (pathname.endsWith('/success.html')) {
    // No need to check sessionStorage
    const form = document.getElementById('form-personalizar');
    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        let nome = document.getElementById('nome').value;
        let localizacao = document.getElementById('localizacao').value;
        let descricao = document.getElementById('descricao').value;
      
        // Ensure fields are limited to 20 characters
        nome = nome.substring(0, 20);
        localizacao = localizacao.substring(0, 20);
        descricao = descricao.substring(0, 20);
  
        if (nome && localizacao && descricao) {
          // Save stone info and redirect
          const pedraInfo = { nome, localizacao, descricao };
          localStorage.setItem('pedraInfo', JSON.stringify(pedraInfo));
          window.location.href = '/';
        } else {
          alert('Por favor, preencha todas as informações.');
        }
      });
    }
  }
});
// Função para criar a pedra com as informações fornecidas
function criarPedra(nome, localizacao, descricao) {
  // Seleciona uma imagem de pedra aleatória
  const indiceImagem = Math.floor(Math.random() * imagensPedras.length);
  const imagemPedra = imagensPedras[indiceImagem];

  // Raio da pedra
  const raio = 30;

  // Criar um novo objeto Image
  const img = new Image();
  img.src = imagemPedra;

  // Quando a imagem carregar, criar o corpo
  img.onload = () => {
    const larguraDaImagem = img.width;
    const alturaDaImagem = img.height;

    // Calcular xScale e yScale
    const xScale = (raio * 2) / larguraDaImagem;
    const yScale = (raio * 2) / alturaDaImagem;

    // Cria a pedra com a imagem como textura
    const pedra = Matter.Bodies.circle(
      Math.random() * 940 + 30, // Ajuste conforme a largura do canvas
      -30, // Posição Y acima da tela
      raio,
      {
        restitution: 0.5,
        render: {
          sprite: {
            texture: imagemPedra,
            xScale: xScale,
            yScale: yScale,
          },
        },
        label: nome,
        isStone: true, // Marca o corpo como uma pedra
        customData: {
          nome: nome,
          localizacao: localizacao,
          descricao: descricao,
        },
      }
    );

    // Adiciona a pedra ao mundo
    adicionarPedra(pedra);

    // Armazena a pedra do usuário
    armazenarInformacoesDoUsuario({ nome, imagem: imagemPedra, localizacao, descricao });

    // Destaca a pedra do usuário
    destacarMinhaPedra({ nome, imagem: imagemPedra });

    // Enviar a pedra ao servidor para salvar
    const pedraParaSalvar = {
      nome: nome,
      imagem: imagemPedra,
      localizacao: localizacao,
      descricao: descricao,
      x: pedra.position.x,
      y: pedra.position.y,
      // Não incluímos o userCode aqui, ele será gerado no servidor
    };

    fetch('/save-stone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pedraParaSalvar),
    })
      .then((response) => response.json())
      .catch((error) => {
        console.error('Erro ao salvar a pedra no servidor:', error);
      });
  };

  // Caso a imagem não carregue
  img.onerror = () => {
    alert('Erro ao carregar a imagem da pedra.');
  };
}

// Função para destacar a pedra do usuário
function destacarMinhaPedra(minhaPedra) {
  const minhaPedraDiv = document.getElementById('minha-pedra');
  if (minhaPedraDiv) {
    minhaPedraDiv.innerHTML = `<h2>Sua Pedra:</h2>
      <div class='pedra' style='margin: 0 auto; width:60px; height:60px; position: relative;'>
        <img src='${minhaPedra.imagem}' alt='Pedra' style='width:100%; height:100%;'>
        <span class='nome' style='position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); color: white; text-shadow: 1px 1px 2px black;'>${minhaPedra.nome}</span>
      </div>`;
  }
}

// Função para carregar pedras salvas
function carregarPedra(stoneData) {
  const { nome, imagem, localizacao, descricao, x, y, userCode } = stoneData;

  const raio = 30;

  // Criar um novo objeto Image
  const img = new Image();
  img.src = imagem;

  // Quando a imagem carregar, criar o corpo
  img.onload = () => {
    const larguraDaImagem = img.width;
    const alturaDaImagem = img.height;

    // Calcular xScale e yScale
    const xScale = (raio * 2) / larguraDaImagem;
    const yScale = (raio * 2) / alturaDaImagem;

    // Cria a pedra com a imagem como textura
    const pedra = Matter.Bodies.circle(
      x || Math.random() * 940 + 30,
      y || -30,
      raio,
      {
        restitution: 0.5,
        render: {
          sprite: {
            texture: imagem,
            xScale: xScale,
            yScale: yScale,
          },
          // Inicialmente sem destaque
          lineWidth: 1,
          strokeStyle: 'black',
        },
        label: nome,
        isStone: true, // Marca o corpo como uma pedra
        customData: {
          nome: nome,
          localizacao: localizacao,
          descricao: descricao,
          userCode: userCode, // Inclui o código do usuário
        },
      }
    );
    // Adiciona a pedra ao mundo
    adicionarPedra(pedra);
  };

  // Caso a imagem não carregue
  img.onerror = () => {
    console.error('Erro ao carregar a imagem da pedra:', imagem);
  };
}

