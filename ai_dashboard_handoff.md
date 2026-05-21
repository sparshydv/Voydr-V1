# Voydr AI Assistant: Dashboard Migration Handoff

**ATTENTION FELLOW ANTIGRAVITY AGENT:** 
You have been provided this document by the user. Your task is to implement the AI Digital Health Coach features described below into the user's **Dashboard** project. 

Previously, these features were built into the Chrome Extension's popup (`popup.html`/`popup.js`). The user has decided that the popup is too small, and the AI Coach belongs in the spacious Dashboard instead.

Your objective is to recreate these exact features, logic, and prompts, but adapt the UI to fit perfectly within the Dashboard's architecture.

---

## 1. Features to Implement

### A. API Key Management
- **Previous Implementation**: We created a standard Chrome Extension options page to save the `groqApiKey` into `chrome.storage.local`.
- **Your Task**: Implement a secure way for the user to input their Groq API Key within the Dashboard (e.g., a Settings modal or page) and store it so the Dashboard can access it for API calls.

### B. Data Extraction (45-Day Context)
- **Previous Implementation**: We pulled the `screenTime` object from `chrome.storage.local`, extracted the last 45 days, filtered out 0-second entries, and formatted it into a clean string (e.g., `Date: 2026-05-20 | Activity: youtube.com: 1h 30m, reddit.com: 45m`).
- **Your Task**: The Dashboard will need to access the user's historical screen time data (whether through Chrome storage or a backend database) and format it similarly so it can be fed into the AI's context window.

### C. Daily AI Insights & Smart Blocking (JSON Mode)
- **Previous Implementation**: 
  - We used the **Groq API** calling the `llama-3.3-70b-versatile` model.
  - We enforced JSON output (`response_format: { type: "json_object" }`).
  - The AI returned an optimistic coaching `message` and an array of `suggestedBlocks`.
  - We dynamically generated "🚫 Block [site]" buttons. When clicked, these buttons appended the site to the `blockedSites` array in storage for the current day.
- **Your Task**: Build a prominent section in the Dashboard to display the Daily Insight. If the AI suggests blocks, render interactive buttons that trigger the exact same blocking logic the extension uses.

### D. Conversational Q&A Chat
- **Previous Implementation**: We built a chat interface with User and AI chat bubbles. We maintained a `chatMessages` array during the session to provide conversational history to the Groq API.
- **Your Task**: Take advantage of the Dashboard's screen real estate to build a beautiful, full-sized chat interface where the user can interrogate their historical data. 

---

## 2. The Exact AI Prompts to Reuse

**Prompt 1: Daily Insights & Smart Blocks**
```javascript
const prompt = `You are an extremely encouraging and optimistic digital health assistant. The user's screen time over the last few days is:\n${recentDataSummary || "No activity yet."}\n\nAnalyze this data to spot trends. Provide a JSON response with two fields:\n1. "message": A 2-3 sentence personalized insight. CRUCIAL: ALWAYS maintain a highly positive, empathetic, and motivating tone! Even if they spent way more time on distracting sites today than yesterday, frame it as an opportunity for a fresh start rather than a failure. Make them believe they can do it. Be concise and actionable.\n2. "suggestedBlocks": An array of up to 2 specific website hostnames (e.g. ["youtube.com", "reddit.com"]) that are highly distracting and you gently recommend blocking today. If none are distracting enough, return an empty array.`;
```

**Prompt 2: Conversational Q&A**
```javascript
// Note: Append ${historyPrompt} containing the previous chat messages before the user's question.
const prompt = `You are a helpful digital health coach. The user's screen time over the last 45 days is:\n${recentDataSummary || "No data yet."}${historyPrompt}\n\nThe user asks: "${question}"\n\nAnswer their question directly and concisely using the provided data. Do not use JSON formatting, just return a short plain text answer. Keep your tone encouraging and optimistic.`;
```

---

## 3. Execution Instructions for the New Agent
1. **Analyze the Dashboard Codebase**: Read the new project files to understand how state is managed, how data is fetched, and what UI framework (if any) is being used.
2. **Build the API Logic**: Port the `fetch` calls to `https://api.groq.com/openai/v1/chat/completions`.
3. **Design the UI**: Build a spacious, premium-feeling UI for the insights and the chat interface, far better than what could fit in a 300px Chrome extension popup.
4. **Wire up the Blocks**: Ensure the "Block" buttons correctly communicate with the extension's core blocking logic.
