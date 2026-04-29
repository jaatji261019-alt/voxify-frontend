// ================= CONFIG =================
const PYTHON_API = "https://voxify-python-api.onrender.com";
const NODE_API = "https://voxify-ai.onrender.com";

// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const voiceType = document.getElementById("voiceType");
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
    filterVoices(); // 🔥 important

  } catch (err) {
    console.log("⚠️ API failed → browser voices");
    loadBrowserVoices();
  }
}

// ================= FILTER VOICES =================
function filterVoices() {
  voiceSelect.innerHTML = "";

  let filtered = [...apiVoices];
  const type = voiceType.value;
  const lang = languageSelect.value;

  // 🎤 TYPE FILTER
  if (type === "male") {
    filtered = filtered.filter(v => v.gender === "Male");
  }
  else if (type === "female") {
    filtered = filtered.filter(v => v.gender === "Female");
  }
  else if (type === "ai") {
    filtered = filtered.filter(v => v.name.includes("Neural"));
  }

  // 🌍 LANGUAGE FILTER
  if (lang !== "auto") {
    filtered = filtered.filter(v => v.lang.startsWith(lang));
  }

  // 🔥 LIMIT + UI
  filtered.slice(0, 50).forEach(v => {
    const option = document.createElement("option");
    option.value = v.name;
    option.textContent = `${v.friendly} (${v.lang})`;
    voiceSelect.appendChild(option);
  });

  if (!filtered.length) {
    voiceSelect.innerHTML = `<option>No voices found</option>`;
  }
}

// dropdown change events
voiceType.addEventListener("change", filterVoices);
languageSelect.addEventListener("change", filterVoices);

// ================= FALLBACK VOICES =================
function loadBrowserVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";

  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
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
  if (!textInput.value.trim()) return alert("Enter text!");

  const utter = new SpeechSynthesisUtterance(textInput.value);

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
  if (!textInput.value.trim()) return alert("Enter text!");

  loader.style.display = "block";

  try {
    let res;

    if (apiVoices.length) {
      let selectedVoice = voiceSelect.value || "en-US-AriaNeural";

      res = await fetch(`${PYTHON_API}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: textInput.value,
          voice: selectedVoice
        })
      });
    } else {
      res = await fetch(`${NODE_API}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: textInput.value,
          lang: detectLanguage(textInput.value)
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

  } catch (err) {
    console.log("⚠️ fallback speech");

    const fallback = new SpeechSynthesisUtterance(textInput.value);
    speechSynthesis.speak(fallback);
  }

  loader.style.display = "none";
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
  if (!textInput.value.trim()) return alert("Enter text!");

  clearInterval(slideInterval);

  const lines = textInput.value.split(".").filter(t => t.trim()).slice(0, 5);

  currentImages = lines.map(line =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(line + " cinematic lighting 4k")}`
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
