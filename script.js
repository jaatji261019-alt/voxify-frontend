const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");

let voices = [];
let audioURL = "";

// 🌍 AUTO LANGUAGE DETECT
function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi"; // Hindi
  if (/[\u0600-\u06FF]/.test(text)) return "ar"; // Arabic
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-cn"; // Chinese
  if (/[\u3040-\u30FF]/.test(text)) return "ja"; // Japanese
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko"; // Korean
  if (/[\u0400-\u04FF]/.test(text)) return "ru"; // Russian
  if (/[\u0E00-\u0E7F]/.test(text)) return "th"; // Thai
  if (/[\u0370-\u03FF]/.test(text)) return "el"; // Greek
  if (/[\u0590-\u05FF]/.test(text)) return "he"; // Hebrew
  return "en"; // default
}

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

// 🔊 PREVIEW
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
    utterance.lang = detectLanguage(textInput.value);
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// ⏹ STOP PREVIEW
function stopPreview() {
  speechSynthesis.cancel();
}

// 🎧 GENERATE (AUTO LANGUAGE)
async function generate() {
  if (!textInput.value.trim()) {
    alert("Enter text!");
    return;
  }

  loader.style.display = "block";

  const detectedLang = detectLanguage(textInput.value);

  try {
    const res = await fetch("https://voxify-ai.onrender.com/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textInput.value,
        lang: detectedLang
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

  loader.style.display = "none";
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

// 🎛 AUDIO CONTROLS
function playAudio() {
  player.play();
}

function pauseAudio() {
  player.pause();
}

function stopAudio() {
  player.pause();
  player.currentTime = 0;
}

// 🌗 THEME TOGGLE
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  themeToggle.textContent = document.body.classList.contains("light")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

// 📄 FILE UPLOAD (AUTO TEXT + AUTO AUDIO)
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) return;

  document.getElementById("fileType").innerText = "File: " + file.name;

  const formData = new FormData();
  formData.append("file", file);

  loader.style.display = "block";

  try {
    const res = await fetch("https://voxify-ai.onrender.com/upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    const cleanedText = data.text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    textInput.value = cleanedText;

    generate(); // 🔥 auto audio

  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }

  loader.style.display = "none";
}

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
