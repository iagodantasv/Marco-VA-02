// Typewriter
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
    const currentPhrase = phrases[phraseIndex];
    if (letterIndex < currentPhrase.length) {
        typewriter.textContent += currentPhrase.charAt(letterIndex);
        letterIndex += 1;
        setTimeout(typePhrase, 60);
    } else {
        setTimeout(erasePhrase, 2000);
    }
}

function erasePhrase() {
    if (letterIndex > 0) {
        typewriter.textContent = typewriter.textContent.slice(0, -1);
        letterIndex -= 1;
        setTimeout(erasePhrase, 35);
    } else {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        setTimeout(typePhrase, 300);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (!typewriter) return;
    typewriter.textContent = "";
    typePhrase();
});