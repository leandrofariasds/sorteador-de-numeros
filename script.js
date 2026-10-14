// =========================
// ELEMENTOS
// =========================

const drawForm = document.getElementById("drawForm");
const quantityInput = document.getElementById("quantity");
const minimumInput = document.getElementById("minimum");
const maximumInput = document.getElementById("maximum");
const noRepeatInput = document.getElementById("noRepeat");

const rangeInfo = document.getElementById("rangeInfo");
const errorMessage = document.getElementById("errorMessage");

const resultSection = document.getElementById("resultSection");
const resultNumbers = document.getElementById("resultNumbers");
const resultDescription = document.getElementById("resultDescription");
const resultCount = document.getElementById("resultCount");
const copyButton = document.getElementById("copyButton");

const feedbackToast = document.getElementById("feedbackToast");
const toastMessage = document.getElementById("toastMessage");

let lastResults = [];

// =========================
// ATUALIZAR INFORMAÇÃO
// =========================

function updateRangeInfo() {
    const minimum = Number(minimumInput.value);
    const maximum = Number(maximumInput.value);

    if (
        minimumInput.value === "" ||
        maximumInput.value === "" ||
        !Number.isSafeInteger(minimum) ||
        !Number.isSafeInteger(maximum) ||
        minimum > maximum
    ) {
        rangeInfo.textContent = "Informe um intervalo válido.";
        return;
    }

    rangeInfo.textContent =
        `Você pode sortear de ${minimum} até ${maximum}.`;
}

minimumInput.addEventListener("input", updateRangeInfo);
maximumInput.addEventListener("input", updateRangeInfo);

// =========================
// VALIDAÇÃO
// =========================

function validateDraw(quantity, minimum, maximum) {
    if (
        quantityInput.value.trim() === "" ||
        minimumInput.value.trim() === "" ||
        maximumInput.value.trim() === ""
    ) {
        return "Preencha todos os campos antes de sortear.";
    }

    if (
        !Number.isSafeInteger(quantity) ||
        !Number.isSafeInteger(minimum) ||
        !Number.isSafeInteger(maximum)
    ) {
        return "Digite apenas números inteiros válidos.";
    }

    if (quantity < 1 || quantity > 1000) {
        return "A quantidade deve estar entre 1 e 1000.";
    }

    if (minimum > maximum) {
        return "O número mínimo não pode ser maior que o máximo.";
    }

    const rangeSize = maximum - minimum + 1;

    if (!Number.isSafeInteger(rangeSize)) {
        return "O intervalo informado é muito grande.";
    }

    if (rangeSize > 1000000) {
        return "Escolha um intervalo com até 1 milhão de números.";
    }

    if (noRepeatInput.checked && quantity > rangeSize) {
        return `Você pediu ${quantity} números, mas o intervalo possui apenas ${rangeSize} números diferentes.`;
    }

    return "";
}

// =========================
// GERAR NÚMERO ALEATÓRIO
// =========================

// Usa crypto.getRandomValues para obter números aleatórios
// sem viés de módulo. Math.random é uma alternativa.
function randomInteger(minimum, maximum) {
    const range = maximum - minimum + 1;

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.getRandomValues === "function"
    ) {
        const limit = Math.floor(4294967296 / range) * range;
        const values = new Uint32Array(1);
        let value;

        do {
            crypto.getRandomValues(values);
            value = values[0];
        } while (value >= limit);

        return minimum + (value % range);
    }

    return minimum + Math.floor(Math.random() * range);
}

// =========================
// REALIZAR SORTEIO
// =========================

function drawNumbers(quantity, minimum, maximum, noRepeat) {
    const results = [];

    if (noRepeat) {
        // Cria um conjunto de números e embaralha com Fisher-Yates.
        const pool = Array.from(
            { length: maximum - minimum + 1 },
            (_, index) => minimum + index
        );

        for (let i = pool.length - 1; i > 0; i--) {
            const j = randomInteger(0, i);

            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        return pool.slice(0, quantity);
    }

    // Permite números repetidos quando a opção estiver desativada.
    for (let i = 0; i < quantity; i++) {
        results.push(randomInteger(minimum, maximum));
    }

    return results;
}

// =========================
// EXIBIR RESULTADOS
// =========================

function renderResults(numbers) {
    resultNumbers.replaceChildren();

    numbers.forEach((number, index) => {
        const ball = document.createElement("div");

        ball.className = "number-ball";
        ball.textContent = String(number);
        ball.style.animationDelay = `${Math.min(index, 20) * 35}ms`;

        resultNumbers.appendChild(ball);
    });

    resultCount.textContent = numbers.length === 1
        ? "1 número sorteado"
        : `${numbers.length} números sorteados`;

    resultDescription.textContent = noRepeatInput.checked
        ? "Todos os números são diferentes!"
        : "Confira os números sorteados!";

    resultSection.hidden = false;
}

// =========================
// EVENTO DO FORMULÁRIO
// =========================

drawForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const quantity = Number(quantityInput.value);
    const minimum = Number(minimumInput.value);
    const maximum = Number(maximumInput.value);

    const error = validateDraw(quantity, minimum, maximum);

    if (error) {
        errorMessage.textContent = error;
        resultSection.hidden = true;
        return;
    }

    errorMessage.textContent = "";

    lastResults = drawNumbers(
        quantity,
        minimum,
        maximum,
        noRepeatInput.checked
    );

    renderResults(lastResults);

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
});

// =========================
// COPIAR RESULTADOS
// =========================

copyButton.addEventListener("click", async function () {
    if (lastResults.length === 0) {
        return;
    }

    const text = lastResults.join(", ");

    try {
        await navigator.clipboard.writeText(text);
        showToast("Números copiados para a área de transferência!");
    } catch (error) {
        // Alternativa para contextos sem acesso à Clipboard API.
        const temporaryInput = document.createElement("textarea");

        temporaryInput.value = text;
        temporaryInput.style.position = "fixed";
        temporaryInput.style.opacity = "0";

        document.body.appendChild(temporaryInput);
        temporaryInput.select();

        const copied = document.execCommand("copy");
        temporaryInput.remove();

        if (copied) {
            showToast("Números copiados para a área de transferência!");
        } else {
            showToast("Não foi possível copiar. Selecione os números manualmente.");
        }
    }
});

// =========================
// FEEDBACK VISUAL
// =========================

function showToast(message) {
    toastMessage.textContent = message;

    if (typeof bootstrap !== "undefined") {
        bootstrap.Toast.getOrCreateInstance(feedbackToast, {
            delay: 2500
        }).show();
    } else {
        window.alert(message);
    }
}

// =========================
// INICIALIZAÇÃO
// =========================

updateRangeInfo();