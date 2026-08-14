import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Star, 
  ThumbsUp, 
  CheckCircle2, 
  Search, 
  Filter, 
  MessageSquare, 
  Plus, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  Award, 
  Image as ImageIcon,
  X,
  ChevronDown
} from "lucide-react";
import { SEO } from "../components/SEO";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/ui/button";

interface Review {
  id: string;
  author: string;
  role?: string;
  verified: boolean;
  rating: number;
  date: string;
  category: string;
  productName: string;
  title: string;
  content: string;
  helpfulCount: number;
  userVoted?: boolean;
  image?: string;
  reply?: string;
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev-1",
    author: "Ananya Sharma",
    role: "Marketing Manager, TechPulse",
    verified: true,
    rating: 5,
    date: "August 2, 2026",
    category: "Business Cards",
    productName: "Velvet Soft-Touch Foil Business Cards",
    title: "Unbelievable quality & prompt delivery!",
    content: "Ordered 500 gold foil business cards for our annual corporate summit. The soft-touch velvet feel with gold embossing exceeded our expectations. Everyone at the event asked where we got them printed!",
    helpfulCount: 34,
    reply: "Thank you Ananya! We're thrilled your gold foil cards made a fantastic impression at TechPulse."
  },
  {
    id: "rev-2",
    author: "Rohan Verma",
    role: "Founder, Urban Brew Cafe",
    verified: true,
    rating: 5,
    date: "July 28, 2026",
    category: "Apparel",
    productName: "Premium Heavyweight Custom Hoodies",
    title: "Best staff uniform hoodies we've ever purchased",
    content: "The custom embroidery on our staff hoodies came out crisp and colorful. Fabric is 380 GSM thick cotton, very comfortable and doesn't fade after multiple machine washes.",
    helpfulCount: 22
  },
  {
    id: "rev-3",
    author: "Priya Nair",
    role: "Event Organizer",
    verified: true,
    rating: 5,
    date: "July 20, 2026",
    category: "Signage",
    productName: "Custom Retractable Roll-Up Banners",
    title: "High resolution printing and durable stands",
    content: "We needed 6 standees printed on urgent notice within 24 hours. Printfield delivered them directly to the venue in Bengaluru right on time. Crisp colors and smooth vinyl material.",
    helpfulCount: 18
  },
  {
    id: "rev-4",
    author: "Kavita Reddy",
    role: "HR Lead, Apex Solutions",
    verified: true,
    rating: 5,
    date: "July 18, 2026",
    category: "Corporate Gifts",
    productName: "Luxury Welcome Onboarding Kit",
    title: "Impressive onboarding kits for new hires",
    content: "Includes custom notebook, metal pen, thermal flask, and tech pouch with our laser-engraved logo. New employees are constantly sharing unboxing videos on LinkedIn!",
    helpfulCount: 29
  },
  {
    id: "rev-5",
    author: "Vikram Sengupta",
    role: "Creative Director, Studio V",
    verified: true,
    rating: 4,
    date: "July 15, 2026",
    category: "Drinkware",
    productName: "Custom Matte Ceramic Coffee Mugs",
    title: "Great print clarity on ceramic mugs, slight transit delay",
    content: "The colors matched our brand vector files perfectly. Slight delay of 1 day due to monsoon shipping, but customer support kept us updated throughout.",
    helpfulCount: 11,
    reply: "Hi Vikram! Thanks for the review. Apologies for the weather delay, glad you love the mug print quality!"
  },
  {
    id: "rev-6",
    author: "Deepak Choudhury",
    role: "Store Manager",
    verified: true,
    rating: 4,
    date: "June 29, 2026",
    category: "Packaging",
    productName: "Custom Rigid Box Packaging",
    title: "Sturdy custom packaging, box size was slightly roomy",
    content: "We ordered custom matte black shipping boxes with gloss foil logo. Packaging quality is premium and protects our products. The box dimensions were slightly roomier than expected, so we added bubble wrap.",
    helpfulCount: 15
  },
  {
    id: "rev-7",
    author: "Sameer Joshi",
    role: "Marketing Specialist",
    verified: true,
    rating: 4,
    date: "June 22, 2026",
    category: "Stationery",
    productName: "Glossy Promotional Posters",
    title: "Solid poster paper quality and vibrant colors",
    content: "Posters turned out great for our retail store promotion. The paper stock is thick and glossy. Would order again!",
    helpfulCount: 9
  },
  {
    id: "rev-8",
    author: "Neha Kapoor",
    role: "Brand Strategist",
    verified: true,
    rating: 4,
    date: "June 14, 2026",
    category: "Apparel",
    productName: "Eco-Friendly Canvas Tote Bags",
    title: "Nice fabric feel and durable handles",
    content: "The tote bags look good with our minimalist screen-printed logo. Handles are sturdy and stitched well. Very decent product for event giveaways.",
    helpfulCount: 14
  },
  {
    id: "rev-9",
    author: "Arjun Mehta",
    role: "Operations Lead",
    verified: true,
    rating: 4,
    date: "June 08, 2026",
    category: "Corporate Gifts",
    productName: "Custom Engraved Crystal Trophies",
    title: "Sleek awards with good weight",
    content: "Engraving was sharp and clear on crystal block trophies. Arrived safely packaged in individual velvet presentation boxes.",
    helpfulCount: 8
  },
  {
    id: "rev-10",
    author: "Tarun Gupta",
    role: "Small Business Owner",
    verified: true,
    rating: 3,
    date: "June 01, 2026",
    category: "Stationery",
    productName: "Standard Glossy Flyers",
    title: "Good print quality but delivery took 4 days instead of 2",
    content: "Print clarity was good for the price, but the courier delayed delivery by 2 days which affected our local flyer distribution schedule.",
    helpfulCount: 21,
    reply: "Hi Tarun, we sincerely apologize for the shipping delay on your flyer order. We've issued a 15% discount code to your email for your next order!"
  }
];

