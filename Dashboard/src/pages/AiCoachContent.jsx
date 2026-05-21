import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Key, Send, Sparkles, ShieldBan, Loader2, ArrowRight } from 'lucide-react';
import { useExtensionData } from '../hooks/useExtensionData';
import { storage } from '../utils/storage';
import { getHistoricalDataSummary, getTodayDate } from '../utils/aggregations';
import { cn } from '../utils/cn';

export function AiCoachContent() {
  const data = useExtensionData();
  const [apiKey, setApiKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(true);

  // AI States
  const [fetchingInsight, setFetchingInsight] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    storage.get(['groqApiKey']).then(res => {
      if (res.groqApiKey) {
        setApiKey(res.groqApiKey);
        setIsKeyValid(true);
      }
      setLoading(false);
    });
  }, []);

  // Fetch initial insight if chat is empty
  useEffect(() => {
    if (isKeyValid && chatMessages.length === 0 && !fetchingInsight && !data.loading) {
      fetchDailyInsight();
    }
  }, [isKeyValid, data.loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const saveApiKey = async (e) => {
    e.preventDefault();
    if (!keyInput.trim().startsWith('gsk_')) return;
    await storage.set({ groqApiKey: keyInput.trim() });
    setApiKey(keyInput.trim());
    setIsKeyValid(true);
  };

  const fetchDailyInsight = async () => {
    setFetchingInsight(true);
    try {
      const recentDataSummary = getHistoricalDataSummary(data.screenTime, 45);
      
      const prompt = `You are an extremely encouraging and optimistic digital health assistant. The user's screen time over the last few days is:\n${recentDataSummary || "No activity yet."}\n\nAnalyze this data to spot trends. Provide a JSON response with two fields:\n1. "message": A 2-3 sentence personalized insight. CRUCIAL: ALWAYS maintain a highly positive, empathetic, and motivating tone! Even if they spent way more time on distracting sites today than yesterday, frame it as an opportunity for a fresh start rather than a failure. Make them believe they can do it. Be concise and actionable.\n2. "suggestedBlocks": An array of up to 2 specific website hostnames (e.g. ["youtube.com", "reddit.com"]) that are highly distracting and you gently recommend blocking today. If none are distracting enough, return an empty array.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        })
      });

      const json = await response.json();
      if (json.choices && json.choices[0].message.content) {
        const parsed = JSON.parse(json.choices[0].message.content);
        
        // Add insight as the first chat message
        setChatMessages([{
          role: 'assistant',
          content: parsed.message,
          isInsight: true,
          suggestedBlocks: parsed.suggestedBlocks || []
        }]);
      }
    } catch (err) {
      console.error("Insight fetch failed:", err);
      setChatMessages([{
        role: 'assistant',
        content: "Hi there! I'm your AI Coach. I'm having trouble connecting to my servers right now, but I'll be ready to chat soon!",
        isInsight: true,
        suggestedBlocks: []
      }]);
    }
    setFetchingInsight(false);
  };

  const handleBlockSuggestion = async (site, messageIndex) => {
    const today = getTodayDate();
    const todayBlocks = data.blockedSites?.[today] || [];
    if (!todayBlocks.includes(site)) {
      await storage.set({
        blockedSites: {
          ...(data.blockedSites || {}),
          [today]: [...todayBlocks, site]
        }
      });
    }
    
    // Optimistically remove the blocked site from that specific message's suggestedBlocks
    setChatMessages(prev => {
      const newMsgs = [...prev];
      if (newMsgs[messageIndex] && newMsgs[messageIndex].suggestedBlocks) {
        newMsgs[messageIndex].suggestedBlocks = newMsgs[messageIndex].suggestedBlocks.filter(s => s !== site);
      }
      return newMsgs;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(newMessages);
    setIsChatting(true);

    try {
      const recentDataSummary = getHistoricalDataSummary(data.screenTime, 45);
      const historyPrompt = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n');
      
      const prompt = `You are a helpful digital health coach. The user's screen time over the last 45 days is:\n${recentDataSummary || "No data yet."}\n\nChat History:\n${historyPrompt}\n\nThe user asks: "${userMsg}"\n\nAnswer their question directly and concisely using the provided data. Do not use JSON formatting, just return a short plain text answer. Keep your tone encouraging and optimistic.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }]
        })
      });

      const json = await response.json();
      if (json.choices && json.choices[0].message.content) {
        setChatMessages([...newMessages, { role: 'assistant', content: json.choices[0].message.content }]);
      }
    } catch (err) {
      console.error("Chat failed:", err);
      setChatMessages([...newMessages, { role: 'assistant', content: "Sorry, I had trouble connecting to my servers. Please try again later!" }]);
    }
    setIsChatting(false);
  };

  if (loading) return null;

  if (!isKeyValid) {
    return (
      <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-focus to-focus-dim flex items-center justify-center mb-6 mx-auto shadow-lg glow-focus">
            <Bot size={32} className="text-text-main" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-semibold text-text-main text-center tracking-tight mb-3">AI Health Coach</h1>
          <p className="text-sm text-text-muted text-center mb-8">
            Connect your Groq API key to unlock personalized daily insights, smart blocking recommendations, and interactive screen time analysis.
          </p>

          <form onSubmit={saveApiKey} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Key size={18} className="text-text-muted" />
              </div>
              <input
                type="password"
                placeholder="gsk_..."
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                className="w-full bg-text-main/[0.03] border border-border-subtle rounded-xl pl-11 pr-4 py-3 text-sm text-text-main focus:outline-none focus:border-focus transition-colors placeholder:text-text-muted/50"
              />
            </div>
            <button
              type="submit"
              disabled={!keyInput.startsWith('gsk_')}
              className="w-full bg-focus text-white rounded-xl py-3 text-sm font-medium hover:bg-focus-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Connect AI Coach <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="max-w-[900px] mx-auto w-full px-8 py-7 flex-shrink-0">
        <header className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-focus to-focus-dim flex items-center justify-center glow-focus shrink-0">
            <Sparkles size={20} className="text-text-main" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-text-main tracking-tight">AI Coach</h1>
            <p className="text-sm text-text-muted mt-0.5">Your personal productivity assistant</p>
          </div>
        </header>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col max-w-[900px] mx-auto w-full px-8 pb-7">
        <div className="flex-1 bg-surface border border-border-subtle rounded-t-2xl overflow-y-auto p-6 space-y-6 flex flex-col">
          {fetchingInsight && chatMessages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <Loader2 size={32} className="text-text-muted animate-spin mb-4" />
              <p className="text-[15px] text-text-muted">Analyzing your recent activity...</p>
            </div>
          ) : (
            chatMessages.map((msg, i) => (
              <div key={i} className={cn(
                "flex max-w-[85%]",
                msg.role === 'user' ? "ml-auto" : "mr-auto"
              )}>
                <div className={cn(
                  "px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                  msg.role === 'user' 
                    ? "bg-focus text-white rounded-br-sm" 
                    : "bg-text-main/[0.04] text-text-main border border-border-subtle rounded-bl-sm"
                )}>
                  <p>{msg.content}</p>
                  
                  {/* Smart Block Suggestions (rendered inside insight messages) */}
                  {msg.isInsight && msg.suggestedBlocks?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border-subtle/50">
                      <p className="text-[13px] text-text-muted mb-3 font-medium">Recommended actions:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestedBlocks.map(site => (
                          <button
                            key={site}
                            onClick={() => handleBlockSuggestion(site, i)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-background hover:bg-warning/10 hover:text-warning border border-border-subtle hover:border-warning/30 rounded-lg text-[13px] transition-all group"
                          >
                            <ShieldBan size={14} className="text-text-muted group-hover:text-warning transition-colors" />
                            Block {site}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isChatting && (
            <div className="flex max-w-[85%] mr-auto">
              <div className="px-5 py-3.5 rounded-2xl bg-text-main/[0.04] border border-border-subtle rounded-bl-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <form onSubmit={handleSendMessage} className="bg-surface border border-t-0 border-border-subtle rounded-b-2xl p-3 flex gap-3 shrink-0">
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Ask about your screen time..."
            className="flex-1 bg-transparent border-none focus:outline-none text-[15px] px-3 placeholder:text-text-muted/50 text-text-main"
            disabled={isChatting || fetchingInsight}
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isChatting || fetchingInsight}
            className="w-10 h-10 rounded-xl bg-focus text-white flex items-center justify-center shrink-0 hover:bg-focus-light transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </main>
  );
}
