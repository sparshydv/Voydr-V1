# Voydr: Digital Health Coach & Site Blocker

Voydr is an advanced, privacy-first Chrome Extension designed to help you reclaim your focus and manage your screen time. It goes beyond simple site blocking by offering precise time-budget limits, beautiful visualizations, and a soon-to-be-released AI-powered coaching system.

![Voydr Dashboard Preview](https://via.placeholder.com/1000x500.png?text=Voydr+Dashboard)

## ✨ Features

- ⏱️ **Precision Time Tracking:** Tracks active screen time to the second. Smart OS-level focus detection ensures time only accrues when you are actually looking at the Chrome window.
- 🚫 **Instant Quick Blocks:** Found a distracting site? Block it instantly for the rest of the day. Subdomains are automatically restricted (e.g., blocking `youtube.com` blocks `music.youtube.com`).
- ⏳ **Time Budgets (Limits):** Set daily allowances for distracting websites. Once your time is up, Voydr intervenes.
- 🛡️ **Cinematic Focus Mode:** When a site is blocked, Voydr presents a sleek, distraction-free "Focus Mode" screen designed to help you reset your attention.
- 📊 **Beautiful Dashboard:** A standalone React-powered dashboard offering rich data visualizations, heatmaps, and trend analysis of your browsing habits.
- 🤖 **AI Coaching (Coming Soon):** An integrated digital health coach powered by LLaMA-3 (via Groq) that analyzes your 45-day browsing history to offer personalized, actionable insights.

## 🚀 Installation & Setup

If you want to run Voydr from source or contribute to the project, follow these steps:

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- Google Chrome or a Chromium-based browser (Brave, Edge, etc.)

### 1. Build the Dashboard
The extension relies on a React/Vite dashboard. You must build it before loading the extension into Chrome.

```bash
# Clone the repository
git clone https://github.com/yourusername/Voydr-V1.git
cd Voydr-V1

# Navigate to the dashboard directory
cd dashboard

# Install dependencies and build
npm install
npm run build
```
*The build process outputs the dashboard directly into the `Extension/dashboard` folder, so the Chrome extension can load it locally.*

### 2. Load the Extension into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `Extension` folder from the `Voydr-V1` repository.
5. Pin the Voydr icon to your toolbar and click it to access your new Dashboard!

## 🏗️ Architecture

Voydr is split into two distinct parts:
1. **The Extension Core (`/Extension`):** Contains the manifest, the service worker (`background.js`), and the cinematic block screen (`blocked.html`). Handles all core tracking and enforcement logic using pure Vanilla JS.
2. **The Dashboard (`/dashboard`):** A modern React + Vite application styled with TailwindCSS. It communicates with the extension core exclusively via `chrome.storage.local`.

## 🔒 Privacy First

Voydr runs entirely locally on your machine.
- Your browsing history is never sent to a remote server.
- The upcoming AI features will require an API key, but context generation happens strictly on-device before being sent securely to the LLM.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check [issues page](https://github.com/yourusername/Voydr-V1/issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
