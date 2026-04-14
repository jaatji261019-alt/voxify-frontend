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

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
}

// ⏹ STOP PREVIEW
function stopPreview() {
  speechSynthesis.cancel();
}

// 🎧 GENERATE (backend MP3)
async function generate() {
  if (!textInput.value.trim()) {
    alert("Enter text!");
    return;
  }

  loader.style.display = "block";

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

// 🌗 THEME TOGGLE
const themeToggle = document.getElementById("themeToggle");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("light");

  if (document.body.classList.contains("light")) {
    themeToggle.textContent = "☀️ Light Mode";
  } else {
    themeToggle.textContent = "🌙 Dark Mode";
  }
});

// 📄 PDF UPLOAD + AUTO GENERATE 🔥
async function uploadPDF() {
  const fileInput = document.getElementById("pdfFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a PDF file!");
    return;
  }

  const formData = new FormData();
  formData.append("pdf", file);

  loader.style.display = "block";

  try {
    const res = await fetch("https://voxify-ai.onrender.com/upload-pdf", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.text) {
      textInput.value = data.text;

      // 🔥 AUTO GENERATE
      setTimeout(() => {
        generate();
      }, 300);

    } else {
      alert("Error reading PDF");
    }

  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }

  loader.style.display = "none";
}

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
async function uploadFile() {
  const fileInput = document.getElementById("fileUpload");
  const file = fileInput.files[0];

  if (!file) {
    alert("Select a file!");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://voxify-ai.onrender.com/upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.text) {
      textInput.value = data.text;

      // 🔥 AUTO GENERATE
      setTimeout(() => generate(), 300);

    } else {
      alert("Error reading file");
    }

  } catch (err) {
    console.error(err);
    alert("Upload failed");
  }
}
// 🟢 FRONTEND - Upload File Auto
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) return;

  // show file name
  document.getElementById("fileType").innerText = "File: " + file.name;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://voxify-ai.onrender.com/upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    // clean text
    const cleanedText = data.text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // put into textarea
    document.getElementById("text").value = cleanedText;

    // 🔥 AUTO GENERATE AUDIO
    generate();

  } catch (err) {
    console.error(err);
    alert("File upload error");
  }
}
