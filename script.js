// ================= CONFIG =================
const PYTHON_API = "https://voxify-python-api.onrender.com";
const NODE_API = "https://voxify-ai.onrender.com";
const VIDEO_API = "https://voxify-cinematic-api.onrender.com";

// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const voiceType = document.getElementById("voiceType");
const voiceStyle = document.getElementById("voiceStyle");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");
const videoPlayer = document.getElementById("videoPlayer");
const imageContainer = document.getElementById("imageContainer");
const fileInput = document.getElementById("fileInput");

let voices = [];
let apiVoices = [];
let currentAudioURL = null;
let uploadedAudioURL = null; // 🔥 FIX
let currentImages = [];
let slideInterval = null;

// ================= LANGUAGE =================
function detectLanguage(text) {
  if (languageSelect.value !== "auto") return languageSelect.value;
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return "en";
}

// ================= LOAD VOICES =================
async function loadVoicesAPI() {
  try {
    const res = await fetch(`${PYTHON_API}/voices`);
    apiVoices = await res.json();
    filterVoices();
  } catch {
    loadBrowserVoices();
  }
}

// ================= FILTER =================
function filterVoices() {
  voiceSelect.innerHTML = "";

  let filtered = [...apiVoices];

  if (voiceType.value === "male") {
    filtered = filtered.filter(v => v.gender === "Male");
  } else if (voiceType.value === "female") {
    filtered = filtered.filter(v => v.gender === "Female");
  } else if (voiceType.value === "ai") {
    filtered = filtered.filter(v => v.name.includes("Neural"));
  }

  if (languageSelect.value !== "auto") {
    filtered = filtered.filter(v => v.lang.startsWith(languageSelect.value));
  }

  filtered.slice(0, 50).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = v.friendly;
    voiceSelect.appendChild(opt);
  });
}

// ================= FALLBACK =================
function loadBrowserVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  voices.forEach((v, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = v.name;
    voiceSelect.appendChild(opt);
  });
}

// ================= AUDIO =================
async function generateAudio() {
  const text = textInput.value.trim();
  if (!text) return alert("Enter text!");

  loader.style.display = "block";

  try {
    const res = await fetch(`${PYTHON_API}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        voice: voiceSelect.value || "en-US-AriaNeural",
        pitch: getPitch(),
        rate: getRate()
      })
    });

    const blob = await res.blob();

    // 🔥 local preview
    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
    currentAudioURL = URL.createObjectURL(blob);

    player.src = currentAudioURL;
    player.style.display = "block";
    player.play();

    // 🔥 UPLOAD AUDIO (IMPORTANT FIX)
    const formData = new FormData();
    formData.append("file", blob, "audio.mp3");

    const uploadRes = await fetch(`${NODE_API}/upload-audio`, {
      method: "POST",
      body: formData
    });

    const uploadData = await uploadRes.json();
    uploadedAudioURL = uploadData.url; // 🔥 real URL

  } catch (err) {
    console.log(err);
    alert("Audio failed");
  }

  loader.style.display = "none";
}

// ================= VIDEO =================
async function generateVideo() {
  const text = textInput.value.trim();

  if (!text || !uploadedAudioURL) {
    return alert("Generate audio first!");
  }

  loader.style.display = "block";

  try {
    const res = await fetch(`${VIDEO_API}/cinematic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text,
        audioUrl: uploadedAudioURL // 🔥 FIXED
      })
    });

    const blob = await res.blob();
    const videoURL = URL.createObjectURL(blob);

    videoPlayer.src = videoURL;
    videoPlayer.style.display = "block";
    videoPlayer.play();

  } catch (err) {
    console.log(err);
    alert("Video failed");
  }

  loader.style.display = "none";
}

// ================= STYLE =================
function getPitch() {
  switch (voiceStyle.value) {
    case "deep": return "-20Hz";
    case "soft": return "+10Hz";
    case "sad": return "-10Hz";
    case "angry": return "+15Hz";
    case "story": return "+5Hz";
    default: return "0Hz";
  }
}

function getRate() {
  switch (voiceStyle.value) {
    case "deep": return "-10%";
    case "soft": return "-5%";
    case "sad": return "-20%";
    case "angry": return "+15%";
    case "story": return "-10%";
    default: return "0%";
  }
}

// ================= INIT =================
loadVoicesAPI();
