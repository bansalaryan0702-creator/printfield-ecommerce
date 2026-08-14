import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  MessageSquare, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  User, 
  Clock, 
  Calendar,
  AlertCircle,
  ArrowRight,
  Bot,
  UserCheck,
  RefreshCw,
  Mail,
  Phone,
  CornerDownRight,
  MessageCircle
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model' | 'staff';
  text: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  sessionId: string;
  userId: string | null;
  messages: ChatMessage[];
  updatedAt: number;
  userName: string;
  userEmail: string | null;
  userPhone: string | null;
  platform?: string;
}

interface ChatsAdminProps {
  token: string | null;
}

export const ChatsAdmin: React.FC<ChatsAdminProps> = ({ token }) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summarizingIds, setSummarizingIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/admin/chats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to load chat records');
      }
      const data = await res.json();
      setChats(data.chats || []);
      
      // Auto-select first chat if none is selected
      if (data.chats && data.chats.length > 0 && !selectedChat) {
        setSelectedChat(data.chats[0]);
      } else if (selectedChat) {
        // Keep selected chat updated
        const updated = data.chats.find((c: ChatSession) => c.sessionId === selectedChat.sessionId);
        if (updated) setSelectedChat(updated);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch customer conversations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchChats();
      // Enable background polling sync for live messages
      const interval = setInterval(() => {
        apiFetch('/api/admin/chats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => {
          if (res.ok) return res.json();
        }).then(data => {
          if (data && Array.isArray(data.chats)) {
            setChats(data.chats);
            if (selectedChat) {
              const updated = data.chats.find((c: any) => c.sessionId === selectedChat.sessionId);
              if (updated) {
                setSelectedChat(prev => {
                  if (prev && prev.messages.length !== updated.messages.length) {
                    return updated;
                  }
                  return prev;
                });
              }
            }
          }
        }).catch(err => console.error('Silent sync failed:', err));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [token, selectedChat?.sessionId]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedChat || sending) return;
    setSending(true);
    try {
      const res = await apiFetch('/api/admin/chats/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sessionId: selectedChat.sessionId,
          message: replyText
        })
      });
      if (!res.ok) {
        throw new Error('Failed to send text');
      }
      const data = await res.json();
      if (data && Array.isArray(data.messages)) {
        // Update local state immediately
        setSelectedChat(prev => prev ? { ...prev, messages: data.messages } : null);
        setChats(prev => prev.map(c => c.sessionId === selectedChat.sessionId ? { ...c, messages: data.messages, updatedAt: Date.now() } : c));
      }
      setReplyText('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleSummarize = async (sessionId: string) => {
    setSummarizingIds(prev => ({ ...prev, [sessionId]: true }));
    try {
      const res = await apiFetch('/api/admin/chats/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate summary');
      
      setSummaries(prev => ({
        ...prev,
        [sessionId]: data.summary
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to summarize chat session.');
    } finally {
      setSummarizingIds(prev => ({ ...prev, [sessionId]: false }));
    }
  };

  const handleCopySummary = (sessionId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredChats = chats.filter(chat => {
    const term = searchTerm.toLowerCase();
    return (
      chat.userName.toLowerCase().includes(term) ||
      (chat.userEmail && chat.userEmail.toLowerCase().includes(term)) ||
      chat.sessionId.toLowerCase().includes(term) ||
      chat.messages.some(m => m.text.toLowerCase().includes(term))
    );
  });

  const getLatestMessageText = (chat: ChatSession) => {
    if (chat.messages.length === 0) return 'No messages yet';
    const last = chat.messages[chat.messages.length - 1];
    return last.text;
  };

  const renderFormattedSummary = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleaned = line.replace(/^[\s*-]+/, '').trim();
        return (
          <li key={idx} className="ml-4 list-disc text-gray-700 text-xs leading-relaxed mb-1">
            {cleaned}
          </li>
        );
      }
      if (line.match(/^\d+\.\s/)) {
        return (
          <p key={idx} className="text-gray-800 text-xs font-semibold mt-3 mb-1.5 first:mt-1">
            {line}
          </p>
        );
      }
      if (line.trim().endsWith(':') || line.trim().toUpperCase() === line.trim() && line.trim().length > 3) {
        return (
          <h5 key={idx} className="text-xs font-bold text-indigo-900 mt-4 mb-2 uppercase tracking-wider">
            {line}
          </h5>
        );
      }
      if (!line.trim()) return <div key={idx} className="h-2" />;
      return (
        <p key={idx} className="text-gray-600 text-xs leading-relaxed mb-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div id="ai-chats-admin-panel" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[650px] flex flex-col md:flex-row">
      
      {/* LEFT COLUMN: CHATS LIST */}
      <div className="w-full md:w-[380px] border-r border-gray-100 flex flex-col h-[650px] shrink-0 bg-gray-50/50">
        
        {/* Header & Search */}
        <div className="p-4 border-b border-gray-100 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Customer AI Chats
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">
                {chats.length}
              </span>
            </h3>
            <button 
              onClick={fetchChats}
              disabled={loading}
              title="Refresh conversation logs"
              className="p-1.5 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers or messages..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-600 focus:bg-white transition-all text-gray-800 text-left"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {loading && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400 space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
              <p className="text-xs">Loading customer chat rooms...</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-gray-400 space-y-1">
              <AlertCircle className="h-8 w-8 text-gray-300" />
              <p className="text-xs font-medium">No chat conversations found</p>
              <p className="text-[10px] text-gray-400">Try adjusting your search queries.</p>
            </div>
          ) : (
            filteredChats.map(chat => {
              const isSelected = selectedChat?.sessionId === chat.sessionId;
              const lastMsg = chat.messages[chat.messages.length - 1];
              const formattedTime = new Date(chat.updatedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <button
                  key={chat.sessionId}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1.5 ${
                    isSelected 
                      ? 'bg-purple-50 border-l-4 border-purple-600 shadow-sm' 
                      : 'hover:bg-white border-l-4 border-transparent hover:shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-bold text-gray-900 text-xs truncate max-w-[170px] flex items-center gap-1">
                      {chat.platform === 'whatsapp' && <MessageCircle className="w-3 h-3 text-green-500" />}
                      {chat.userName}
                    </span>
                    <span className="text-[9px] text-gray-400 shrink-0 font-medium">
                      {formattedTime}
                    </span>
                  </div>

                  {chat.userEmail && (
                    <span className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 shrink-0" /> {chat.userEmail}
                    </span>
                  )}

                  <p className="text-[11px] text-gray-600 truncate w-full italic">
                    "{getLatestMessageText(chat)}"
                  </p>

                  <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-gray-100/30">
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                      {chat.messages.length} messages
                    </span>
                    {chat.userId ? (
                      <span className="text-[9px] text-green-700 font-bold flex items-center gap-1">
                        <UserCheck className="h-3 w-3" /> Registered
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-400 font-medium">
                        Guest
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAIL CHAT VIEW */}
      <div className="flex-1 flex flex-col h-[650px] bg-white">
        {selectedChat ? (
          <>
            {/* Header / Meta */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    {selectedChat.platform === 'whatsapp' && <MessageCircle className="w-4 h-4 text-green-500" />}
                    {selectedChat.userName}
                  </h4>
                  <span className="text-[10px] text-gray-400 font-mono select-all">
                    ID: {selectedChat.sessionId}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {selectedChat.userEmail && (
                    <a href={`mailto:${selectedChat.userEmail}`} className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-medium">
                      <Mail className="h-3.5 w-3.5" /> {selectedChat.userEmail}
                    </a>
                  )}
                  {selectedChat.userPhone && (
                    <a href={`tel:${selectedChat.userPhone}`} className="text-[11px] text-purple-600 hover:underline flex items-center gap-1 font-medium">
                      <Phone className="h-3.5 w-3.5" /> {selectedChat.userPhone}
                    </a>
                  )}
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Updated {new Date(selectedChat.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Summary / Takeover Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSummarize(selectedChat.sessionId)}
                  disabled={summarizingIds[selectedChat.sessionId]}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {summarizingIds[selectedChat.sessionId] ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Summarizing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                      Summarise with AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Split conversation panel and summary */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Message Transcript list with texting input at bottom */}
              <div className="flex-1 flex flex-col h-full bg-gray-50/10 border-r border-gray-100 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                  {selectedChat.messages.map((msg, index) => {
                    const isSystem = msg.role === 'model' || msg.role === 'staff';
                    return (
                      <div key={index} className={`flex ${isSystem ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[85%] flex gap-2.5 items-start ${isSystem ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border mt-1 shadow-xs ${
                            msg.role === 'model' 
                              ? 'bg-purple-50 border-purple-100 text-purple-700' 
                              : msg.role === 'staff'
                              ? 'bg-amber-50 border-amber-100 text-amber-700'
                              : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                          }`}>
                            {msg.role === 'model' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </div>
                          
                          <div className="space-y-1">
                            <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              msg.role === 'model' 
                                ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' 
                                : msg.role === 'staff'
                                ? 'bg-amber-50 text-gray-800 border border-amber-200 rounded-tl-none font-medium'
                                : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-none font-medium'
                            }`}>
                              {msg.role === 'staff' && (
                                <div className="text-[9px] text-amber-800 font-extrabold mb-1 tracking-wider uppercase">
                                  Support Agent (You)
                                </div>
                              )}
                              {msg.role === 'model' && (
                                <div className="text-[9px] text-purple-800 font-extrabold mb-1 tracking-wider uppercase">
                                  Printfield AI
                                </div>
                              )}
                              {msg.role === 'user' && (
                                <div className="text-[9px] text-indigo-200 font-extrabold mb-1 tracking-wider uppercase">
                                  Customer
                                </div>
                              )}
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                            </div>
                            <span className={`text-[9px] text-gray-400 block px-1 ${isSystem ? 'text-left' : 'text-right'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Text reply form at bottom */}
                <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={selectedChat.platform === 'whatsapp' ? "Reply directly via WhatsApp..." : "Type a message to text back as a human agent..."}
                    disabled={sending}
                    onKeyDown={e => { if (e.key === 'Enter') handleSendReply(); }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-purple-600 text-gray-800 text-left"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyText.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {sending ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      'Send Reply'
                    )}
                  </button>
                </div>
              </div>

              {/* Dynamic AI Summary Panel (Slides in/appears when loaded) */}
              { (summaries[selectedChat.sessionId] || summarizingIds[selectedChat.sessionId]) && (
                <div className="w-[300px] lg:w-[360px] border-l border-gray-100 p-4 bg-indigo-50/30 overflow-y-auto shrink-0 flex flex-col space-y-3 shadow-inner scrollbar-thin">
                  <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2.5">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-purple-600 fill-purple-200" />
                      Handover Summary
                    </span>
                    {summaries[selectedChat.sessionId] && (
                      <button
                        onClick={() => handleCopySummary(selectedChat.sessionId, summaries[selectedChat.sessionId])}
                        className="p-1.5 hover:bg-indigo-100/50 text-indigo-700 rounded-lg transition-colors flex items-center gap-1"
                        title="Copy Summary"
                      >
                        {copiedId === selectedChat.sessionId ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[10px] font-bold">{copiedId === selectedChat.sessionId ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>

                  {summarizingIds[selectedChat.sessionId] ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 animate-spin">
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-indigo-900">Analyzing conversation logs...</p>
                        <p className="text-[10px] text-indigo-500 max-w-[200px]">Gemini is parsing intent, material preferences, and drafting next support steps.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-indigo-100/50 shadow-xs">
                      <div className="space-y-1">
                        {renderFormattedSummary(summaries[selectedChat.sessionId])}
                      </div>

                      {/* Manual Action Recommendations */}
                      <div className="mt-4 pt-3.5 border-t border-indigo-100/30 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Support Actions</p>
                        <div className="flex flex-col gap-1.5">
                          {selectedChat.userEmail && (
                            <a 
                              href={`mailto:${selectedChat.userEmail}?subject=Support regarding your Printfield inquiry&body=Hi ${selectedChat.userName},%0D%0A%0D%0AI noticed you were chatting with our assistant regarding products. I wanted to follow up and see if you need any manual quotes or help finalizing your customized layout.%0D%0A%0D%0ABest regards,%0D%0APrintfield Support`}
                              className="w-full py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1"
                            >
                              Follow up via Email <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                          <button
                            onClick={() => alert('Support ticket registered. Representative assigned to customer session ID: ' + selectedChat.sessionId)}
                            className="w-full py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[10px] rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            Assign support agent
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400 space-y-3">
            <MessageSquare className="h-12 w-12 text-gray-200" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-800">No Chat Selected</p>
              <p className="text-xs max-w-sm">Please select a customer chat session from the left-hand log list to view conversations and generate handover briefs.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
