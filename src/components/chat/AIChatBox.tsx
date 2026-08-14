import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { apiFetch } from '../../lib/api';
import { 
  MessageSquare, 
  Send, 
  X, 
  Trash2, 
  Sparkles, 
  Bot, 
  ChevronDown, 
  Loader2,
  User,
  MessageCircle
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model' | 'staff';
  text: string;
  timestamp: number;
}

export const AIChatBox: React.FC = () => {
  const { token, user } = useContext(AppContext);
  
  // WhatsApp Contact Config
  const [whatsappNumber, setWhatsappNumber] = useState(import.meta.env.VITE_WHATSAPP_NUMBER || '919606371222');
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hi%2C%20I'm%20interested%20in%20Printfield's%20custom%20branding%20and%20printing%20services.%20Could%20you%20help%20me%3F`;

  // Fetch WhatsApp configuration dynamically on mount to support dynamic changes in setting menu
  useEffect(() => {
    const fetchWhatsappConfig = async () => {
      try {
        const res = (await apiFetch('/api/config/whatsapp')) as { whatsappNumber?: string };
        if (res && res.whatsappNumber) {
          setWhatsappNumber(res.whatsappNumber);
        }
      } catch (err) {
        console.error('Failed to load WhatsApp configuration:', err);
      }
    };
    fetchWhatsappConfig();
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [hasNewMessageBadge, setHasNewMessageBadge] = useState(false);

  // Name collection states
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [nameInputValue, setNameInputValue] = useState('');
  const [hasCheckedName, setHasCheckedName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or load session ID
  useEffect(() => {
    let sid = localStorage.getItem('printfield_chat_session_id');
    if (!sid) {
      sid = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('printfield_chat_session_id', sid);
    }
    setSessionId(sid);
  }, []);

  // Fetch chat history from backend on load
  useEffect(() => {
    if (!sessionId) return;

    const fetchHistory = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await apiFetch(`/api/chat/history?sessionId=${sessionId}`, {
          headers
        });
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        if (data && data.customerName) {
          setCustomerName(data.customerName);
        }
        setHasCheckedName(true);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        setHasCheckedName(true);
      }
    };

    fetchHistory();
  }, [sessionId, token]);

  // Save Name method
  const handleSaveName = async (nameToSave: string) => {
    const trimmed = nameToSave.trim();
    if (!trimmed || !sessionId) return;
    setSavingName(true);
    try {
      const res = await apiFetch('/api/chat/name', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          name: trimmed
        })
      });
      if (res.ok) {
        setCustomerName(trimmed);
      }
    } catch (err) {
      console.error('Failed to save chat name:', err);
    } finally {
      setSavingName(false);
    }
  };

  // Auto-set user's name if logged in and has checked the backend chat name
  useEffect(() => {
    if (user && (user.name || user.displayName || user.email) && sessionId && hasCheckedName && !customerName) {
      const loggedInName = user.name || user.displayName || user.email.split('@')[0];
      handleSaveName(loggedInName);
    }
  }, [user, sessionId, hasCheckedName, customerName]);

  // Periodic poll for messages when open to enable real-time replies from staff!
  useEffect(() => {
    if (!isOpen || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await apiFetch(`/api/chat/history?sessionId=${sessionId}`, {
          headers
        });
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(prev => {
            // Only update if messages length has changed
            if (prev.length !== data.messages.length) {
              return data.messages;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Polling chat history failed:', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, sessionId, token]);

  // Scroll to bottom when messages or open state changes
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [messages, isOpen]);

  // Notify of new replies when chat box is closed
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'model') {
        setHasNewMessageBadge(true);
      }
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    if (!textToSend) {
      setInputValue('');
    }

    // Add user message locally first
    const userMsg: ChatMessage = {
      role: 'user',
      text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: text,
          sessionId
        })
      });

      const data = await response.json();
      if (data && data.reply) {
        // Update with full history returned from backend to maintain absolute parity
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        } else {
          const modelMsg: ChatMessage = {
            role: 'model',
            text: data.reply,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, modelMsg]);
        }
      } else {
        throw new Error(data.error || 'Invalid API response');
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        role: 'model',
        text: `Sorry, I'm having trouble connecting right now. ${err.message || 'Please check your connection and try again.'}`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (window.confirm('Are you sure you want to reset your conversation history?')) {
      try {
        setIsLoading(true);
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        await apiFetch('/api/chat/clear', {
          method: 'POST',
          headers,
          body: JSON.stringify({ sessionId })
        });
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear chat:', err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Helper to format inline markdown text (bold, lists, etc.)
  const renderMessageContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Check for bullet lists
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleanedText = line.replace(/^[\s*-]+/, '').trim();
        return (
          <ul key={lineIdx} className="list-disc pl-4 my-1">
            <li>{parseInlineFormatting(cleanedText)}</li>
          </ul>
        );
      }
      
      // Standard paragraph
      return (
        <p key={lineIdx} className="leading-relaxed mb-1.5 min-h-[1.2rem]">
          {parseInlineFormatting(line)}
        </p>
      );
    });
  };

  // Replace **text** with bold and handle simple inline structures
  const parseInlineFormatting = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const suggestionChips = [
    'Suggest custom business card choices',
    'What premium paper stocks do you offer?',
    'Help me choose corporate gifts',
    'How does custom packaging work?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Floating Chat Box Window */}
      {isOpen && (
        <div 
          id="ai-chat-window"
          className="w-[360px] sm:w-[400px] h-[520px] sm:h-[600px] bg-white rounded-2xl border border-gray-100 shadow-2xl flex flex-col mb-4 overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-indigo-800 rounded-full"></span>
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  Printfield AI
                  <span className="px-1.5 py-0.5 text-[9px] font-bold text-indigo-100 bg-white/10 rounded uppercase tracking-widest">
                    Expert
                  </span>
                </h3>
                <p className="text-[11px] text-indigo-100 font-medium">Always online &bull; Saves automatically</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat with us on WhatsApp"
                className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors flex items-center gap-1.5 shadow-sm text-xs"
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span className="text-[10px] font-extrabold tracking-wider uppercase hidden xs:inline">WhatsApp</span>
              </a>
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear Conversation"
                  className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-100 hover:text-white transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-100 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* WhatsApp Direct Help Banner */}
          {customerName && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-[11px] text-emerald-800 leading-tight">Need immediate human help? WhatsApp us!</span>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-lg text-[9px] tracking-wider uppercase transition-all shadow-sm shrink-0"
              >
                Connect
              </a>
            </div>
          )}

          {/* Messages Container or Name Form */}
          {!customerName && hasCheckedName ? (
            <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gray-50/30 text-center space-y-5">
              <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center border border-purple-200 shadow-md">
                <User className="h-6 w-6 text-purple-700" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">Welcome to Printfield!</h4>
                <p className="text-xs text-gray-500 max-w-[260px] mx-auto leading-relaxed">
                  How should we address you? Enter your name to connect with Printfield AI and our branding experts instantly.
                </p>
              </div>

              <div className="w-full max-w-[280px] space-y-3">
                <input
                  type="text"
                  value={nameInputValue}
                  onChange={(e) => setNameInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nameInputValue.trim()) {
                      handleSaveName(nameInputValue);
                    }
                  }}
                  placeholder="Your Name (e.g., Jane Smith)"
                  disabled={savingName}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-center focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all text-gray-800"
                />
                <button
                  onClick={() => handleSaveName(nameInputValue)}
                  disabled={savingName || !nameInputValue.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingName ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Start Conversation 🌸'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 shadow-sm animate-pulse">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Welcome to Printfield Assistant!</h4>
                      <p className="text-xs text-gray-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
                        I'm your expert guide for custom printed branding, executive stationery, corporate merchandise, and packaging.
                      </p>
                    </div>
                    <div className="w-full pt-4 space-y-2">
                      <p className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 text-left px-1">
                        Suggested Questions:
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {suggestionChips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(chip)}
                            className="text-left w-full text-xs text-purple-700 bg-purple-50/60 hover:bg-purple-50 px-3 py-2 rounded-lg border border-purple-100/50 transition-colors font-medium truncate"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Introduction/Welcome banner at start of history */}
                    <div className="bg-purple-50 border border-purple-100/50 rounded-xl p-3 text-[11px] text-purple-800 leading-relaxed flex gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Welcome Back!</strong> Your chats are saved securely. Ask me anything about custom paper GSM, finishes, order tracking, or corporate branding choices.
                      </div>
                    </div>

                     {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="flex items-start gap-2 max-w-[85%]">
                          {msg.role === 'model' && (
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200 mt-1">
                              <Bot className="h-3.5 w-3.5 text-purple-700" />
                            </div>
                          )}
                          {msg.role === 'staff' && (
                            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200 mt-1">
                              <User className="h-3.5 w-3.5 text-amber-700" />
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              msg.role === 'user'
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-tr-none font-medium'
                                : msg.role === 'staff'
                                ? 'bg-amber-50 text-gray-800 border border-amber-100/60 rounded-tl-none font-normal'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-normal'
                            }`}
                          >
                            {msg.role === 'staff' && (
                              <div className="text-[10px] text-amber-800 font-extrabold mb-1 tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                HUMAN REPRESENTATIVE
                              </div>
                            )}
                            {renderMessageContent(msg.text)}
                            <span 
                              className={`text-[9px] mt-1 block text-right font-medium ${
                                msg.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Bouncing Dot Loading Indicator */}
                {isLoading && (
                  <div className="flex justify-start items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200">
                      <Bot className="h-3.5 w-3.5 text-purple-700 animate-spin" />
                    </div>
                    <div className="bg-white border border-gray-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5 py-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce duration-300 [animation-delay:0ms]"></span>
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce duration-300 [animation-delay:150ms]"></span>
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce duration-300 [animation-delay:300ms]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer Input Form */}
              <div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  disabled={isLoading}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-600 transition-colors disabled:opacity-50 text-gray-800"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating WhatsApp Bubble Button */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        id="whatsapp-bubble-button"
        className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all relative group mb-3 border border-emerald-500/20"
        title="Chat with us on WhatsApp"
      >
        <MessageCircle className="h-5 w-5 text-white" />
        
        {/* Pulsing visual ring for user attention */}
        <span className="absolute -inset-0.5 rounded-full border border-emerald-400/40 animate-ping opacity-30 pointer-events-none"></span>

        {/* Tooltip on Hover */}
        <span className="absolute right-14 scale-0 group-hover:scale-100 bg-emerald-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl transition-all duration-150 origin-right">
          Chat on WhatsApp 💬
        </span>
      </a>

      {/* Floating Chat Bubble Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNewMessageBadge(false);
        }}
        id="ai-chat-bubble-button"
        className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all relative group"
      >
        {isOpen ? (
          <ChevronDown className="h-6 w-6 text-white" />
        ) : (
          <MessageSquare className="h-6 w-6 text-white" />
        )}
        
        {/* Pulsing notification badge */}
        {hasNewMessageBadge && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border border-white"></span>
          </span>
        )}
        
        {/* Tooltip on Hover */}
        {!isOpen && (
          <span className="absolute right-16 scale-0 group-hover:scale-100 bg-gray-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl transition-all duration-150 origin-right">
            Chat with Printfield AI 🌸
          </span>
        )}
      </button>
    </div>
  );
};