export function Rating() {
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const saved = localStorage.getItem("printfield_reviews");
      if (saved) {
        const parsed: Review[] = JSON.parse(saved);
        // Clean out images from default initial review IDs as requested
        return parsed.map(r => {
          if (r.id.startsWith("rev-") && Number(r.id.replace("rev-", "")) <= 10) {
            const { image, ...rest } = r;
            return rest;
          }
          return r;
        });
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REVIEWS;
  });

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterRating, setFilterRating] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recent");

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newAuthor, setNewAuthor] = useState<string>("");
  const [newRole, setNewRole] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Business Cards");
  const [newProductName, setNewProductName] = useState<string>("");
  const [newTitle, setNewTitle] = useState<string>("");
  const [newContent, setNewContent] = useState<string>("");
  const [newImageUrl, setNewImageUrl] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Modal Gallery state
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);

  // File Upload Handler for review modal
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save reviews to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("printfield_reviews", JSON.stringify(reviews));
    } catch (e) {
      console.error(e);
    }
  }, [reviews]);

  // Helpful vote handler
  const handleVoteHelpful = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id === reviewId) {
          const isVoted = r.userVoted;
          return {
            ...r,
            helpfulCount: isVoted ? r.helpfulCount - 1 : r.helpfulCount + 1,
            userVoted: !isVoted
          };
        }
        return r;
      })
    );
  };

  // Submit Review Handler
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newTitle.trim() || !newContent.trim()) return;

    const createdReview: Review = {
      id: `rev-${Date.now()}`,
      author: newAuthor.trim(),
      role: newRole.trim() || "Verified Customer",
      verified: true,
      rating: newRating,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      category: newCategory,
      productName: newProductName.trim() || `${newCategory} Product`,
      title: newTitle.trim(),
      content: newContent.trim(),
      helpfulCount: 0,
      image: newImageUrl.trim() || undefined
    };

    setReviews([createdReview, ...reviews]);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setIsModalOpen(false);
      // Reset form
      setNewAuthor("");
      setNewRole("");
      setNewTitle("");
      setNewContent("");
      setNewImageUrl("");
      setNewRating(5);
    }, 1500);
  };

  // Calculate Ratings Stats
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : "4.3";

  const ratingCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: totalReviews > 0 ? Math.round((reviews.filter(r => r.rating === stars).length / totalReviews) * 100) : 0
  }));

  const categoriesList = ["All", "Business Cards", "Apparel", "Corporate Gifts", "Drinkware", "Signage", "Packaging", "Stationery"];

  // Filtered & Sorted Reviews
  const filteredReviews = reviews.filter(r => {
    const matchesCategory = filterCategory === "All" || r.category === filterCategory;
    const matchesRating = filterRating === 0 || r.rating === filterRating;
    const matchesSearch = searchQuery === "" || 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesRating && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    if (sortBy === "helpful") return b.helpfulCount - a.helpfulCount;
    return 0; // Default recent
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <SEO 
        title="Customer Reviews & Star Ratings | Printfield Custom Printing"
        description="Read authentic verified customer reviews and ratings for Printfield custom printing, corporate gifts, business cards, apparel, and signage."
        canonicalUrl="/rating"
      />

      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white py-12 md:py-16 px-4 md:px-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Customer Feedback
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
                  Customer Ratings & Reviews
                </h1>
                <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                  Discover what businesses and individual creators say about our print quality, color accuracy, speed, and support.
                </p>
                <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-slate-700/60 text-xs md:text-sm text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Verified Buyers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Print Quality Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Fast Turnaround</span>
                  </div>
                </div>
              </div>

              {/* Rating Card Box */}
              <div className="w-full md:w-auto bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-2xl shrink-0 min-w-[280px]">
                <span className="text-5xl md:text-6xl font-black text-white tracking-tight">{averageRating}</span>
                <div className="flex items-center gap-1 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs md:text-sm text-slate-300 font-medium">
                  Based on <strong className="text-white font-bold">{totalReviews + 2840}</strong> verified reviews
                </p>
                <Button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-5 w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl py-2.5 shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Write a Review
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Sidebar: Breakdown & Filters */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Rating Distribution Breakdown */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center justify-between">
                  <span>Rating Breakdown</span>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">Overall {averageRating}★</span>
                </h3>
                <div className="space-y-3">
                  {ratingCounts.map(({ stars, count, percentage }) => (
                    <button
                      key={stars}
                      onClick={() => setFilterRating(filterRating === stars ? 0 : stars)}
                      className={`w-full flex items-center text-xs text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg transition-colors group ${
                        filterRating === stars ? "bg-purple-50 ring-1 ring-purple-300" : ""
                      }`}
                    >
                      <span className="w-12 text-left font-medium text-slate-700 flex items-center gap-1">
                        {stars} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 inline" />
                      </span>
                      <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-400 rounded-full group-hover:bg-amber-500 transition-all" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-slate-500 font-mono">{percentage}%</span>
                    </button>
                  ))}
                </div>
                {filterRating > 0 && (
                  <button 
                    onClick={() => setFilterRating(0)} 
                    className="mt-4 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline inline-block"
                  >
                    Clear Star Filter
                  </button>
                )}
              </div>

              {/* Categories Filter */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-purple-600" />
                  <span>Filter by Category</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        filterCategory === cat 
                          ? "bg-purple-600 text-white shadow-sm shadow-purple-200" 
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Photo Gallery Quick Peek */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-900 text-lg mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                  <span>Customer Photos</span>
                </h3>
                <p className="text-xs text-slate-500 mb-4">Photos uploaded by customers with their reviews.</p>
                {reviews.filter(r => r.image).length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {reviews.filter(r => r.image).map((rev) => (
                      <button 
                        key={rev.id} 
                        onClick={() => setActivePhotoModal(rev.image || null)}
                        className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group hover:opacity-90 transition-opacity"
                      >
                        <img referrerPolicy="no-referrer" src={rev.image} alt={rev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-4 border border-dashed border-slate-300 text-center space-y-2">
                    <p className="text-xs text-slate-600">No photos shared yet. Be the first customer to upload a photo of your printed order!</p>
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-xs font-semibold text-purple-600 hover:text-purple-700 underline"
                    >
                      + Add a Photo in your Review
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Right Main Column: Search, Sort & Reviews List */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Search & Sort Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-auto flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reviews by keyword or product..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs md:text-sm rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                    <option value="helpful">Most Helpful</option>
                  </select>
                </div>
              </div>

              {/* Filter Active Chips Bar */}
              {(filterCategory !== "All" || filterRating > 0 || searchQuery) && (
                <div className="flex items-center flex-wrap gap-2 text-xs text-slate-600 bg-purple-50/80 p-3 rounded-xl border border-purple-100">
                  <span className="font-semibold text-purple-900">Active Filters:</span>
                  {filterCategory !== "All" && (
                    <span className="bg-white text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                      Category: {filterCategory}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterCategory("All")} />
                    </span>
                  )}
                  {filterRating > 0 && (
                    <span className="bg-white text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                      Rating: {filterRating}★
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setFilterRating(0)} />
                    </span>
                  )}
                  {searchQuery && (
                    <span className="bg-white text-purple-700 border border-purple-200 px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium">
                      Search: "{searchQuery}"
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setSearchQuery("")} />
                    </span>
                  )}
                  <button 
                    onClick={() => { setFilterCategory("All"); setFilterRating(0); setSearchQuery(""); }}
                    className="ml-auto text-purple-700 underline font-semibold hover:text-purple-900"
                  >
                    Reset All
                  </button>
                </div>
              )}

              {/* Reviews List */}
              {filteredReviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800">No reviews found</h3>
                  <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                    We couldn't find any reviews matching your selected filters or search terms.
                  </p>
                  <Button 
                    onClick={() => { setFilterCategory("All"); setFilterRating(0); setSearchQuery(""); }}
                    variant="outline" 
                    className="rounded-xl text-xs font-semibold"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div 
                      key={review.id}
                      className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-300 transition-all space-y-4"
                    >
                      {/* Top Header: Author info & Stars */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                            {review.author.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-sm md:text-base">{review.author}</h4>
                              {review.verified && (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  Verified Buyer
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{review.role || "Customer"}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                          <div className="flex items-center gap-0.5 mb-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                className={`w-4 h-4 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} 
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400">{review.date}</span>
                        </div>
                      </div>

                      {/* Purchased Tag */}
                      <div className="inline-block bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg font-medium">
                        Purchased: <strong className="text-slate-900 font-semibold">{review.productName}</strong> ({review.category})
                      </div>

                      {/* Content */}
                      <div>
                        <h5 className="font-bold text-slate-900 text-base mb-1.5">{review.title}</h5>
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{review.content}</p>
                      </div>

                      {/* Optional Image */}
                      {review.image && (
                        <div className="pt-2">
                          <button 
                            onClick={() => setActivePhotoModal(review.image || null)}
                            className="group relative rounded-xl overflow-hidden border border-slate-200 block max-w-xs aspect-video bg-slate-100 hover:opacity-95 transition-opacity"
                          >
                            <img referrerPolicy="no-referrer" src={review.image} alt={review.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="bg-slate-900/80 text-white text-xs px-3 py-1 rounded-full font-medium backdrop-blur">View Photo</span>
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Official Seller Reply if present */}
                      {review.reply && (
                        <div className="bg-purple-50/70 border-l-4 border-purple-500 p-3.5 rounded-r-xl text-xs text-purple-900 space-y-1">
                          <p className="font-bold text-purple-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            Printfield Support Response:
                          </p>
                          <p className="text-purple-800 leading-relaxed">{review.reply}</p>
                        </div>
                      )}

                      {/* Bottom Footer: Helpful Vote */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Was this review helpful?</span>
                        <button
                          onClick={() => handleVoteHelpful(review.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                            review.userVoted 
                              ? "bg-purple-50 border-purple-300 text-purple-700" 
                              : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${review.userVoted ? "fill-purple-600 text-purple-600" : ""}`} />
                          <span>Helpful ({review.helpfulCount})</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
      </main>

      {/* Write a Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8">
              {isSubmitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Thank You!</h3>
                  <p className="text-sm text-slate-600 max-w-xs mx-auto">
                    Your rating and review have been submitted successfully and added to the page!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Write a Customer Review</h3>
                    <p className="text-xs text-slate-500">Share your experience with Printfield products & services.</p>
                  </div>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Overall Rating</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setNewRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform"
                        >
                          <Star 
                            className={`w-7 h-7 ${star <= newRating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} 
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-slate-700">{newRating} / 5 Stars</span>
                    </div>
                  </div>

                  {/* Name & Role */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="e.g. Rahul Verma"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Role</label>
                      <input
                        type="text"
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value)}
                        placeholder="e.g. Business Owner"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Category & Product Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Product Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none cursor-pointer"
                      >
                        {categoriesList.filter(c => c !== "All").map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        placeholder="e.g. Matte Business Cards"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Review Headline */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Review Title / Headline *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Fantastic print resolution and fast shipping!"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                    />
                  </div>

                  {/* Detailed Comments */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Feedback *</label>
                    <textarea
                      required
                      rows={3}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Tell us what you liked about the print quality, paper feel, color accuracy, or customer service..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none resize-none"
                    />
                  </div>

                  {/* Photo Upload or URL (Optional) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Add Product Photo (Optional)</label>
                    {newImageUrl ? (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 p-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img referrerPolicy="no-referrer" src={newImageUrl} alt="Review Attachment" className="w-12 h-12 rounded-lg object-cover border border-slate-300 shrink-0" />
                          <span className="text-xs text-slate-600 font-medium truncate">Photo attached</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewImageUrl("")}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-lg transition-colors shrink-0"
                          title="Remove photo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="flex items-center justify-center gap-2 w-full p-2.5 border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-purple-50/30 transition-colors">
                          <Upload className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-xs text-purple-700">Upload photo from device</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageFileUpload} 
                            className="hidden" 
                          />
                        </label>
                        <div className="flex items-center gap-2 my-1">
                          <div className="h-px bg-slate-200 flex-1" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Or enter image URL</span>
                          <div className="h-px bg-slate-200 flex-1" />
                        </div>
                        <input
                          type="url"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl shadow-md text-xs md:text-sm mt-2"
                  >
                    Submit Review
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {activePhotoModal && (
        <div 
          onClick={() => setActivePhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative max-w-3xl w-full max-h-[85vh] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center">
            <button 
              onClick={() => setActivePhotoModal(null)}
              className="absolute right-4 top-4 text-white bg-slate-800/80 p-2 rounded-full hover:bg-slate-700 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img referrerPolicy="no-referrer" src={activePhotoModal} alt="Customer Review Photo" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
