const textEl = document.getElementById("text");
const player = document.getElementById("player");
const language = document.getElementById("language");
const voiceSelect = document.getElementById("voiceSelect");
// ===== Load voices =====
function loadVoices() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}
function loadVoices() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

// ✅ KEEP THIS
speechSynthesis.onvoiceschanged = loadVoices;

// ✅ ADD THESE (fix)
const voiceSelect = document.getElementById("voiceSelect");

function loadVoices() {
  const voices = speechSynthesis.getVoices();

  if (!voices.length) return;

  voiceSelect.innerHTML = "";

  voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

function initVoices() {
  let count = 0;

  const interval = setInterval(() => {
    const voices = speechSynthesis.getVoices();

    if (voices.length !== 0 || count > 10) {
      loadVoices();
      clearInterval(interval);
    }

    count++;
  }, 500);
}

// 🔥 IMPORTANT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();

// ===== Preview =====
function preview() {
  const text = textEl.value || "Voice preview";

  const speech = new SpeechSynthesisUtterance(text);

  const voices = speechSynthesis.getVoices();
  const selectedVoice = voices[voiceSelect.value];

  if (selectedVoice) speech.voice = selectedVoice;

  speech.lang = language.value;

  speechSynthesis.cancel();
  speechSynthesis.speak(speech);
}

// ===== Generate (backend)
async function generate() {
  if (!textEl.value) return alert("Enter text");

  const res = await fetch("https://voxify-ai.onrender.com/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: textEl.value,
      lang: language.value
    })
  });

  const blob = await res.blob();
  player.src = URL.createObjectURL(blob);
}

// ===== Download
function download() {
  const a = document.createElement("a");
  a.href = player.src;
  a.download = "voxify.mp3";
  a.click();
}
