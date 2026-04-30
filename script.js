// ================= CONFIG =================
const PYTHON_API = "https://voxify-python-api.onrender.com";
const NODE_API = "https://voxify-ai.onrender.com";

// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const voiceType = document.getElementById("voiceType");
const voiceStyle = document.getElementById("voiceStyle"); // 🔥 NEW
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");
const imageContainer = document.getElementById("imageContainer");
const fileInput = document.getElementById("fileInput");

let voices = [];
let apiVoices = [];
let currentAudioURL = null;
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
    const data = await res.json();

    apiVoices = data;
    filterVoices();

  } catch {
    loadBrowserVoices();
  }
}

// ================= FILTER VOICES =================
function filterVoices() {
  voiceSelect.innerHTML = "";

  let filtered = [...apiVoices];

  // TYPE
  if (voiceType.value === "male") {
    filtered = filtered.filter(v => v.gender === "Male");
  } else if (voiceType.value === "female") {
    filtered = filtered.filter(v => v.gender === "Female");
  } else if (voiceType.value === "ai") {
    filtered = filtered.filter(v => v.name.includes("Neural"));
  }

  // LANGUAGE
  if (languageSelect.value !== "auto") {
    filtered = filtered.filter(v =>
      v.lang.startsWith(languageSelect.value)
    );
  }

  filtered.slice(0, 50).forEach(v => {
    const option = document.createElement("option");
    option.value = v.name;
    option.textContent = `${v.friendly}`;
    voiceSelect.appendChild(option);
  });

  if (!filtered.length) {
    voiceSelect.innerHTML = `<option>No voices found</option>`;
  }
}

// ================= EVENTS =================
voiceType.addEventListener("change", filterVoices);
languageSelect.addEventListener("change", filterVoices);

// ================= FALLBACK VOICES =================
function loadBrowserVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name}`;
    voiceSelect.appendChild(option);
  });
}

speechSynthesis.onvoiceschanged = loadBrowserVoices;

// ================= FILE UPLOAD =================
async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) return alert("Select file!");

  const formData = new FormData();
  formData.append("file", file);

  loader.style.display = "block";

  try {
    const res = await fetch(`${NODE_API}/upload-file`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    textInput.value = data.text;

  } catch {
    alert("❌ File failed");
  }

  loader.style.display = "none";
}

// ================= PREVIEW =================
function preview() {
  const text = textInput.value.trim();
  if (!text) return alert("Enter text!");

  const utter = new SpeechSynthesisUtterance(text);

  const selected = voices[voiceSelect.value];
  if (selected) utter.voice = selected;

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function stopPreview() {
  speechSynthesis.cancel();
}

// ================= AUDIO GENERATE =================
async function generateAudio() {
  const text = textInput.value.trim();
  if (!text) return alert("Enter text!");

  loader.style.display = "block";

  try {
    let res;

    if (apiVoices.length) {
      const selectedVoice = voiceSelect.value || "en-US-AriaNeural";

      res = await fetch(`${PYTHON_API}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          voice: selectedVoice,
          pitch: getPitch(),
          rate: getRate()
        })
      });

    } else {
      res = await fetch(`${NODE_API}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: text,
          lang: detectLanguage(text)
        })
      });
    }

    if (!res.ok) throw new Error();

    const blob = await res.blob();

    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);
    currentAudioURL = URL.createObjectURL(blob);

    player.src = currentAudioURL;
    player.style.display = "block";
    player.play();

  } catch {
    const fallback = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(fallback);
  }

  loader.style.display = "none";
}

// ================= STYLE LOGIC =================
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

// ================= DOWNLOAD =================
function downloadAudio() {
  if (!currentAudioURL) return alert("Generate first");

  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = "voxify.mp3";
  a.click();
}

// ================= AUDIO CONTROL =================
function playAudio() { player.play(); }
function pauseAudio() { player.pause(); }
function stopAudio() {
  player.pause();
  player.currentTime = 0;
}

// ================= IMAGES =================
function generateImages() {
  const text = textInput.value.trim();
  if (!text) return alert("Enter text!");

  clearInterval(slideInterval);

  const lines = text.split(".").filter(t => t.trim()).slice(0, 5);

  currentImages = lines.map(line =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(line + " cinematic 4k")}`
  );

  startSlideshow(currentImages);
}

// ================= SLIDESHOW =================
function startSlideshow(images) {
  imageContainer.innerHTML = "";

  let index = 0;
  const img = document.createElement("img");
  imageContainer.appendChild(img);

  function show() {
    img.src = images[index];
    index = (index + 1) % images.length;
  }

  show();
  slideInterval = setInterval(show, 3000);
}

// ================= DOWNLOAD IMAGES =================
function downloadImages() {
  currentImages.forEach((url, i) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `image_${i}.jpg`;
    a.click();
  });
}

// ================= THEME =================
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};

// ================= INIT =================
loadVoicesAPI();
