import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import {
  Sparkles,
  MessageCircle,
  Search,
  Mail,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Clock,
  Send,
  Sliders,
  Award,
  Zap,
  Tag,
  Building,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const LinkedinIcon = ({ className = "w-5 h-5 text-blue-600" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const InstagramIcon = ({ className = "w-5 h-5 text-pink-600" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

interface MarketingAdminProps {
  token: string | null;
}

type ChannelType = 'whatsapp' | 'linkedin' | 'instagram' | 'google_ads' | 'email';

interface CampaignHistoryItem {
  id: string;
  channel: ChannelType;
  topic: string;
  audience: string;
  result: string;
  timestamp: number;
}

const CAMPAIGN_PRESETS = [
  {
    channel: 'whatsapp' as ChannelType,
    title: 'Diwali & Festival Corporate Gifting',
    topic: 'Diwali & Festival Corporate Gifting Hampers with Custom Logo',
    audience: 'Bangalore Corporate HRs, Admin Managers & Business Owners',
    tone: 'Festive & Premium',
    offer: 'Early bird 15% discount for bulk orders before Oct 15',
    keyPoints: 'Custom branded gift boxes, ceramic mugs, premium diaries, metal pens, 1-2 day Whitefield delivery'
  },
  {
    channel: 'linkedin' as ChannelType,
    title: 'New Hire Onboarding Swag Kits',
    topic: 'Why Top Bangalore Startups Invest in Premium Day-1 Welcome Kits',
    audience: 'HR Leaders, People Operations, Founders at ITPL & ORR tech parks',
    tone: 'Thought-leadership & Inspiring',
    offer: 'Free physical sample welcome kit delivered to your office',
    keyPoints: 'Bespoke apparel, custom tech accessories, branded notebook, zero outsourcing, Borewell Road facility'
  },
  {
    channel: 'whatsapp' as ChannelType,
    title: 'Urgent 24-48hr Event T-Shirt Printing',
    topic: 'Express DTF & Screen Printing for Corporate Events and Sports Meets',
    audience: 'Event Organizers, College Clubs, Startup Team Leads',
    tone: 'High-energy & Urgent',
    offer: 'No extra rush fee on orders placed before 2 PM',
    keyPoints: 'In-house production unit on Borewell Road, 220+ GSM cotton, vibrant wash-proof DTF prints'
  },
  {
    channel: 'google_ads' as ChannelType,
    title: 'Google Search Ads - Printing Shop Near Me',
    topic: 'Custom Printing & Corporate Gifting in Whitefield Bangalore',
    audience: 'Users searching for printing shop, bulk t-shirts, custom trophies near Whitefield / ITPL',
    tone: 'Clear, Trustworthy & High-CTR',
    offer: 'Direct factory pricing with GST invoices',
    keyPoints: 'Same-day digital mockup, 1-2 day Whitefield delivery, 22+ years experience'
  },
  {
    channel: 'email' as ChannelType,
    title: 'B2B Corporate Account Pitch',
    topic: 'Direct-from-Manufacturer Corporate Printing & Merchandise Partnership',
    audience: 'Procurement Directors, Facility Managers, Head of Admin',
    tone: 'Professional & Business-Focused',
    offer: 'Complimentary sample box and formal credit billing terms',
    keyPoints: 'Dedicated account manager, own Bangalore production plant, seamless reorders'
  }
];

export const MarketingAdmin: React.FC<MarketingAdminProps> = ({ token }) => {
  const [channel, setChannel] = useState<ChannelType>('whatsapp');
  const [topic, setTopic] = useState('New Employee Welcome Kits with Custom Logo');
  const [audience, setAudience] = useState('Bangalore Tech Companies & HR Managers in Whitefield, ITPL & Bellandur');
  const [tone, setTone] = useState('Professional yet Warm');
  const [offer, setOffer] = useState('10% off on first corporate order of 30+ sets');
  const [keyPoints, setKeyPoints] = useState('Direct production on Borewell Road, GST invoice, free 3D digital mockup');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<CampaignHistoryItem[]>([]);

  // Load campaign history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('printfield_marketing_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load marketing history:', e);
    }
  }, []);

  const saveToHistory = (item: CampaignHistoryItem) => {
    try {
      const updated = [item, ...history.slice(0, 19)];
      setHistory(updated);
      localStorage.setItem('printfield_marketing_history', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save marketing history:', e);
    }
  };

  const handleApplyPreset = (p: typeof CAMPAIGN_PRESETS[0]) => {
    setChannel(p.channel);
    setTopic(p.topic);
    setAudience(p.audience);
    setTone(p.tone);
    setOffer(p.offer);
    setKeyPoints(p.keyPoints);
  };

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    setGeneratedCopy('');
    setCopied(false);

    try {
      const adminToken = token || localStorage.getItem('admin_token');
      const response = await apiFetch('/api/admin/ai/generate-marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          channel,
          topic,
          audience,
          tone,
          offer,
          keyPoints
        })
      });

      const data = await response.json();
      if (data && data.result) {
        setGeneratedCopy(data.result);
        saveToHistory({
          id: `camp_${Date.now()}`,
          channel,
          topic,
          audience,
          result: data.result,
          timestamp: Date.now()
        });
      } else {
        throw new Error(data.error || 'Failed to generate campaign copy');
      }
    } catch (err: any) {
      alert(`Error generating copy: ${err.message || 'Please check your connection and try again.'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCopy) return;
    navigator.clipboard.writeText(generatedCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const channelIcons: Record<ChannelType, React.ReactNode> = {
    whatsapp: <MessageCircle className="w-5 h-5 text-emerald-600" />,
    linkedin: <LinkedinIcon className="w-5 h-5 text-blue-600" />,
    instagram: <InstagramIcon className="w-5 h-5 text-pink-600" />,
    google_ads: <Search className="w-5 h-5 text-amber-600" />,
    email: <Mail className="w-5 h-5 text-indigo-600" />
  };

  const channelLabels: Record<ChannelType, string> = {
    whatsapp: 'WhatsApp Broadcast',
    linkedin: 'B2B LinkedIn Post',
    instagram: 'Instagram Caption & Reels',
    google_ads: 'Google Search Ads Copy',
    email: 'Corporate B2B Email'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-purple-200 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            AI Marketing Studio &bull; Gemini 2.0
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Generate High-Converting Marketing in Seconds
          </h2>
          <p className="text-purple-100 text-sm leading-relaxed">
            Craft targeted WhatsApp blasts, LinkedIn thought leadership, Google Ads headlines, and B2B sales pitches tailored for Bangalore tech companies and local clients.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center">
            <div className="text-xl font-bold text-white">1-Click</div>
            <div className="text-[11px] text-purple-200">WhatsApp Sharing</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-center">
            <div className="text-xl font-bold text-white">Local SEO</div>
            <div className="text-[11px] text-purple-200">Bangalore Targeted</div>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
          <Zap className="w-4 h-4 text-purple-600" />
          Quick One-Click Campaign Presets
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CAMPAIGN_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3.5 bg-white hover:bg-purple-50/50 border border-gray-200 hover:border-purple-300 rounded-2xl shadow-xs transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {channelIcons[preset.channel]}
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                    {preset.channel}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-gray-500 line-clamp-1">
                  {preset.offer}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-transform group-hover:translate-x-0.5 shrink-0 mt-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Generator Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
          <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            Campaign Configuration
          </h3>

          {/* Channel Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Select Marketing Channel
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(channelLabels) as ChannelType[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setChannel(c)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    channel === c
                      ? 'border-purple-600 bg-purple-50/80 text-purple-900 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {channelIcons[c]}
                  <span className="truncate">{channelLabels[c]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topic & Product */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Campaign Goal / Product Focus *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Employee Welcome Kits, Diwali Hampers, Bulk T-Shirts"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. HR Directors, Startups in Whitefield, School Admins"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* Tone & Offer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tone of Voice
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all font-medium"
              >
                <option value="Professional & Business-Focused">Professional B2B</option>
                <option value="Urgent & Promotional (Limited Time)">Urgent Promotion</option>
                <option value="Friendly, Warm & Natural">Friendly & Personal</option>
                <option value="Luxury & Executive">Luxury & Executive</option>
                <option value="Thought-Leadership & Insightful">Thought Leadership</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Special Offer / Incentive
              </label>
              <input
                type="text"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="e.g. 15% off on 50+ sets, Free sample box"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Key Selling Points */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Key Selling Points to Emphasize
            </label>
            <textarea
              rows={2}
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              placeholder="e.g. In-house Borewell Road production, 1-2 day delivery, GST credit"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all font-medium resize-none"
            />
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Crafting with Gemini AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Generate {channelLabels[channel]}
              </>
            )}
          </button>
        </div>

        {/* Right Preview: Generated Copy */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col min-h-[480px]">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-50">
                {channelIcons[channel]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Generated Copy Preview
                </h3>
                <p className="text-[11px] text-gray-500">
                  Ready to copy, broadcast, or publish
                </p>
              </div>
            </div>

            {generatedCopy && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-purple-300 bg-white text-xs font-semibold text-gray-700 hover:text-purple-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Copy
                    </>
                  )}
                </button>

                {channel === 'whatsapp' && (
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(generatedCopy)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Share on WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Copy Body */}
          <div className="flex-1 py-4">
            {isGenerating ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center border border-purple-100 animate-pulse">
                  <Sparkles className="w-6 h-6 text-purple-600 animate-spin" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Analyzing Bangalore Printing Market...</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    Gemini AI is structuring high-converting copywriting with local hooks, GST details, and compelling CTAs.
                  </p>
                </div>
              </div>
            ) : generatedCopy ? (
              <div className="bg-gray-50/80 rounded-2xl p-4 sm:p-5 border border-gray-100 text-xs sm:text-sm text-gray-800 font-mono whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[500px] scrollbar-thin">
                {generatedCopy}
              </div>
            ) : (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-3 p-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-700 text-sm">No copy generated yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                    Select a channel on the left, adjust your topic and key points, then click "Generate" to create instant marketing copy.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick tips footer */}
          <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
            <span>Powered by Gemini 2.0 &bull; Groq Llama 3.3 Fallback</span>
            <span>Targeting Bangalore Tech Corridors</span>
          </div>
        </div>
      </div>

      {/* Campaign History */}
      {history.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Recent AI Generated Campaigns ({history.length})
            </h3>
            <button
              onClick={() => {
                if (confirm('Clear marketing campaign history?')) {
                  setHistory([]);
                  localStorage.removeItem('printfield_marketing_history');
                }
              }}
              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200 hover:border-purple-300 transition-all space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 uppercase">
                      {channelIcons[item.channel]}
                      {item.channel}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-gray-900 truncate">
                    {item.topic}
                  </h5>
                  <p className="text-[11px] text-gray-600 line-clamp-3 mt-1 font-mono">
                    {item.result}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-gray-200/60">
                  <button
                    onClick={() => {
                      setChannel(item.channel);
                      setTopic(item.topic);
                      setAudience(item.audience);
                      setGeneratedCopy(item.result);
                    }}
                    className="text-[11px] font-bold text-purple-700 hover:underline"
                  >
                    Load into Studio
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.result);
                      alert('Copied to clipboard!');
                    }}
                    className="p-1 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
