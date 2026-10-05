const MOEDAS = [100, 25, 10, 5, 1]; // centavos, ordem decrescente
const $ = (id) => document.getElementById(id);
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const PASSO = reduzido ? 120 : 650;
let execucao = 0; // invalida execuções antigas ao reiniciar

const brl = (c) => "R$ " + (c / 100).toFixed(2).replace(".", ",");

function paraCentavos(txt) {
  const limpo = txt.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  return Math.round(parseFloat(limpo) * 100);
}

function desenharTabela() {
  $("linhas").innerHTML = MOEDAS.map(
    (m) => `<tr id="m${m}"><td>${m} centavos</td><td id="u${m}">0</td></tr>`
  ).join("");
}

function limpar() {
  execucao++;
  desenharTabela();
  $("pilha").innerHTML = "";
  $("erro").textContent = "";
  $("msg").textContent = "";
  $("msg").className = "";
  $("troco").textContent = "R$ 0,00";
  $("resto").textContent = "0 centavos";
  $("qtd").textContent = "0";
  $("calc").disabled = false;
}

function empilhar(valor) {
  const d = document.createElement("div");
  const tam = 30 + Math.round(Math.log2(valor + 1) * 4);
  d.className = "moeda";
  d.style.width = d.style.height = tam + "px";
  d.style.fontSize = valor >= 100 ? ".7rem" : ".8rem";
  d.textContent = valor;
  $("pilha").appendChild(d);
}

async function calcular() {
  limpar();
  const id = execucao;
  const total = paraCentavos($("total").value);
  const pago = paraCentavos($("pago").value);

  if (total === null || pago === null) {
    $("erro").textContent = "Digite valores válidos, com até 2 casas decimais (ex.: 37,85).";
    return;
  }
  if (pago < total) {
    $("erro").textContent = "O valor pago é menor que o valor da compra. Faltam " + brl(total - pago) + ".";
    return;
  }

  let restante = pago - total;
  const troco = restante;
  $("troco").textContent = brl(troco);
  $("resto").textContent = restante + " centavos";

  if (troco === 0) {
    $("msg").textContent = "Pagamento exato. Não há troco a devolver.";
    $("msg").className = "fim";
    return;
  }

  $("calc").disabled = true;
  const usadas = Object.fromEntries(MOEDAS.map((m) => [m, 0]));
  let total_moedas = 0;
  let i = 0;

  while (restante > 0 && i < MOEDAS.length) {
    const m = MOEDAS[i];
    const linha = $("m" + m);
    $("msg").textContent = `Testando a moeda de ${m} centavos contra o restante de ${restante} centavos.`;
    linha.className = "";
    await esperar(PASSO / 2);
    if (id !== execucao) return;

    if (m > restante) {
      linha.className = "no";
      $("msg").textContent = `${m} é maior que ${restante}: moeda descartada.`;
      await esperar(PASSO);
      if (id !== execucao) return;
      linha.className = "";
      i++;
    } else {
      linha.className = "ok";
      restante -= m;
      usadas[m]++;
      total_moedas++;
      $("u" + m).textContent = usadas[m];
      $("resto").textContent = restante + " centavos";
      $("qtd").textContent = total_moedas;
      $("msg").textContent = `${m} cabe: devolve 1 moeda e o restante passa a ser ${restante} centavos.`;
      empilhar(m);
      await esperar(PASSO);
      if (id !== execucao) return;
    }
  }

  MOEDAS.forEach((m) => ($("m" + m).className = ""));
  $("msg").className = "fim";
  $("msg").textContent =
    `Concluído: ${brl(troco)} devolvidos com ${total_moedas} moeda(s). ` +
    `Para o conjunto {100, 25, 10, 5, 1}, a escolha gulosa produz o menor número possível de moedas.`;
  $("calc").disabled = false;
}

$("calc").addEventListener("click", calcular);
$("reset").addEventListener("click", limpar);
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && !$("calc").disabled) calcular(); });
desenharTabela();