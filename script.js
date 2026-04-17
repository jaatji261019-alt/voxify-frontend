const loader = document.getElementById("loader");
const textInput = document.getElementById("text");
const voiceSelect = document.getElementById("voiceSelect");
const player = document.getElementById("player");

let voices = [];

// 🌍 AUTO LANGUAGE DETECT
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

  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

// 🔥 INIT VOICES
function initVoices() {
  let attempts = 0;

  const interval = setInterval(() => {
    if (speechSynthesis.getVoices().length || attempts > 10) {
      loadVoices();
      clearInterval(interval);
    }
    attempts++;
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

// 🎧 GENERATE WITH PROGRESS
async function generate() {
  if (!textInput.value.trim()) return alert("Enter text!");

  const progressBar = document.getElementById("progressBar");
  const progressText = document.getElementById("progressText");

  progressBar.style.width = "0%";
  progressText.innerText = "0%";

  try {
    const source = new EventSource(
      `https://voxify-ai.onrender.com/tts-progress?text=${encodeURIComponent(textInput.value)}`
    );

    source.onmessage = async (event) => {
      if (event.data === "done") {
        source.close();

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
        const audioURL = URL.createObjectURL(blob);

        player.src = audioURL;

        await player.play().catch(() => {
          alert("Tap play manually");
        });

        progressBar.style.width = "100%";
        progressText.innerText = "Done ✅";
        return;
      }

      const percent = event.data;
      progressBar.style.width = percent + "%";
      progressText.innerText = percent + "%";
    };

    source.onerror = () => {
      source.close();
      alert("Progress error ❌");
    };

  } catch (err) {
    console.error(err);
    alert("Audio failed ❌");
  }
}

// 📥 DOWNLOAD
function download() {
  if (!player.src) return alert("Generate audio first!");

  const a = document.createElement("a");
  a.href = player.src;
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

// 📄 FILE UPLOAD
async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;

  document.getElementById("fileType").innerText = "File: " + file.name;

  const formData = new FormData();
  formData.append("file", file);

  loader.style.display = "block";

  try {
    const res = await fetch("https://voxify-ai.onrender.com/upload-file", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.text) throw new Error("No text");

    const cleanedText = data.text
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    textInput.value = cleanedText;

    generate();

  } catch (err) {
    console.error(err);
    alert("Upload failed ❌");
  }

  loader.style.display = "none";
}

// 🎬 VIDEO GENERATOR (BASIC)
function createVideo() {
  if (!player.src) return alert("Generate audio first!");

  const canvas = document.getElementById("videoCanvas");
  const ctx = canvas.getContext("2d");

  const audio = new Audio(player.src);
  audio.play();

  function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "40px Poppins";
    ctx.textAlign = "center";

    wrapText(
      ctx,
      textInput.value.substring(0, 200),
      canvas.width / 2,
      400,
      600,
      50
    );

    requestAnimationFrame(draw);
  }

  draw();

  alert("Video preview running 🎬");
}

// 🧠 MULTI LINE TEXT
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, y);
}

// 🔥 INIT
speechSynthesis.onvoiceschanged = loadVoices;
initVoices();
