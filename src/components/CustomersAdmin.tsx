import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Users, 
  Building2, 
  FileSpreadsheet, 
  Search, 
  Mail, 
  Phone, 
  ShoppingBag, 
  UserCheck, 
  RefreshCw,
  Eye,
  X,
  CheckCircle2,
  Copy,
  ExternalLink,
  Paperclip,
  Send,
  CheckSquare,
  Square,
  AlertCircle,
  Trash2,
  MailCheck,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  role: string;
  createdAt: number | string;
  totalOrders: number;
  totalSpent: number;
  lastActivity: number;
  isRegistered: boolean;
}

interface CustomersAdminProps {
  token: string | null;
}

export function CustomersAdmin({ token }: CustomersAdminProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'corporate' | 'registered' | 'guests'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bulk Email & Selection State
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailTemplate, setEmailTemplate] = useState('custom');
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
  } | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    summary: string;
    successful: string[];
    failed: { email: string; error: string }[];
  } | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    setError('');
    try {
      const authToken = token || localStorage.getItem('admin_token');
      const res = await apiFetch('/api/admin/customers', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (!res.ok) {
        throw new Error('Failed to fetch customers list');
      }
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load customer records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [token]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    const authToken = token || localStorage.getItem('admin_token');
    try {
      const res = await apiFetch('/api/admin/customers/export-excel', {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Customer_Details_${new Date().toISOString().slice(0,10)}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setIsExporting(false);
        return;
      }
    } catch (e) {
      console.warn('Backend export fallback to client-side XLSX generation', e);
    }

    try {
      const exportData = filteredCustomers.map(c => ({
        "Customer ID": c.id,
        "Full Name": c.name || 'N/A',
        "Email Address": c.email || 'N/A',
        "Phone Number": c.phone || 'N/A',
        "Company Name": c.company || 'Individual',
        "Account Type": c.isRegistered ? 'Registered Member' : 'Guest / RFQ',
        "Role": c.role || 'user',
        "Saved / Shipping Address": c.address || 'N/A',
        "Total Quotations / Orders": c.totalOrders || 0,
        "Total Value (₹)": c.totalSpent || 0,
        "Registration / First Contact": c.createdAt ? new Date(c.createdAt).toLocaleString() : 'N/A',
        "Last Activity Date": c.lastActivity ? new Date(c.lastActivity).toLocaleString() : 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      
      const colWidths = [
        { wch: 15 },
        { wch: 22 },
        { wch: 28 },
        { wch: 16 },
        { wch: 22 },
        { wch: 18 },
        { wch: 10 },
        { wch: 35 },
        { wch: 22 },
        { wch: 16 },
        { wch: 22 },
        { wch: 22 }
      ];
      worksheet['!cols'] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Database");

      XLSX.writeFile(workbook, `Customer_Database_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Failed to download Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      (c.name && String(c.name || '').toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.company && c.company.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (typeFilter === 'corporate') return !!c.company && c.company.trim().length > 0;
    if (typeFilter === 'registered') return c.isRegistered;
    if (typeFilter === 'guests') return !c.isRegistered;

    return true;
  });

  // Valid emails from filtered
  const filteredValidEmails = filteredCustomers
    .map(c => c.email?.trim().toLowerCase())
    .filter((e): e is string => !!e && e.includes('@'));

  // Valid emails from total customers
  const allValidEmails = Array.from(new Set(
    customers
      .map(c => c.email?.trim().toLowerCase())
      .filter((e): e is string => !!e && e.includes('@'))
  ));

  const totalCustomersCount = customers.length;
  const corporateCount = customers.filter(c => c.company && c.company.trim().length > 0).length;
  const registeredCount = customers.filter(c => c.isRegistered).length;
  const totalQuotationsCount = customers.reduce((acc, c) => acc + (c.totalOrders || 0), 0);

  // Selection Logic
  const isAllFilteredSelected = filteredValidEmails.length > 0 && filteredValidEmails.every(e => selectedEmails.includes(e));

  const toggleSelectEmail = (email: string) => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) return;
    setSelectedEmails(prev => 
      prev.includes(clean) ? prev.filter(e => e !== clean) : [...prev, clean]
    );
  };

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedEmails(prev => prev.filter(e => !filteredValidEmails.includes(e)));
    } else {
      setSelectedEmails(prev => Array.from(new Set([...prev, ...filteredValidEmails])));
    }
  };

  const selectAllDatabaseCustomers = () => {
    setSelectedEmails(allValidEmails);
  };

  const clearSelection = () => {
    setSelectedEmails([]);
  };

  // Template pre-filler
  const handleTemplateChange = (tmplKey: string) => {
    setEmailTemplate(tmplKey);
    if (tmplKey === 'quotation_update') {
      setEmailSubject('Updated Wholesale Quotation & Catalog');
      setEmailBody(`Dear Customer,\n\nThank you for choosing us for your printing and custom product needs!\n\nWe have updated our latest product catalog and price list. Please find the attached document for full specifications, wholesale rates, and ordering guidelines.\n\nIf you have any questions or require custom volume pricing, simply reply to this email.\n\nWarm regards,\nCustomer Support Team`);
    } else if (tmplKey === 'promo_offer') {
      setEmailSubject('Special Wholesale Discount & Custom Printing Offers!');
      setEmailBody(`Hello,\n\nWe are excited to share exclusive seasonal discounts on custom printing and bulk corporate orders!\n\nPlease review the attached brochure for product details and special offer pricing.\n\nLet us know if you would like to request a custom sample or quote.\n\nBest regards,\nSales & Corporate Relations`);
    } else if (tmplKey === 'catalog_share') {
      setEmailSubject('Our Latest Product Catalog & Custom Printing Guide');
      setEmailBody(`Dear Customer,\n\nPlease find attached our complete product catalog along with custom print specifications.\n\nFeel free to reach out if you need assistance with artwork proofs, custom branding, or volume orders.\n\nSincerely,\nSales Team`);
    } else if (tmplKey === 'custom') {
      setEmailSubject('');
      setEmailBody('');
    }
  };

  // Attachment handler
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert('Attachment size limit is 100MB. Please select a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || '';
      setAttachedFile({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        base64: base64Data
      });
    };
    reader.readAsDataURL(file);
  };

  // Send Bulk Email handler
  const handleSendBulkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEmails.length === 0) {
      alert('Please select at least one customer recipient.');
      return;
    }
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert('Please provide both an email subject and body message.');
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const authToken = token || localStorage.getItem('admin_token');
      const payload = {
        recipients: selectedEmails,
        subject: emailSubject.trim(),
        text: emailBody.trim(),
        attachment: attachedFile ? {
          filename: attachedFile.name,
          content: attachedFile.base64,
          contentType: attachedFile.type
        } : undefined
      };

      const res = await apiFetch('/api/admin/customers/send-bulk-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch bulk email');
      }

      setSendResult({
        summary: data.summary || `Bulk email broadcast complete.`,
        successful: data.results?.successful || [],
        failed: data.results?.failed || []
      });
    } catch (err: any) {
      alert('Error sending bulk email: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg border border-purple-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
              <Users className="w-3.5 h-3.5 text-purple-300" /> Complete Customer Database
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Customer Directory & Communication</h1>
            <p className="text-purple-200/80 text-sm mt-1 max-w-2xl">
              All customer contact details are stored in the database. Select customers to send bulk broadcast emails with file attachments, or download the full list to Excel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchCustomers}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/10"
              title="Refresh Customer Data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                if (selectedEmails.length === 0) selectAllDatabaseCustomers();
                setIsBulkModalOpen(true);
              }}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all"
            >
              <Mail className="w-5 h-5" />
              <span>Send Bulk Email {selectedEmails.length > 0 ? `(${selectedEmails.length})` : ''}</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={isExporting || customers.length === 0}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center gap-2 text-sm transition-all"
            >
              <FileSpreadsheet className="w-5 h-5" />
              <span>{isExporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Stored Customers</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{totalCustomersCount}</p>
            <p className="text-xs text-purple-600 font-medium mt-0.5">{allValidEmails.length} Email addresses ready</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Corporate Accounts</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{corporateCount}</p>
            <p className="text-xs text-indigo-500/80 mt-0.5">Companies & Businesses</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Registered Members</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{registeredCount}</p>
            <p className="text-xs text-emerald-600/80 mt-0.5">With saved profiles</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Quotations / RFQs</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{totalQuotationsCount}</p>
            <p className="text-xs text-amber-600/80 mt-0.5">Requests submitted</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Bulk Email Selection Floating Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl shadow-md border border-indigo-800/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span>{selectedEmails.length} Email Recipients Selected</span>
              {selectedEmails.length > 0 && (
                <span className="px-2 py-0.5 bg-purple-500/30 text-purple-200 text-xs rounded-full border border-purple-400/30 font-mono">
                  {Math.round((selectedEmails.length / (allValidEmails.length || 1)) * 100)}% of Database
                </span>
              )}
            </p>
            <p className="text-xs text-slate-300">
              Check boxes below to pick specific customers, or select all with one click.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleSelectAllFiltered}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            {isAllFilteredSelected ? <CheckSquare className="w-3.5 h-3.5 text-purple-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>Select Filtered ({filteredValidEmails.length})</span>
          </button>

          <button
            onClick={selectAllDatabaseCustomers}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Select Entire DB ({allValidEmails.length})</span>
          </button>

          {selectedEmails.length > 0 && (
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded-lg text-xs font-semibold border border-rose-500/30 transition-colors"
            >
              Clear Selection
            </button>
          )}

          <button
            onClick={() => {
              if (selectedEmails.length === 0) {
                selectAllDatabaseCustomers();
              }
              setIsBulkModalOpen(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ml-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose Email {selectedEmails.length > 0 ? `(${selectedEmails.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customer name, email, phone, or company..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-600 outline-none transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({totalCustomersCount})
          </button>
          <button
            onClick={() => setTypeFilter('corporate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'corporate' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Companies ({corporateCount})
          </button>
          <button
            onClick={() => setTypeFilter('registered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'registered' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Registered ({registeredCount})
          </button>
          <button
            onClick={() => setTypeFilter('guests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              typeFilter === 'guests' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Guests/RFQs ({totalCustomersCount - registeredCount})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-600 border-t-transparent mb-3"></div>
            <p className="text-sm font-medium">Loading customer database...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold text-gray-800">No matching customer records found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                      title="Select / Deselect All Filtered Customers"
                    />
                  </th>
                  <th className="px-6 py-3.5">Customer Name</th>
                  <th className="px-6 py-3.5">Contact Details</th>
                  <th className="px-6 py-3.5">Company / Business</th>
                  <th className="px-6 py-3.5 text-center">Quotations / Orders</th>
                  <th className="px-6 py-3.5 text-center">Account Type</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const initials = (customer.name || 'C')
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  const custEmail = (customer.email || '').trim().toLowerCase();
                  const isSelected = custEmail ? selectedEmails.includes(custEmail) : false;

                  return (
                    <tr key={customer.id} className={`hover:bg-purple-50/30 transition-colors ${isSelected ? 'bg-purple-50/60' : ''}`}>
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        {custEmail ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectEmail(custEmail)}
                            className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                          />
                        ) : (
                          <span className="text-xs text-gray-300">-</span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{customer.name || 'Customer'}</p>
                            <p className="text-xs text-gray-400 font-mono">ID: {customer.id.substring(0, 12)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Details */}
                      <td className="px-6 py-4 space-y-1">
                        <div className="flex items-center gap-2 text-gray-800">
                          <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="font-medium text-xs">{customer.email || 'No email'}</span>
                          {customer.email && (
                            <button
                              onClick={() => handleCopyText(customer.email, `email_${customer.id}`)}
                              className="text-gray-400 hover:text-purple-600 transition-colors"
                              title="Copy Email"
                            >
                              {copiedId === `email_${customer.id}` ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-xs font-mono">{customer.phone}</span>
                            <button
                              onClick={() => handleCopyText(customer.phone, `phone_${customer.id}`)}
                              className="text-gray-400 hover:text-emerald-600 transition-colors"
                              title="Copy Phone"
                            >
                              {copiedId === `phone_${customer.id}` ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Company Name */}
                      <td className="px-6 py-4">
                        {customer.company ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{customer.company}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Individual Client</span>
                        )}
                      </td>

                      {/* Total Orders / Quotations */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          {customer.totalOrders} Requests
                        </span>
                      </td>

                      {/* Account Type */}
                      <td className="px-6 py-4 text-center">
                        {customer.isRegistered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3" /> Registered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Guest / RFQ
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-purple-600 text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 text-white flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Customer Profile</span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedCustomer.name}</h3>
                <p className="text-xs text-purple-200/80 mt-0.5 font-mono">ID: {selectedCustomer.id}</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase">Email Address</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1 break-all">{selectedCustomer.email || 'N/A'}</p>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{selectedCustomer.phone || 'N/A'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase">Company Name</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {selectedCustomer.company ? selectedCustomer.company : 'Individual Client (No company name)'}
                </p>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase">Saved Address / Shipping Location</p>
                <p className="text-sm text-gray-800 mt-1 leading-relaxed">
                  {selectedCustomer.address || 'No saved address recorded.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-600 uppercase">Total Quotation Requests</p>
                  <p className="text-xl font-extrabold text-purple-900 mt-1">{selectedCustomer.totalOrders}</p>
                </div>

                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-600 uppercase">Total Quotation Value</p>
                  <p className="text-xl font-extrabold text-emerald-900 mt-1">₹{(selectedCustomer.totalSpent || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <button
                  onClick={() => {
                    const email = selectedCustomer.email?.trim().toLowerCase();
                    if (email) {
                      setSelectedEmails([email]);
                      setSelectedCustomer(null);
                      setIsBulkModalOpen(true);
                    } else {
                      alert('This customer does not have a valid email address.');
                    }
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-4 h-4" /> Send Email to This Customer
                </button>

                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Email Dispatch Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-900 p-6 text-white flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-300" />
                  <h3 className="text-xl font-bold text-white">Compose Bulk Broadcast Email</h3>
                </div>
                <p className="text-xs text-purple-200 mt-1">
                  Send emails and attached files directly to your stored customer list.
                </p>
              </div>
              <button 
                onClick={() => {
                  if (!isSending) {
                    setIsBulkModalOpen(false);
                    setSendResult(null);
                  }
                }}
                disabled={isSending}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {sendResult ? (
                /* Success/Result View */
                <div className="space-y-5 text-center py-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                    <MailCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Bulk Email Dispatch Completed!</h4>
                    <p className="text-sm text-gray-600 mt-1">{sendResult.summary}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-left border border-gray-200 space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase">Delivery Details</p>
                    <p className="text-sm text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Delivered to {sendResult.successful.length} customers
                    </p>
                    {sendResult.failed.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs font-bold text-rose-600 uppercase">Failed Deliveries ({sendResult.failed.length})</p>
                        <ul className="text-xs text-rose-700 mt-1 space-y-1 max-h-32 overflow-y-auto">
                          {sendResult.failed.map((f, i) => (
                            <li key={i} className="flex justify-between">
                              <span className="font-mono">{f.email}</span>
                              <span className="text-gray-500">{f.error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setSendResult(null);
                        setIsBulkModalOpen(false);
                        clearSelection();
                      }}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                    >
                      Done & Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Email Form View */
                <form onSubmit={handleSendBulkEmail} className="space-y-4">
                  {/* Recipients summary pill */}
                  <div className="p-3.5 bg-purple-50/80 rounded-xl border border-purple-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <p className="text-xs font-bold text-purple-900 uppercase tracking-wider">Recipients List</p>
                      <p className="text-sm font-semibold text-purple-800 mt-0.5">
                        {selectedEmails.length} Customers selected ({selectedEmails.slice(0, 3).join(', ')}{selectedEmails.length > 3 ? ` + ${selectedEmails.length - 3} more` : ''})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={selectAllDatabaseCustomers}
                      className="text-xs font-bold text-purple-700 hover:text-purple-900 underline underline-offset-2"
                    >
                      Select All ({allValidEmails.length})
                    </button>
                  </div>

                  {/* Preset Template Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Choose Quick Email Template (Optional)
                    </label>
                    <select
                      value={emailTemplate}
                      onChange={(e) => handleTemplateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-600 outline-none bg-white font-medium"
                    >
                      <option value="custom">✍️ Custom Message (Blank)</option>
                      <option value="quotation_update">📑 Updated Wholesale Quotation & Catalog</option>
                      <option value="promo_offer">🎁 Special Wholesale Discount & Custom Offers</option>
                      <option value="catalog_share">📘 Product Catalog & Printing Guide</option>
                    </select>
                  </div>

                  {/* Email Subject */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Email Subject Line <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g., Special Wholesale Price List & Custom Printing Catalog"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-600 outline-none"
                    />
                  </div>

                  {/* Email Body */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Email Message Content <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write your email message to customers here..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-600 outline-none resize-y leading-relaxed"
                    ></textarea>
                  </div>

                  {/* File Attachment Upload */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                      Attach File (PDF, Catalog, Price Sheet, Image, Doc)
                    </label>

                    {attachedFile ? (
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                            <Paperclip className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-900 truncate max-w-xs">{attachedFile.name}</p>
                            <p className="text-xs text-emerald-700">
                              {(attachedFile.size / 1024).toFixed(1)} KB • {attachedFile.type || 'Document'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                          title="Remove attached file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-gray-300 hover:border-purple-500 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-gray-50 hover:bg-purple-50/20">
                        <Paperclip className="w-6 h-6 text-gray-400" />
                        <div className="text-center">
                          <p className="text-xs font-bold text-gray-700">Click to attach a file to this email</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Supports PDF, Excel, Word, PNG, JPG (Max 100MB)</p>
                        </div>
                        <input
                          type="file"
                          onChange={handleFileAttachment}
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.doc,.docx,.zip"
                        />
                      </label>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-gray-200 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsBulkModalOpen(false)}
                      disabled={isSending}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSending || selectedEmails.length === 0}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Dispatching Emails...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send to {selectedEmails.length} Customers</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
