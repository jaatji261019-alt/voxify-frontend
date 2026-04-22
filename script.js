// ================= ELEMENTS =================
const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const player = document.getElementById("player");
const videoPlayer = document.getElementById("videoPlayer");

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

  // cleanup old audio
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

        if (!res.ok) throw new Error("TTS failed");

        const blob = await res.blob();
        currentAudioURL = URL.createObjectURL(blob);

        player.src = currentAudioURL;
        player.style.display = "block";

        await player.play().catch(() => {});

        progressBar.style.width = "100%";
        progressText.innerText = "Done ✅";
        loader.style.display = "none";
        return;
      }

      progressBar.style.width = event.data + "%";
      progressText.innerText = event.data + "%";
    };

    currentSource.onerror = () => {
      currentSource.close();
      loader.style.display = "none";
      alert("Progress error ❌ (Backend SSE issue)");
    };

  } catch (err) {
    console.error(err);
    loader.style.display = "none";
    alert("Audio failed ❌");
  }
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

// ================= FILE UPLOAD =================
async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  loader.style.display = "block";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("https://voxify-ai.onrender.com/upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.text) throw new Error("No text");

    textInput.value = data.text.replace(/\s+/g, " ").trim();

    await generate();

  } catch (err) {
    console.error(err);
    alert("Upload failed ❌");
  }

  loader.style.display = "none";
}

// ================= 🎬 VIDEO =================
async function createVideo() {
  if (!currentAudioURL) return alert("Generate audio first!");

  loader.style.display = "block";

  try {
    // 🔥 convert blob → file
    const audioBlob = await fetch(currentAudioURL).then(r => r.blob());

    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.mp3");
    formData.append("text", textInput.value);

    const res = await fetch("https://voxify-ai.onrender.com/cinematic-video", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Video failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    // 🎬 preview
    if (videoPlayer) {
      videoPlayer.src = url;
      videoPlayer.style.display = "block";
      videoPlayer.play();
    }

    // 📥 download
    const a = document.createElement("a");
    a.href = url;
    a.download = "cinematic.mp4";
    a.click();

    // cleanup
    setTimeout(() => URL.revokeObjectURL(url), 5000);

  } catch (err) {
    console.error(err);
    alert("Video generation failed ❌");
  }

  loader.style.display = "none";
}

// ================= INIT =================
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
