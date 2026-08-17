import { getOptimizedImage } from "@/src/lib/imageUtils";
import { apiFetch } from '../lib/api';
import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/src/components/ui/button';
import { AppContext } from '../context/AppContext';
import { Layout } from '../components/layout/Layout';
import { SEO } from '../components/SEO';
import { CheckCircle2, RotateCcw, CreditCard } from 'lucide-react';
import { getFeaturedImage } from '../lib/imageUtils';
import { getGoogleAccessToken } from '../lib/firebase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", 
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", 
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
];

export function Checkout() {
  const { cart, user, setUser, token, clearCart } = useContext(AppContext);
  const navigate = useNavigate();

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(-1);
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    email: '',
    company: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  useEffect(() => {
    if (!token && !user) {
      navigate('/login?redirect=checkout');
    }
    if (cart.length === 0 && !orderComplete) {
      navigate('/');
    }
    
    let loadedAddresses: any[] = [];
    if (user && user.savedQuotationDetails) {
      try {
        const parsed = typeof user.savedQuotationDetails === 'string' ? JSON.parse(user.savedQuotationDetails) : user.savedQuotationDetails;
        if (Array.isArray(parsed)) {
          loadedAddresses = parsed;
        } else if (parsed && parsed.fullName) {
          loadedAddresses = [parsed];
        }
      } catch (e) {}
    }
    
    if (loadedAddresses.length === 0) {
      try {
        const localArray = localStorage.getItem('saved_addresses_list');
        if (localArray) {
          loadedAddresses = JSON.parse(localArray);
        } else {
          const legacy = localStorage.getItem('saved_quotation_details');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (parsed && parsed.fullName) {
              loadedAddresses = [parsed];
            }
          }
        }
      } catch (e) {}
    }
    
    setSavedAddresses(loadedAddresses);
    
    if (loadedAddresses.length > 0) {
      setAddress(loadedAddresses[0]);
      setSelectedAddressIndex(0);
    } else if (user) {
      setAddress({
        fullName: user.name || user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        company: user.company || user.companyName || ''
      });
      setSelectedAddressIndex(-1);
    }
  }, [token, user, cart, navigate, orderComplete]);

  const handleChange = (e: any) => {
    const updated = { ...address, [e.target.name]: e.target.value };
    setAddress(updated);
    if (selectedAddressIndex !== -1) {
      setSelectedAddressIndex(-1); // Switch to "new/custom" if they edit
    }
  };

  const handleSelectAddress = (idx: number) => {
    setSelectedAddressIndex(idx);
    if (idx >= 0 && savedAddresses[idx]) {
      setAddress(savedAddresses[idx]);
    }
  };

  const handleAddNew = () => {
    setSelectedAddressIndex(-1);
    setAddress({ fullName: '', phone: '', email: '', company: '' });
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // validate
    if (!address.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^\d{10}$/.test(address.phone)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!address.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Save details locally and update context immediately
    let updatedAddresses = [...savedAddresses];
    const existingIndex = updatedAddresses.findIndex(a => 
      a.fullName === address.fullName && 
      a.phone === address.phone && 
      a.email === address.email && 
      a.company === address.company
    );
    
    if (existingIndex === -1) {
      updatedAddresses = [address, ...updatedAddresses]; // Add new address to top
    } else {
      const [existing] = updatedAddresses.splice(existingIndex, 1);
      updatedAddresses = [existing, ...updatedAddresses]; // Bring to top
    }
    
    updatedAddresses = updatedAddresses.slice(0, 5);
    setSavedAddresses(updatedAddresses);

    try {
      localStorage.setItem('saved_addresses_list', JSON.stringify(updatedAddresses));
      localStorage.setItem('saved_quotation_details', JSON.stringify(address)); // legacy support
    } catch (e) {}

    if (setUser) {
      setUser((prev: any) => prev ? ({
        ...prev,
        name: address.fullName || prev.name,
        phone: address.phone || prev.phone,
        email: address.email || prev.email,
        company: address.company || prev.company,
        companyName: address.company || prev.companyName,
        savedQuotationDetails: updatedAddresses
      }) : prev);
    }

    // Persist to user profile backend if logged in
    if (token) {
      try {
        await apiFetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: address.fullName,
            phone: address.phone,
            email: address.email,
            company: address.company,
            companyName: address.company,
            savedQuotationDetails: updatedAddresses
          })
        });
      } catch (err) {}
    }

    setLoading(true);
    try {
      const items = cart.map((i: any) => ({
        productId: i.product.id,
        name: i.product.name,
        image: getFeaturedImage(i.product) || '',
        quantity: i.quantity,
        price: i.product.price,
        customizations: i.customizations
      }));

      // Define the final DB insertion function so we can reuse it
      const finalizeOrder = async (paymentDetails?: { method: string, paymentId: string }) => {
        const googleToken = await getGoogleAccessToken();
        const res = await apiFetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items,
            shippingAddress: address,
            paymentDetails,
            googleToken
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit quotation request');

        clearCart();
        setOrderComplete(true);
      };

      await finalizeOrder({ method: 'RFQ', paymentId: '' });
      setLoading(false);

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const total = cart.reduce((acc: number, item: any) => acc + (item.product.price * item.quantity), 0);

  if (orderComplete) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <CheckCircle2 className="mx-auto h-24 w-24 text-green-500 mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quotation Requested!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your quotation request, {address.fullName}. We have received your customization details and requirements.
          </p>
          <div>
            <Button size="lg" onClick={() => navigate('/')} className="bg-purple-600 hover:bg-purple-700">
              Continue Browsing
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title="Checkout | Printfield"
        description="Securely request a quotation or checkout your custom printing order at Printfield."
        canonicalUrl="/checkout"
        type="website"
      />
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 font-serif">Request Quotation</h1>
        
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Form */}
          <div className="lg:col-span-7">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <h2 className="text-xl font-bold text-gray-900">1. Contact & Company Information</h2>
                  {selectedAddressIndex !== -1 && (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Using Saved Details
                    </span>
                  )}
                </div>
                
                {savedAddresses.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select from saved details</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {savedAddresses.map((addr, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleSelectAddress(idx)}
                          className={`cursor-pointer border p-3 rounded-lg flex flex-col gap-1 transition-all ${
                            selectedAddressIndex === idx ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-900 text-sm truncate">{addr.fullName}</span>
                            {selectedAddressIndex === idx && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                          </div>
                          <span className="text-xs text-gray-500 truncate">{addr.email} • {addr.phone}</span>
                          {addr.company && <span className="text-xs text-gray-500 truncate">{addr.company}</span>}
                        </div>
                      ))}
                      <div 
                        onClick={handleAddNew}
                        className={`cursor-pointer border border-dashed p-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                          selectedAddressIndex === -1 ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-medium">+ Add New Details</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mb-4">
                  {selectedAddressIndex !== -1 
                    ? "You can edit these details below. Any changes will be saved as a new entry." 
                    : "Enter your contact and company details. They will be saved automatically for future requests."}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" name="fullName" value={address.fullName} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none transition-all" placeholder="Enter your first and last name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" name="email" value={address.email} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none transition-all" placeholder="name@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" name="phone" value={address.phone} onChange={handleChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none transition-all" placeholder="10-digit mobile number" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <input type="text" name="company" value={address.company} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 outline-none transition-all" placeholder="Your business or organization name" />
                  </div>
                </div>
              </div>

              {error && <div className="text-red-500 font-medium">{error}</div>}

              <Button type="submit" size="lg" className="w-full text-lg h-14 bg-purple-600 hover:bg-purple-700 shadow-md font-medium" disabled={loading}>
                {loading ? 'Submitting Quotation Request...' : 'Submit Quotation Request'}
              </Button>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="text-sm font-medium">256-Bit SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="text-sm font-medium">100% Safe Checkout</span>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 lg:sticky lg:top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Quotation Summary</h2>
              <div className="space-y-4 mb-6">
                {cart.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-16 h-16 bg-white border rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {getFeaturedImage(item.product) ? (
                        <img referrerPolicy="no-referrer" src={getOptimizedImage(getFeaturedImage(item.product), 150) || ''} alt={item.product.name} className="w-full h-full object-contain" onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }} />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {(() => {
                        const match = item.product.name.match(/^(.*?)(?: \[(.*?)\])?$/);
                        const baseName = match?.[1] || item.product.name;
                        const vars = match?.[2];
                        return (
                          <>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-medium text-sm text-gray-900 line-clamp-2">{baseName}</h4>
                              
                            </div>
                            {vars && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {vars.split(' | ').map((v, i) => (
                                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.customizations && (() => {
                              try {
                                const parsed = JSON.parse(item.customizations);
                                if (Array.isArray(parsed)) {
                                  
                                  const placementLabels: Record<string, string> = {
                                    'front': 'Front',
                                    'back': 'Back',
                                    'left_chest': 'Left Pocket',
                                    'right_chest': 'Right Pocket',
                                    'front-full': 'Full Front'
                                  };
                                  const placements = parsed.filter((c: any) => c.placement && c.placement !== 'Instructions / Queries').map((c: any) => placementLabels[c.placement] || c.placement);
                                  if (placements.length > 0) {
                                    return (
                                      <p className="text-xs text-gray-500 mt-1">
                                        <span className="font-semibold text-gray-600">Placements:</span> {placements.join(', ')}
                                      </p>
                                    );
                                  }
                                }
                              } catch(e) {}
                              return null;
                            })()}
                            <p className="text-xs text-gray-500 mt-1.5">Qty: {item.quantity}</p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Wholesale Pricing</span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Quote on Request</span>
                </div>
                <p className="text-[11px] text-gray-500 italic mt-3 text-center">
                  *Our managers will evaluate your customization files and specifications, add special bulk discounts, and email you a customized invoice quotation directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
