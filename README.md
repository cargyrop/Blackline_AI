# ✦ AI Chat — Local Multi-Provider Chat App

A clean, self-contained chat interface for multiple AI providers and local models.
Runs entirely on your machine. Your API keys never leave your computer (sent only
to the respective provider's API).

---

## 🚀 Quick Start

### Windows
Double-click **START.bat**

### Mac / Linux
Right-click **start.sh** → Open With → Terminal
(Or run: `chmod +x start.sh && ./start.sh` once)

That's it. The app opens in your browser at **http://localhost:3737**

> **Only prerequisite:** Node.js (free, one-time install)
> Download from https://nodejs.org — choose the LTS version
> After installing Node.js, double-click the launcher and it handles everything else.

---

## 🔑 Supported AI Providers

| Provider | Icon | Where to get a key |
|---|---|---|
| Anthropic (Claude) | 🟠 | https://console.anthropic.com |
| OpenAI (GPT-4 etc.) | 🟢 | https://platform.openai.com/api-keys |
| Google Gemini | 🔵 | https://aistudio.google.com/app/apikey |
| Groq (fast inference) | ⚡ | https://console.groq.com |
| OpenRouter (many models) | 🌐 | https://openrouter.ai/keys |

## 🏠 Local Models (no API key needed)

1. Install Ollama: https://ollama.com
2. Open a terminal and run: `ollama pull llama3.2`
3. Click **Refresh** in the app toolbar

Popular local models:
- `ollama pull llama3.2`      — Meta's Llama 3.2 (3B, fast)
- `ollama pull mistral`       — Mistral 7B
- `ollama pull gemma2`        — Google Gemma 2
- `ollama pull phi3`          — Microsoft Phi-3 (small & capable)
- `ollama pull deepseek-r1`   — DeepSeek R1

---

## ⚡ Adding New Features

1. Go to **Update / Add Features** in the sidebar
2. Describe what you want (e.g. "Add a button to copy messages to clipboard")
3. Click **Apply Update**

The app automatically:
- Creates a timestamped backup folder next to the app folder
- Uses Claude (Anthropic key required) to generate the code changes
- Applies them instantly

Reload the page after updating to see changes.

---

## 📁 File Structure

```
ai-chat-app/
├── START.bat          ← Windows launcher (double-click)
├── start.sh           ← Mac/Linux launcher
├── server.js          ← Backend server
├── package.json
├── public/
│   └── index.html     ← Full frontend UI
├── data/
│   └── config.json    ← Your API keys (local only)
└── README.md
```

---

## ℹ️ Notes

- **Port:** 3737 (change in server.js if needed)
- **Keys stored:** `data/config.json` — gitignore this if you use git
- **Conversations:** stored in your browser's localStorage
- **Backups:** created at `../ai-chat-app-backup-[timestamp]/`
