const loader = document.getElementById("loader");

const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");

let voices = [];
let audioURL = "";

// 🔥 Load voices
function loadVoices() {
  const availableVoices = speechSynthesis.getVoices();
  if (!availableVoices.length) return;

  voices = availableVoices;
  voiceSelect.innerHTML = "";

  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

// 🔥 Fix mobile delay
function initVoices() {
  let attempts = 0;

  const interval = setInterval(() => {
    const availableVoices = speechSynthesis.getVoices();

    if (availableVoices.length > 0 || attempts > 10) {
      loadVoices();
      clearInterval(interval);
    }

    attempts++;
  }, 500);
}

// 🔊 PREVIEW (browser voice)
function preview() {
  if (!textInput.value.trim()) {
    alert("Enter text!");
    return;
  }

  const utterance = new SpeechSynthesisUtterance(textInput.value);

  const selectedVoice = voices[voiceSelect.value];

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = languageSelect.value;
  }

  speechSynthesis.cancel(); // stop previous
  speechSynthesis.speak(utterance);
}

// ⏹ STOP PREVIEW (🔥 NEW)
function stopPreview() {
  speechSynthesis.cancel();
}

// 🎧 GENERATE (backend MP3)
async function generate() {
  if (!textInput.value.trim()) {
    alert("Enter text!");
    return;
  }

  loader.style.display = "block"; // 🔥 show loader

  try {
    const res = await fetch("https://voxify-ai.onrender.com/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textInput.value,
        lang: languageSelect.value
      })
    });

    if (!res.ok) throw new Error("Server error");

    const blob = await res.blob();
    audioURL = URL.createObjectURL(blob);

    player.src = audioURL;
    player.play();

  } catch (err) {
    console.error(err);
    alert("Error generating audio");
  }

  loader.style.display = "none"; // 🔥 hide loader
}

// 📥 DOWNLOAD
function download() {
  if (!audioURL) {
    alert("Generate audio first!");
    return;
  }

  const a = document.createElement("a");
  a.href = audioURL;
  a.download = "voxify.mp3";
  a.click();
}

// 🎛 AUDIO CONTROLS (for generated audio)

function playAudio() {
  if (!player.src) {
    alert("Generate audio first!");
    return;
  }
  player.play();
}

function pauseAudio() {
  player.pause();
}

function stopAudio() {
  player.pause();
  player.currentTime = 0;
}

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();

const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    themeToggle.textContent = "🌙 Dark Mode";
  }
});

