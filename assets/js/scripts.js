/* =========================================
   FINEDU — scripts.js
   ========================================= */

// ------------------------------------
// TYPEWRITER
// ------------------------------------
const phrases = [
    "sua plataforma educacional de finanças.",
    "aprenda a investir com segurança.",
    "finanças para todos os níveis.",
    "construa seu futuro financeiro."
];

const typewriter = document.getElementById("typewriter");
let phraseIndex = 0;
let letterIndex = 0;

function typePhrase() {
    if (!typewriter) return;
    const currentPhrase = phrases[phraseIndex];
    if (letterIndex < currentPhrase.length) {
        typewriter.textContent += currentPhrase.charAt(letterIndex);
        letterIndex++;
        setTimeout(typePhrase, 60);
    } else {
        setTimeout(erasePhrase, 2200);
    }
}

function erasePhrase() {
    if (!typewriter) return;
    if (letterIndex > 0) {
        typewriter.textContent = typewriter.textContent.slice(0, -1);
        letterIndex--;
        setTimeout(erasePhrase, 35);
    } else {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typePhrase, 300);
    }
}

// ------------------------------------
// DADOS AO VIVO
// ------------------------------------

// Selic atual (atualizada manualmente conforme reuniões do COPOM)
const SELIC_ATUAL = 14.50;

function fmt(n, decimals = 2) {
    return Number(n).toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/* --- Card Ibovespa --- */
// Token demonstrativo para GitHub Pages. Substitua por um token real apenas em ambiente privado.
const BRAPI_TOKEN = "TOKEN_FICTICIO_GITHUB_PAGES";
const IBOV_FALLBACK = {
    pontos: 137420,
    variacao: 0.87,
    data: "26/05/2026"
};

function atualizarCardIbovespa(ibov) {
    const elValor = document.getElementById("ibov-valor");
    const elBadge = document.getElementById("ibov-badge");
    if (!elValor) return;

    const sinal = ibov.variacao >= 0 ? "▲" : "▼";
    const cor   = ibov.variacao >= 0 ? "#1DB954" : "#e05555";
    const bgCor = ibov.variacao >= 0 ? "rgba(29,185,84,0.15)" : "rgba(224,85,85,0.15)";

    elValor.textContent = fmt(ibov.pontos, 0) + " pts";
    elBadge.textContent = `${sinal} ${fmt(Math.abs(ibov.variacao))}%`;
    elBadge.style.background = bgCor;
    elBadge.style.color = cor;
    elBadge.title = ibov.data ? `Atualizado em ${ibov.data}` : "";

    animarGraficoIbov(ibov.variacao);
}

async function carregarIbovespa() {
    const elValor = document.getElementById("ibov-valor");
    const elBadge = document.getElementById("ibov-badge");
    if (!elValor) return;

    try {
        if (!BRAPI_TOKEN || BRAPI_TOKEN.includes("FICTICIO")) {
            throw new Error("Token da brapi em modo demonstrativo");
        }

        const params = new URLSearchParams({
            range: "5d",
            interval: "1d"
        });

        const res = await fetch(
            `https://brapi.dev/api/quote/%5EBVSP?${params.toString()}`,
            {
                headers: { Authorization: `Bearer ${BRAPI_TOKEN}` },
                signal: AbortSignal.timeout(6000)
            }
        );

        if (!res.ok) throw new Error("Falha ao carregar Ibovespa");

        const data = await res.json();
        const quote = data.results?.[0];
        const pontos = Number(quote?.regularMarketPrice);
        const variacao = Number(quote?.regularMarketChangePercent);

        if (!Number.isFinite(pontos) || !Number.isFinite(variacao)) {
            throw new Error("Resposta da API sem cotacao valida");
        }

        atualizarCardIbovespa({
            pontos,
            variacao,
            data: quote.regularMarketTime
                ? new Date(quote.regularMarketTime * 1000).toLocaleString("pt-BR")
                : ""
        });
    } catch {
        atualizarCardIbovespa(IBOV_FALLBACK);
        if (elBadge) elBadge.title = "Usando valor demonstrativo para publicacao no GitHub Pages.";
    }
}

function animarGraficoIbov(pct) {
    // Gera pontos de linha que sobem ou descem de acordo com a variação real do dia
    const positivo = pct >= 0;
    const intensidade = Math.min(Math.abs(pct) / 3, 1); // normaliza 0–1
    const base = 32;
    const pts = [];
    const ptsFill = [];
    const steps = 7;

    for (let i = 0; i < steps; i++) {
        const x = (i / (steps - 1)) * 120;
        // ruído leve + tendência
        const tendencia = positivo
            ? base - (i / steps) * 28 * intensidade
            : base + (i / steps) * 10 * intensidade;
        const ruido = (Math.random() - 0.5) * 6;
        const y = Math.max(4, Math.min(38, tendencia + ruido));
        pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
        ptsFill.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }

    ptsFill.push("120,40");
    ptsFill.push("0,40");

    const linha = document.getElementById("ibov-linha");
    const area  = document.getElementById("ibov-area");
    if (linha) linha.setAttribute("points", pts.join(" "));
    if (area)  area.setAttribute("points", ptsFill.join(" "));

    const cor = positivo ? "#1DB954" : "#e05555";
    if (linha) linha.setAttribute("stroke", cor);
    const stop0 = area?.closest("svg")?.querySelector("#greenFade stop:first-child");
    const stop1 = area?.closest("svg")?.querySelector("#greenFade stop:last-child");
    if (stop0) stop0.setAttribute("stop-color", cor);
    if (stop1) stop1.setAttribute("stop-color", cor);

}

/* --- Card Câmbio (USD, EUR, BTC) --- */
async function carregarCambio() {
    const ids = ["val-usd", "val-eur", "val-btc"];
    const barIds = ["bar-usd", "bar-eur", "bar-btc"];
    if (!document.getElementById("val-usd")) return;

    try {
        const res = await fetch(
            "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL",
            { signal: AbortSignal.timeout(6000) }
        );
        const data = await res.json();

        const usd = parseFloat(data.USDBRL?.bid || 0);
        const eur = parseFloat(data.EURBRL?.bid || 0);
        const btc = parseFloat(data.BTCBRL?.bid || 0);

        // Exibe valores
        document.getElementById("val-usd").textContent = "R$" + fmt(usd);
        document.getElementById("val-eur").textContent = "R$" + fmt(eur);
        // BTC em milhares
        document.getElementById("val-btc").textContent = "R$" + fmt(btc / 1000, 1) + "k";

        // Barras: proporcional ao maior valor (normalizado visualmente)
        // USD e EUR são próximos; BTC é enorme — usamos escala independente
        const maxFiat = Math.max(usd, eur);
        document.getElementById("bar-usd").style.width = ((usd / maxFiat) * 90).toFixed(1) + "%";
        document.getElementById("bar-eur").style.width = ((eur / maxFiat) * 90).toFixed(1) + "%";
        // BTC barra sempre cheia (é o maior)
        document.getElementById("bar-btc").style.width = "100%";

        // Atualiza hora
        const hora = document.getElementById("cambio-hora");
        if (hora) {
            const agora = new Date();
            hora.textContent = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        }
    } catch {
        ["val-usd","val-eur","val-btc"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = "—";
        });
    }
}

