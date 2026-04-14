const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");

let voices = [];
let audioURLs = [];
let currentIndex = 0;

// 🌍 AUTO LANGUAGE DETECT
function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-cn";
  if (/[\u3040-\u30FF]/.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  if (/[\u0E00-\u0E7F]/.test(text)) return "th";
  if (/[\u0370-\u03FF]/.test(text)) return "el";
  if (/[\u0590-\u05FF]/.test(text)) return "he";
  return "en";
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

// 🔥 INIT voices
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

  utterance.lang = selectedVoice
    ? selectedVoice.lang
    : detectLanguage(textInput.value);

  if (selectedVoice) utterance.voice = selectedVoice;

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// ⏹ STOP PREVIEW
function stopPreview() {
  speechSynthesis.cancel();
}

// 🎧 GENERATE (FIXED)
async function generate() {
  if (!textInput.value.trim()) {
    alert("Enter text!");
    return;
  }

  loader.style.display = "block";

  try {
    const detectedLang = detectLanguage(textInput.value);

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

    // ❌ if backend error
    if (!res.ok) {
      throw new Error("Server not responding");
    }

    const data = await res.json();

    console.log("TTS Response:", data); // 🔥 DEBUG

    // ❌ if no URLs
    if (!data.urls || data.urls.length === 0) {
      throw new Error("No audio URLs received");
    }

    audioURLs = data.urls;
    currentIndex = 0;

    // 🔥 PLAY FIRST
    player.src = audioURLs[currentIndex];

    await player.play().catch(() => {
      alert("Tap play button manually (browser restriction)");
    });

    // 🔥 AUTO NEXT
    player.onended = () => {
      currentIndex++;
      if (currentIndex < audioURLs.length) {
        player.src = audioURLs[currentIndex];
        player.play();
      }
    };

  } catch (err) {
    console.error("TTS ERROR:", err);
    alert("Audio generate failed ❌");
  }

  loader.style.display = "none";
}

// 📥 DOWNLOAD
function download() {
  if (!audioURLs.length) {
    alert("Generate audio first!");
    return;
  }

  const a = document.createElement("a");
  a.href = audioURLs[0];
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

// 🌗 THEME
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");
  themeToggle.textContent = document.body.classList.contains("light")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

// 📄 FILE UPLOAD
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

    if (!data.text) throw new Error("No text extracted");

    const cleanedText = data.text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    textInput.value = cleanedText;

    generate();

  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }

  loader.style.display = "none";
}

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
