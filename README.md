# 🛠️ Generative UI Builder

A simple experiment where you can **describe a UI in plain English** (e.g. “Login form with Email and Password”) and instantly get a live, editable preview.  
Supports export to HTML and (basic) JSX.

---

## 🚀 Features
- Describe UI in natural language → live preview.
- Editable preview (click + edit text directly).
- Toggle between **Preview / HTML / JSX** modes.
- Export generated UI as a standalone HTML file.
- FastAPI backend for handling prompt → JSON (mocked now, extendable later).
- Frontend built with plain HTML, CSS, and JS (no frameworks required).

---

## 📂 Project Structure
```

generative-ui-builder/
│── backend/
│   └── main.py         # FastAPI backend (mock UI generator)
│
│── frontend/
│   ├── index.html      # Main UI
│   ├── style.css       # Styling
│   └── script.js       # UI logic + backend connection
│
│── README.md

````

---

## 🖥️ Running Locally

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/generative-ui-builder.git
cd generative-ui-builder
````

### 2. Start backend (FastAPI)

```bash
cd backend
pip install fastapi uvicorn
uvicorn main:app --reload
```

Backend will be available at: `http://127.0.0.1:8000`

### 3. Open frontend

Just open `frontend/index.html` in your browser.
Click **Generate** to see UI components created from your description.

---

## ✨ Example Prompts

* `Login form with Email and Password`
* `Todo app with input and list`
* `3 cards in a grid`

---

## 🧭 Roadmap

* [ ] Connect to a free AI API (OpenRouter, HuggingFace, etc.)
* [ ] Smarter parsing of prompts (dynamic fields, layouts, etc.)
* [ ] More components (navbar, footer, dashboard)
* [ ] Save projects + share links
* [ ] Drag-and-drop editor mode

---

## 📜 License

MIT – Free to use, modify, and share.

---

👨‍💻 Built by Ian (and ChatGPT as coding buddy).