/* --- Card Selic --- */
function exibirSelic() {
    const elPct = document.getElementById("selic-pct");
    const elRing = document.getElementById("selic-ring");
    if (!elPct) return;

    elPct.textContent = fmt(SELIC_ATUAL) + "%";

    // Anel: Selic máxima histórica recente ~14,75%. Normaliza o preenchimento.
    if (elRing) {
        const circunferencia = 2 * Math.PI * 32; // r=32 → ~201
        const pct = Math.min(SELIC_ATUAL / 15, 1); // 15% = anel cheio
        const offset = circunferencia * (1 - pct);
        elRing.setAttribute("stroke-dasharray", circunferencia.toFixed(1));
        elRing.setAttribute("stroke-dashoffset", offset.toFixed(1));
    }
}

// ------------------------------------
// MENU HAMBÚRGUER
// ------------------------------------
function initHamburger() {
    const btn   = document.getElementById("hamburger");
    const links = document.querySelector(".nav-links");
    if (!btn || !links) return;

    btn.addEventListener("click", () => {
        const aberto = links.classList.toggle("open");
        btn.innerHTML = aberto ? "✕" : "&#9776;";
        btn.setAttribute("aria-expanded", aberto);
    });

    // Fecha ao clicar em qualquer link
    links.querySelectorAll("a").forEach(a => {
        a.addEventListener("click", () => {
            links.classList.remove("open");
            btn.innerHTML = "&#9776;";
            btn.setAttribute("aria-expanded", false);
        });
    });

    // Fecha ao clicar fora
    document.addEventListener("click", (e) => {
        if (!btn.contains(e.target) && !links.contains(e.target)) {
            links.classList.remove("open");
            btn.innerHTML = "&#9776;";
            btn.setAttribute("aria-expanded", false);
        }
    });
}

// ------------------------------------
// QUEM SOMOS
// ------------------------------------
function initQuemSomos() {
    const painel = document.getElementById("colaborador-detalhe");
    const botoes = document.querySelectorAll(".team-bubble");
    if (!painel || !botoes.length) return;

    const nome = painel.querySelector("[data-team-name]");
    const papel = painel.querySelector("[data-team-role]");
    const descricao = painel.querySelector("[data-team-desc]");
    const indicador = painel.querySelector("[data-team-indicator]");

    function selecionar(botao) {
        botoes.forEach(item => item.classList.remove("active"));
        botao.classList.add("active");

        if (nome) nome.textContent = botao.dataset.name || "";
        if (papel) papel.textContent = botao.dataset.role || "";
        if (descricao) descricao.textContent = botao.dataset.desc || "";
        if (indicador) indicador.textContent = botao.dataset.indicator || "";
    }

    botoes.forEach(botao => {
        botao.addEventListener("click", () => selecionar(botao));
    });

    selecionar(botoes[0]);
}

// ------------------------------------
// INIT
// ------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Hambúrguer
    initHamburger();

    // Typewriter
    if (typewriter) {
        typewriter.textContent = "";
        typePhrase();
    }

    // Dados ao vivo (só roda no index onde os elementos existem)
    exibirSelic();
    carregarIbovespa();
    carregarCambio();
    initQuemSomos();

    // Atualiza câmbio a cada 60 segundos
    setInterval(carregarCambio, 60000);
    // Atualiza Ibovespa a cada 5 minutos
    setInterval(carregarIbovespa, 300000);
});
