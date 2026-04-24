// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");
const imageContainer = document.getElementById("imageContainer");

let voices = [];
let currentAudioURL = null;
let currentImages = [];

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

// ================= 🎧 AUDIO =================
async function generateAudio() {
  if (!textInput.value.trim()) return alert("Enter text!");

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

    if (!res.ok) throw new Error("TTS failed");

    const blob = await res.blob();

    if (blob.size < 1000) throw new Error("Empty audio");

    if (currentAudioURL) URL.revokeObjectURL(currentAudioURL);

    currentAudioURL = URL.createObjectURL(blob);

    player.src = currentAudioURL;
    player.style.display = "block";

    await player.play().catch(() => {});

  } catch (err) {
    console.error(err);

    alert("Server failed → using browser voice");

    const fallback = new SpeechSynthesisUtterance(textInput.value);
    fallback.lang = detectLanguage(textInput.value);
    speechSynthesis.speak(fallback);
  }

  loader.style.display = "none";
}

// ================= 📥 AUDIO DOWNLOAD =================
function downloadAudio() {
  if (!currentAudioURL) return alert("Generate audio first!");

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
    // 🔥 Direct Pollinations (no backend dependency)
    const lines = textInput.value.split(".").filter(t => t.trim()).slice(0, 5);

    currentImages = lines.map(line => {
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(
        line + " cinematic lighting ultra realistic 4k"
      )}`;
    });

    startSlideshow(currentImages);
    showDownloadImagesButton();

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

  imageContainer.appendChild(img);

  function show() {
    img.src = images[index];
    index = (index + 1) % images.length;
  }

  show();
  setInterval(show, 3000);
}

// ================= 📥 IMAGE DOWNLOAD =================
function showDownloadImagesButton() {
  const btn = document.createElement("button");
  btn.innerText = "⬇ Download Images";
  btn.style.marginTop = "10px";

  btn.onclick = () => {
    currentImages.forEach((url, i) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `image_${i}.jpg`;
      a.click();
    });
  };

  imageContainer.appendChild(btn);
}

// ================= 🎬 VIDEO (BASIC VERSION) =================
function generateVideo() {
  if (!currentImages.length) return alert("Generate images first!");

  alert("⚠️ Video generation heavy hai → Render free pe fail hota hai.\nAbhi slideshow hi best option hai.");
}

// ================= 🌙 THEME =================
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};
