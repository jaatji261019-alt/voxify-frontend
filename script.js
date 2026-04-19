const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const player = document.getElementById("player");

let voices = [];
let currentAudioURL = null;
let currentSource = null;

// 🌍 LANGUAGE DETECT
function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ar";
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh-cn";
  if (/[\u3040-\u30FF]/.test(text)) return "ja";
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko";
  if (/[\u0400-\u04FF]/.test(text)) return "ru";
  return "en";
}

// 🔥 LOAD VOICES
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

// 🔥 INIT VOICES
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

// 🔊 PREVIEW
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

// 🎧 GENERATE AUDIO
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

  if (currentSource) {
    currentSource.close();
  }

  try {
    currentSource = new EventSource(
      `https://voxify-ai.onrender.com/tts-progress?text=${encodeURIComponent(textInput.value)}`
    );

    currentSource.onmessage = async (event) => {
      if (event.data === "done") {
        currentSource.close();
        progressText.innerText = "Generating audio...";

        const res = await fetch("https://voxify-ai.onrender.com/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textInput.value,
            lang: detectLanguage(textInput.value)
          })
        });

        if (!res.ok) throw new Error("Server error");

        const blob = await res.blob();
        currentAudioURL = URL.createObjectURL(blob);

        player.src = currentAudioURL;

        await player.play().catch(() => {
          console.log("Autoplay blocked");
        });

        progressBar.style.width = "100%";
        progressText.innerText = "Done ✅";
        loader.style.display = "none";
        return;
      }

      const percent = event.data;
      progressBar.style.width = percent + "%";
      progressText.innerText = percent + "%";
    };

    currentSource.onerror = () => {
      currentSource.close();
      loader.style.display = "none";
      alert("Progress error ❌");
    };

  } catch (err) {
    console.error(err);
    loader.style.display = "none";
    alert("Audio failed ❌");
  }
}

// 📥 DOWNLOAD AUDIO
function download() {
  if (!currentAudioURL) return alert("Generate audio first!");

  const a = document.createElement("a");
  a.href = currentAudioURL;
  a.download = "voxify.mp3";
  a.click();
}

// 🎛 AUDIO CONTROLS
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

// 🌗 THEME
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// 📄 FILE UPLOAD (FIXED)
async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  document.getElementById("fileType").innerText = "File: " + file.name;
  loader.style.display = "block";

  try {
    const formData = new FormData();
    formData.append("file", file);

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

// 🎬 VIDEO GENERATOR (IMPROVED FRONTEND)
async function createVideo() {
  if (!currentAudioURL) return alert("Generate audio first!");

  const canvas = document.getElementById("videoCanvas");
  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream);

  let chunks = [];

  recorder.ondataavailable = e => chunks.push(e.data);

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "voxify-video.webm";
    a.click();

    URL.revokeObjectURL(url);
  };

  recorder.start();

  const audio = new Audio(currentAudioURL);
  audio.play();

  let words = textInput.value.split(" ");
  let index = 0;

  function draw() {
    // 🎨 gradient background (cinematic feel)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#000");
    gradient.addColorStop(1, "#1e293b");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 42px Poppins";
    ctx.textAlign = "center";

    const line = words.slice(index, index + 6).join(" ");
    ctx.fillText(line, canvas.width / 2, canvas.height / 2);

    requestAnimationFrame(draw);
  }

  draw();

  const interval = setInterval(() => {
    index += 6;

    if (index >= words.length) {
      clearInterval(interval);
      recorder.stop();
      audio.pause();
    }
  }, 1000);

  alert("Video generating 🎬");
}

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
