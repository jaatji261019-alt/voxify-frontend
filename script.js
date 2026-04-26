// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const languageSelect = document.getElementById("language");
const player = document.getElementById("player");
const imageContainer = document.getElementById("imageContainer");
const fileInput = document.getElementById("fileInput");

let voices = [];
let apiVoices = [];
let currentAudioURL = null;
let currentImages = [];
let slideInterval = null;

// ================= 🌍 LANGUAGE =================
function detectLanguage(text) {
  if (languageSelect.value !== "auto") return languageSelect.value;

  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  return "en";
}

// ================= 🔥 LOAD VOICES (API + Browser) =================
async function loadVoicesAPI() {
  try {
    const res = await fetch("https://your-python-tts.onrender.com/voices");
    const data = await res.json();

    apiVoices = data;

    voiceSelect.innerHTML = "";

    data.slice(0, 50).forEach(v => {
      const option = document.createElement("option");
      option.value = v.name;
      option.textContent = `${v.friendly} (${v.gender})`;
      voiceSelect.appendChild(option);
    });

  } catch (err) {
    console.log("API voice load failed → using browser voices");
    loadBrowserVoices();
  }
}

// fallback
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

// ================= 📄 FILE UPLOAD =================
async function uploadFile() {
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  loader.style.display = "block";

  try {
    const res = await fetch("https://voxify-ai.onrender.com/upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    textInput.value = data.text;
    alert("✅ Text extracted!");

  } catch (err) {
    alert("❌ File extract failed");
  }

  loader.style.display = "none";
}

// ================= 🔊 PREVIEW =================
function preview() {
  if (!textInput.value.trim()) return alert("Enter text!");

  // API voice preview not possible → fallback browser
  const utter = new SpeechSynthesisUtterance(textInput.value);

  const selected = voices[voiceSelect.value];
  if (selected) {
    utter.voice = selected;
  }

  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function stopPreview() {
  speechSynthesis.cancel();
}

// ================= 🎧 AUDIO GENERATE =================
async function generateAudio() {
  if (!textInput.value.trim()) return alert("Enter text!");

  loader.style.display = "block";

  try {
    const selectedVoice = voiceSelect.value;

    let res;

    // 🔥 if API voice selected
    if (apiVoices.length) {
      res = await fetch("https://your-python-tts.onrender.com/tts", {
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
      // fallback old backend
      res = await fetch("https://voxify-ai.onrender.com/tts", {
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

    await player.play();

  } catch (err) {
    console.log(err);
    alert("⚠️ Using browser voice");

    const fallback = new SpeechSynthesisUtterance(textInput.value);
    speechSynthesis.speak(fallback);
  }

  loader.style.display = "none";
}

// ================= 📥 DOWNLOAD =================
function downloadAudio() {
  if (!currentAudioURL) return alert("Generate audio first!");

  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = "voxify.mp3";
  a.click();
}

// ================= 🎧 CONTROLS =================
function playAudio() { player.play(); }
function pauseAudio() { player.pause(); }
function stopAudio() { player.pause(); player.currentTime = 0; }

// ================= 🖼 IMAGE =================
function generateImages() {
  if (!textInput.value.trim()) return alert("Enter text!");

  clearInterval(slideInterval);
  loader.style.display = "block";

  const lines = textInput.value.split(".").filter(t => t.trim()).slice(0, 5);

  currentImages = lines.map(line =>
    `https://image.pollinations.ai/prompt/${encodeURIComponent(line + " cinematic lighting 4k")}`
  );

  startSlideshow(currentImages);
  loader.style.display = "none";
}

// ================= 🎬 SLIDESHOW =================
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

// ================= 📥 IMAGE DOWNLOAD =================
function downloadImages() {
  currentImages.forEach((url, i) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `image_${i}.jpg`;
    a.click();
  });
}

// ================= 🎬 VIDEO =================
function generateVideo() {
  alert("⚠️ Free version = slideshow only");
}

// ================= 🌙 THEME =================
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};

// ================= 🔗 SHARE =================
const shareURL = window.location.href;
const shareText = "🔥 Free AI Tool! Try Voxify AI:";

function shareWhatsApp() {
  window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareURL)}`);
}

function shareTelegram() {
  window.open(`https://t.me/share/url?url=${encodeURIComponent(shareURL)}&text=${encodeURIComponent(shareText)}`);
}

function shareTwitter() {
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareURL)}`);
}

function shareFacebook() {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareURL)}`);
}

function sharePinterest() {
  const image = currentImages[0] || "";
  window.open(`https://pinterest.com/pin/create/button/?url=${shareURL}&media=${image}&description=${shareText}`);
}

function shareApp() {
  if (navigator.share) {
    navigator.share({ title: "Voxify AI", text: shareText, url: shareURL });
  }
}

function copyLink() {
  navigator.clipboard.writeText(shareURL);
  alert("Copied ✅");
}

// ================= INIT =================
loadVoicesAPI();
