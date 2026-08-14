const fs = require('fs');

let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const stateOld = `  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_quotation_details');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.fullName || parsed.email || parsed.phone || parsed.company)) {
          return {
            fullName: parsed.fullName || '',
            phone: parsed.phone || '',
            email: parsed.email || '',
            company: parsed.company || ''
          };
        }
      }
    } catch (e) {}
    return {
      fullName: '',
      phone: '',
      email: '',
      company: ''
    };
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
    if (user) {
      let savedDetails: any = {};
      if (user.savedQuotationDetails) {
        try {
          savedDetails = typeof user.savedQuotationDetails === 'string' ? JSON.parse(user.savedQuotationDetails) : user.savedQuotationDetails;
        } catch (e) {}
      }
      setAddress((prev) => ({
        fullName: prev.fullName || savedDetails.fullName || user.name || user.fullName || '',
        phone: prev.phone || savedDetails.phone || user.phone || '',
        email: prev.email || savedDetails.email || user.email || '',
        company: prev.company || savedDetails.company || user.company || user.companyName || ''
      }));
    }
  }, [token, user, cart, navigate, orderComplete]);

  const handleChange = (e: any) => {
    const updated = { ...address, [e.target.name]: e.target.value };
    setAddress(updated);
    try {
      localStorage.setItem('saved_quotation_details', JSON.stringify(updated));
    } catch (err) {}
  };`;

const stateNew = `  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
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
  };`;

const submitOld = `    // Save details locally and update context immediately
    try {
      localStorage.setItem('saved_quotation_details', JSON.stringify(address));
    } catch (e) {}

    if (setUser) {
      setUser((prev: any) => prev ? ({
        ...prev,
        name: address.fullName || prev.name,
        phone: address.phone || prev.phone,
        email: address.email || prev.email,
        company: address.company || prev.company,
        companyName: address.company || prev.companyName,
        savedQuotationDetails: address
      }) : prev);
    }

    // Persist to user profile backend if logged in
    if (token) {
      try {
        await apiFetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`
          },
          body: JSON.stringify({
            name: address.fullName,
            phone: address.phone,
            email: address.email,
            company: address.company,
            companyName: address.company,
            savedQuotationDetails: address
          })
        });
      } catch (err) {}
    }`;

const submitNew = `    // Save details locally and update context immediately
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
            'Authorization': \`Bearer \${token}\`
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
    }`;

const uiOld = `                <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">1. Contact & Company Information</h2>
                  {(address.fullName || address.email || address.phone || address.company) && (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Saved Details Auto-Filled
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-6">
                  Your contact and company details are saved automatically for future quotation requests. You can edit any field below whenever you wish to update them.
                </p>`;

const uiNew = `                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
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
                          className={\`cursor-pointer border p-3 rounded-lg flex flex-col gap-1 transition-all \${
                            selectedAddressIndex === idx ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-gray-200 hover:border-purple-300'
                          }\`}
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
                        className={\`cursor-pointer border border-dashed p-3 rounded-lg flex items-center justify-center gap-2 transition-all \${
                          selectedAddressIndex === -1 ? 'border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600' : 'border-gray-300 text-gray-600 hover:border-purple-400 hover:bg-gray-50'
                        }\`}
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
                </p>`;


content = content.replace(stateOld, stateNew);
content = content.replace(submitOld, submitNew);
content = content.replace(uiOld, uiNew);

fs.writeFileSync('src/pages/Checkout.tsx', content);
console.log('Successfully updated Checkout.tsx');
