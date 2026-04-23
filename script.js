// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");
const imageContainer = document.getElementById("imageContainer");

let voices = [];
let currentAudioURL = null;

// ================= 🌍 LANGUAGE =================
function detectLanguage(text) {
  if (languageSelect.value !== "auto") return languageSelect.value;

  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return "en";
}

// ================= 🔥 LOAD VOICES =================
function loadVoices() {
  const v = speechSynthesis.getVoices();
  if (!v.length) return;

  voices = v;
  voiceSelect.innerHTML = "";

  v.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

speechSynthesis.onvoiceschanged = loadVoices;

// ================= 🔊 PREVIEW =================
function preview() {
  if (!textInput.value.trim()) return alert("Enter text!");

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

function stopPreview() {
  speechSynthesis.cancel();
}

// ================= 🎧 AUDIO GENERATION =================
async function generateAudio() {
  if (!textInput.value.trim()) {
    alert("Enter text!");
    return;
  }

  loader.style.display = "block";

  try {
    const lang = detectLanguage(textInput.value);

    const res = await fetch("https://voxify-ai.onrender.com/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textInput.value,
        lang: lang
      })
    });

    if (!res.ok) {
      throw new Error("Backend TTS failed");
    }

    const blob = await res.blob();

    // ❌ empty audio fix
    if (blob.size < 1000) {
      throw new Error("Audio empty");
    }

    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);

    currentAudioURL = URL.createObjectURL(blob);

    player.src = currentAudioURL;
    player.style.display = "block";

    await player.play().catch(() => {});

  } catch (err) {
    console.error("AUDIO ERROR:", err);

    // 🔥 fallback (browser TTS)
    alert("Server audio failed → using browser voice");

    const fallback = new SpeechSynthesisUtterance(textInput.value);
    fallback.lang = detectLanguage(textInput.value);
    speechSynthesis.speak(fallback);
  }

  loader.style.display = "none";
}

// ================= 📥 DOWNLOAD =================
function download() {
  if (!currentAudioURL) {
    alert("Generate audio first!");
    return;
  }

  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = "voxify.mp3";
  a.click();
}

// ================= 🎧 CONTROLS =================
function playAudio() {
  if (!player.src) return alert("Generate audio first!");
  player.play();
}

function pauseAudio() {
  player.pause();
}

function stopAudio() {
  player.pause();
  player.currentTime = 0;
}

// ================= 🖼 IMAGE GENERATION =================
async function generateImages() {
  if (!textInput.value.trim()) return alert("Enter text!");

  loader.style.display = "block";

  try {
    const res = await fetch("https://voxify-ai.onrender.com/generate-images", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textInput.value
      })
    });

    if (!res.ok) throw new Error("Image API failed");

    const data = await res.json();

    if (!data.images || !data.images.length) {
      throw new Error("No images");
    }

    startSlideshow(data.images);

  } catch (err) {
    console.error(err);
    alert("Image generation failed ❌");
  }

  loader.style.display = "none";
}

// ================= 🎬 SLIDESHOW =================
function startSlideshow(images) {
  imageContainer.innerHTML = "";

  let index = 0;

  const img = document.createElement("img");
  img.style.width = "100%";
  img.style.borderRadius = "10px";
  img.style.transition = "opacity 1s";

  imageContainer.appendChild(img);

  function show() {
    img.style.opacity = 0;

    setTimeout(() => {
      img.src = images[index];
      img.style.opacity = 1;
      index = (index + 1) % images.length;
    }, 500);
  }

  img.src = images[0];
  setInterval(show, 3000);
}

// ================= 🌙 THEME =================
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};
