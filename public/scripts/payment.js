// payment.js

// Função para processar a doação
export function processarDoacao(valor) {
  return new Promise((resolve, reject) => {
    // Simula um atraso como se estivesse processando um pagamento (Testes)
    setTimeout(() => {
      if (valor >= 1) {
        // Simula doação bem-sucedida
        resolve();
      } else {
        alert("Doação mínima de $1 necessária para adotar uma pedra.");
        reject(new Error("Doação insuficiente"));
      }
    }, 1000);
  });
}

// Função para armazenar as informações do usuário
export function armazenarInformacoesDoUsuario(usuario) {
  localStorage.setItem("minhaPedra", JSON.stringify(usuario));
}
