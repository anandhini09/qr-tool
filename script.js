const qrInput = document.getElementById("qrInput");
const qrLabel = document.getElementById("qrLabel");
const qrColor = document.getElementById("qrColor");
const qrOutput = document.getElementById("qrOutput");
const downloadLink = document.getElementById("downloadLink");

const video = document.getElementById("qrVideo");
const resultText = document.getElementById("scanResult");
const savedList = document.getElementById("savedList");
const scanHistoryList = document.getElementById("scanHistoryList");
const searchHistory = document.getElementById("searchHistory");

const themeToggle = document.getElementById("themeToggle");

const switchTab = (tabId) => {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.getElementById(tabId).classList.add("active");
};

themeToggle.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});

// Generate QR Code
function generateQR() {
  const text = qrInput.value.trim();
  const label = qrLabel.value.trim();
  const color = qrColor.value;

  if (!text) {
    alert("Enter a value to generate QR");
    return;
  }

  qrOutput.innerHTML = "";
  QRCode.toCanvas(text, { width: 200, color: { dark: color, light: "#ffffff" } }, (err, canvas) => {
    if (err) return console.error(err);
    qrOutput.appendChild(canvas);
    downloadLink.href = canvas.toDataURL();

    // Save to local storage
    const savedQRCodes = JSON.parse(localStorage.getItem("savedQRCodes") || "[]");
    savedQRCodes.push({ label, text, color, date: new Date().toISOString() });
    localStorage.setItem("savedQRCodes", JSON.stringify(savedQRCodes));
    loadSavedQRCodes();
  });
}

// Load saved QR codes
function loadSavedQRCodes() {
  const savedQRCodes = JSON.parse(localStorage.getItem("savedQRCodes") || "[]");
  savedList.innerHTML = "";
  savedQRCodes.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.label || "(No Label)"}:</strong> ${item.text}<br/>
      <span style="font-size:12px;color:gray;">${new Date(item.date).toLocaleString()}</span>`;
    savedList.appendChild(li);
  });
}

// Start QR Scanner
function startScanner() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Camera not supported");
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      video.srcObject = stream;
      scanLoop();
    })
    .catch((err) => {
      console.error("Camera error:", err);
    });
}

// Scan QR Loop
function scanLoop() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  const scan = () => {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        resultText.textContent = `Scanned: ${code.data}`;
        saveScanHistory(code.data);
      }
    }
    requestAnimationFrame(scan);
  };
  scan();
}

// Save scan history
function saveScanHistory(data) {
  const scanHistory = JSON.parse(localStorage.getItem("scanHistory") || "[]");
  const entry = {
    data,
    date: new Date().toISOString(),
  };
  if (!scanHistory.some((item) => item.data === data)) {
    scanHistory.push(entry);
    localStorage.setItem("scanHistory", JSON.stringify(scanHistory));
    loadScanHistory();
  }
}

// Load scan history
function loadScanHistory() {
  const scanHistory = JSON.parse(localStorage.getItem("scanHistory") || "[]");
  scanHistoryList.innerHTML = "";
  scanHistory.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `${item.data}<br/><span style="font-size:12px;color:gray;">${new Date(item.date).toLocaleString()}</span>`;
    scanHistoryList.appendChild(li);
  });
}

// Search scan history
function filterHistory() {
  const query = searchHistory.value.toLowerCase();
  const scanHistory = JSON.parse(localStorage.getItem("scanHistory") || "[]");
  scanHistoryList.innerHTML = "";
  scanHistory
    .filter((item) => item.data.toLowerCase().includes(query))
    .forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `${item.data}<br/><span style="font-size:12px;color:gray;">${new Date(item.date).toLocaleString()}</span>`;
      scanHistoryList.appendChild(li);
    });
}

// Initial Load
loadSavedQRCodes();
loadScanHistory();
startScanner();
