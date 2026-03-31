const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");

let voices = [];

// 🔥 Load voices properly
function loadVoices() {
  voices = speechSynthesis.getVoices();

  voiceSelect.innerHTML = "";

  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = voice.name + " (" + voice.lang + ")";
    voiceSelect.appendChild(option);
  });
}

// 🔥 FIX for mobile delay
function initVoices() {
  let interval = setInterval(() => {
    voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      loadVoices();
      clearInterval(interval);
    }
  }, 500);
}

// 🔥 MAIN SPEAK FUNCTION
function preview() {
  if (!textInput.value) {
    alert("Enter text!");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(textInput.value);

  const selectedVoice = voices[voiceSelect.value];
  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  }

  speechSynthesis.cancel(); // stop previous
  speechSynthesis.speak(utterance);
}

// dummy (abhi baad me improve karenge)
function generate() {
  preview();
}

function download() {
  alert("Download feature coming soon 😎");
}

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
