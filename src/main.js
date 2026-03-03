const el = (id) => document.getElementById(id);

const tokenInput = el("tokenInput");
const promptText = el("promptText");

const btnCreateAll = el("btnCreateAll");

const encodedOut = el("encoded");
const longUrlOut = el("longUrl");
const shortUrlOut = el("shortUrl");
const statusOut = el("status");

const dlText = el("dlText");
const dlLong = el("dlLong");
const dlShort = el("dlShort");
const dlQR = el("dlQR");

const qrCanvas = el("qrCanvas");

let state = {
  rawText: "",
  encoded: "",
  longUrl: "",
  tinyUrl: "",
  qrTarget: ""
};

function setDisabled(button, disabled) {
  button.disabled = disabled;
  button.setAttribute("aria-disabled", String(disabled));
}

function markInvalid(field, invalid) {
  if (invalid) {
    field.setAttribute("aria-invalid", "true");
    return;
  }
  field.removeAttribute("aria-invalid");
}

function setStatus(message, kind = "") {
  statusOut.textContent = message || "";
  statusOut.className = "status" + (kind ? " " + kind : "");
  statusOut.setAttribute("aria-live", kind === "err" ? "assertive" : "polite");
}

function buildLongUrl(text) {
  const encoded = encodeURIComponent(text.trim());
  return {
    encoded,
    longUrl: "https://chatgpt.com/?prompt=" + encoded
  };
}

function updateButtons() {
  const hasText = promptText.value.trim().length > 0;
  const hasToken = tokenInput.value.trim().length > 0;

  setDisabled(btnCreateAll, !(hasText && hasToken));
  setDisabled(dlText, !state.rawText);
  setDisabled(dlLong, !state.longUrl);
  setDisabled(dlShort, !state.tinyUrl);
  setDisabled(dlQR, !state.qrTarget);
}

async function copyToClipboard(text, label = "Text") {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus(label + " wurde in die Zwischenablage kopiert.", "ok");
  } catch (copyErr) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.top = "-1000px";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      setStatus(label + " wurde in die Zwischenablage kopiert.", "ok");
    } catch (execErr) {
      setStatus("Kopieren fehlgeschlagen: " + (execErr.message || copyErr.message), "err");
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

function getTinyUrlSlug(tinyUrl) {
  try {
    const url = new URL(tinyUrl);
    return url.pathname.substring(1) || "qr-code";
  } catch (err) {
    return "qr-code";
  }
}

function safeFileNameBase(text) {
  const cleaned = text
    .trim()
    .slice(0, 60)
    .replace(/\s+/g, " ")
    .replace(/[^\w\- ]/g, "");
  return (cleaned || "prompt").replace(/\s+/g, "_");
}

async function createTinyUrl(longUrl, domain) {
  const token = tokenInput.value.trim();
  if (!token) {
    markInvalid(tokenInput, true);
    tokenInput.focus();
    throw new Error("TinyURL API-Token fehlt. Bitte erst Token eintragen.");
  }

  const response = await fetch("https://api.tinyurl.com/create", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      url: longUrl,
      domain: domain || "tinyurl.com"
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      data?.errors?.[0]?.message ||
      data?.message ||
      "TinyURL API Fehler (HTTP " + response.status + ")";
    throw new Error(message);
  }

  const tiny =
    data?.data?.tiny_url ||
    data?.data?.url ||
    data?.tiny_url ||
    data?.url;

  if (!tiny) {
    throw new Error("TinyURL erstellt, aber keine URL in der API-Antwort gefunden.");
  }
  return tiny;
}

async function renderQr(targetUrl) {
  let attempts = 0;
  while (typeof QRious === "undefined" && attempts < 50) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    attempts += 1;
  }

  if (typeof QRious === "undefined") {
    throw new Error("QR-Bibliothek wurde nicht geladen. Bitte Seite neu laden.");
  }

  const ctx = qrCanvas.getContext("2d");
  ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);

  new QRious({
    element: qrCanvas,
    value: targetUrl,
    size: 512,
    level: "M",
    background: "#ffffff",
    foreground: "#000000"
  });
}

tokenInput.addEventListener("input", () => {
  const token = tokenInput.value.trim();
  markInvalid(tokenInput, false);
  if (token) {
    sessionStorage.setItem("tinyurl_token", token);
  } else {
    sessionStorage.removeItem("tinyurl_token");
  }
  updateButtons();
});

promptText.addEventListener("input", () => {
  markInvalid(promptText, false);
  updateButtons();
});

btnCreateAll.addEventListener("click", async () => {
  try {
    markInvalid(promptText, false);
    markInvalid(tokenInput, false);
    setStatus("Starte Erstellung ...");
    btnCreateAll.setAttribute("aria-busy", "true");
    setDisabled(btnCreateAll, true);

    const text = promptText.value.trim();
    if (!text) {
      markInvalid(promptText, true);
      promptText.focus();
      throw new Error("Bitte zuerst einen Prompt-Text eingeben.");
    }

    setStatus("1/3 Erstelle ChatGPT Long-URL ...");
    const { encoded, longUrl } = buildLongUrl(text);

    state.rawText = text;
    state.encoded = encoded;
    state.longUrl = longUrl;
    state.tinyUrl = "";
    state.qrTarget = "";

    encodedOut.textContent = state.encoded;
    longUrlOut.textContent = state.longUrl;
    shortUrlOut.textContent = "";

    setStatus("2/3 Erstelle TinyURL ...");
    const tiny = await createTinyUrl(state.longUrl, "tinyurl.com");
    state.tinyUrl = tiny;
    shortUrlOut.textContent = state.tinyUrl;

    setStatus("3/3 Erstelle QR-Code ...");
    state.qrTarget = state.tinyUrl || state.longUrl;
    await renderQr(state.qrTarget);

    setStatus("Alles fertig: Long-URL, TinyURL und QR-Code wurden erstellt.", "ok");
  } catch (err) {
    setStatus("Fehler: " + (err.message || "Unbekannter Fehler"), "err");
  } finally {
    btnCreateAll.removeAttribute("aria-busy");
    updateButtons();
  }
});

dlText.addEventListener("click", () => {
  copyToClipboard(state.rawText, "Text");
});

dlLong.addEventListener("click", () => {
  copyToClipboard(state.longUrl, "Long-URL");
});

dlShort.addEventListener("click", () => {
  copyToClipboard(state.tinyUrl, "TinyURL");
});

dlQR.addEventListener("click", () => {
  if (!state.qrTarget) return;
  const png = qrCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = png;
  link.download = state.tinyUrl
    ? getTinyUrlSlug(state.tinyUrl) + "_qr.png"
    : safeFileNameBase(state.rawText) + "_qr.png";
  document.body.appendChild(link);
  link.click();
  link.remove();
});

const savedToken = sessionStorage.getItem("tinyurl_token");
if (savedToken) {
  tokenInput.value = savedToken;
}

updateButtons();
setStatus("Token eingeben, Prompt erfassen und dann auf 'Alles erstellen' klicken.");
