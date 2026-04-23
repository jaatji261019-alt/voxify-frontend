// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const player = document.getElementById("player");
const imageContainer = document.getElementById("imageContainer");

let voices = [];
let currentAudioURL = null;

// ================= 🌍 LANGUAGE DETECTION =================
function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return "en";
}

// ================= LOAD VOICES =================
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
    const res = await fetch("https://voxify-ai.onrender.com/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textInput.value,
        lang: detectLanguage(textInput.value)
      })
    });

    if (!res.ok) throw new Error("Server error");

    const blob = await res.blob();
    currentAudioURL = URL.createObjectURL(blob);

    player.src = currentAudioURL;
    player.style.display = "block";
    player.play();

  } catch (err) {
    console.error(err);
    alert("Audio generation failed ❌");
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

// ================= 🎧 AUDIO CONTROLS =================
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

    const data = await res.json();

    showImages(data.images);
    startSlideshow(data.images);

  } catch (err) {
    console.error(err);
    alert("Image generation failed ❌");
  }

  loader.style.display = "none";
}

// ================= SHOW IMAGES =================
function showImages(images) {
  imageContainer.innerHTML = "";

  images.forEach(img => {
    const image = document.createElement("img");
    image.src = img;
    image.style.width = "100%";
    image.style.borderRadius = "10px";
    image.style.marginBottom = "10px";
    imageContainer.appendChild(image);
  });
}

// ================= 🎬 SLIDESHOW =================
function startSlideshow(images) {
  if (!images.length) return;

  let index = 0;

  const slideImg = document.createElement("img");
  slideImg.style.width = "100%";
  slideImg.style.borderRadius = "10px";
  slideImg.style.transition = "opacity 1s ease-in-out";

  imageContainer.innerHTML = "";
  imageContainer.appendChild(slideImg);

  function nextSlide() {
    slideImg.style.opacity = 0;

    setTimeout(() => {
      slideImg.src = images[index];
      slideImg.style.opacity = 1;
      index = (index + 1) % images.length;
    }, 500);
  }

  slideImg.src = images[0];
  setInterval(nextSlide, 3000);
}

// ================= 🎬 VIDEO GENERATION =================
async function generateVideo() {
  if (!textInput.value.trim()) return alert("Enter text!");
  if (!currentAudioURL) return alert("Pehle audio generate karo!");

  loader.style.display = "block";

  try {
    const res = await fetch("https://voxify-ai.onrender.com/generate-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: textInput.value
      })
    });

    if (!res.ok) throw new Error("Video error");

    const blob = await res.blob();
    const videoURL = URL.createObjectURL(blob);

    const video = document.createElement("video");
    video.src = videoURL;
    video.controls = true;
    video.style.width = "100%";
    video.style.marginTop = "10px";

    imageContainer.innerHTML = "";
    imageContainer.appendChild(video);

    video.play();

  } catch (err) {
    console.error(err);
    alert("Video generation failed ❌");
  }

  loader.style.display = "none";
}

// ================= 🌙 THEME =================
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};
