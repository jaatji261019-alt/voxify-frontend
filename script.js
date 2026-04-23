// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const player = document.getElementById("player");
const videoPlayer = document.getElementById("videoPlayer");
const imageContainer = document.getElementById("imageContainer");

let voices = [];
let currentAudioURL = null;

// ================= LANGUAGE DETECTION =================
function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  return "en";
}

// ================= INIT VOICES =================
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

// ================= PREVIEW VOICE =================
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

// ================= 🎧 AUDIO GENERATION (ONLY AUDIO) =================
async function generateAudio() {
  if (!textInput.value.trim()) return alert("Enter text!");

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  progressBar.style.width = "0%";
  progressText.innerText = "0%";
  loader.style.display = "block";

  try {
    const source = new EventSource(
      `https://voxify-ai.onrender.com/tts-progress?text=${encodeURIComponent(textInput.value)}`
    );

    source.onmessage = async (event) => {
      if (event.data === "done") {
        source.close();

        const res = await fetch("https://voxify-ai.onrender.com/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textInput.value,
            lang: detectLanguage(textInput.value),
          }),
        });

        const blob = await res.blob();
        currentAudioURL = URL.createObjectURL(blob);

        player.src = currentAudioURL;
        player.style.display = "block";

        progressBar.style.width = "100%";
        progressText.innerText = "Audio Ready ✅";
        loader.style.display = "none";

        return;
      }

      progressBar.style.width = event.data + "%";
      progressText.innerText = event.data + "%";
    };
  } catch (err) {
    console.error(err);
    loader.style.display = "none";
    alert("Audio failed ❌");
  }
}

// ================= 🖼️ IMAGE GENERATION (ONLY IMAGES) =================
async function generateImages() {
  if (!textInput.value.trim()) return alert("Enter text!");

  try {
    const res = await fetch("https://voxify-ai.onrender.com/generate-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: textInput.value }),
    });

    const data = await res.json();

    showImages(data.images);
    startSlideshow(data.images);

  } catch (err) {
    console.error(err);
    alert("Image generation failed ❌");
  }
}

// ================= SHOW IMAGES =================
function showImages(images) {
  imageContainer.innerHTML = "";

  images.forEach(img => {
    const image = document.createElement("img");
    image.src = img;
    image.style.width = "100%";
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

// ================= 🎬 VIDEO GENERATION (ONLY VIDEO) =================
async function generateVideo() {
  if (!textInput.value.trim()) return alert("Enter text!");

  if (!currentAudioURL) {
    return alert("Pehle audio generate karo!");
  }

  try {
    loader.style.display = "block";

    const res = await fetch("https://voxify-ai.onrender.com/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioText: textInput.value,
        imagePrompts: textInput.value.split(".").filter(t => t.trim())
      }),
    });

    const blob = await res.blob();
    const videoURL = URL.createObjectURL(blob);

    videoPlayer.src = videoURL;
    videoPlayer.style.display = "block";
    videoPlayer.play();

    loader.style.display = "none";

  } catch (err) {
    console.error(err);
    loader.style.display = "none";
    alert("Video generation failed ❌");
  }
}

// ================= DOWNLOAD AUDIO =================
function download() {
  if (!currentAudioURL) return alert("Generate audio first!");

  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = "voxify.mp3";
  a.click();
}

// ================= AUDIO CONTROLS =================
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

// ================= THEME =================
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("light");
};
