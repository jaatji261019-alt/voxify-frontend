// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const player = document.getElementById("player");
const videoPlayer = document.getElementById("videoPlayer");
const imageContainer = document.getElementById("imageContainer");

let voices = [];
let currentAudioURL = null;
let currentSource = null;

// ================= LANGUAGE =================
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

// ================= INIT =================
function initVoices() {
  let tries = 0;
  const interval = setInterval(() => {
    if (speechSynthesis.getVoices().length || tries > 10) {
      loadVoices();
      clearInterval(interval);
    }
    tries++;
  }, 500);
}

// ================= PREVIEW =================
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

// ================= GENERATE AUDIO =================
async function generate() {
  if (!textInput.value.trim()) return alert("Enter text!");

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  progressBar.style.width = "0%";
  progressText.innerText = "0%";
  loader.style.display = "block";

  if (currentAudioURL) {
    URL.revokeObjectURL(currentAudioURL);
    currentAudioURL = null;
  }

  if (currentSource) currentSource.close();

  try {
    currentSource = new EventSource(
      `https://voxify-ai.onrender.com/tts-progress?text=${encodeURIComponent(textInput.value)}`
    );

    currentSource.onmessage = async (event) => {
      if (event.data === "done") {
        currentSource.close();

        const res = await fetch("https://voxify-ai.onrender.com/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textInput.value,
            lang: detectLanguage(textInput.value)
          })
        });

        const blob = await res.blob();
        currentAudioURL = URL.createObjectURL(blob);

        player.src = currentAudioURL;
        player.style.display = "block";
        player.play();

        progressBar.style.width = "100%";
        progressText.innerText = "Done ✅";
        loader.style.display = "none";

        // 🔥 AUTO IMAGE GENERATE
        generateImages();

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

// ================= IMAGE GENERATE =================
async function generateImages() {
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

    // 🔥 slideshow start
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

// ================= 🎬 SLIDESHOW (CINEMATIC 🔥) =================
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

// ================= DOWNLOAD =================
function download() {
  if (!currentAudioURL) return alert("Generate audio first!");

  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = "voxify.mp3";
  a.click();
}

// ================= AUDIO CONTROL =================
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

// ================= INIT =================
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
