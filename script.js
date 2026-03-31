const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");

let voices = [];
let audioURL = "";

// 🔥 Load voices
function loadVoices() {
  voices = speechSynthesis.getVoices();

  if (!voices.length) return;

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
  let count = 0;

  const interval = setInterval(() => {
    voices = speechSynthesis.getVoices();

    if (voices.length > 0 || count > 10) {
      loadVoices();
      clearInterval(interval);
    }

    count++;
  }, 500);
}

// 🔊 Preview (browser voice)
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
  } else {
    utterance.lang = languageSelect.value;
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// 🎧 Generate real MP3 from backend
async function generate() {
  if (!textInput.value) {
    alert("Enter text!");
    return;
  }

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
}

// 📥 Download MP3
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

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
