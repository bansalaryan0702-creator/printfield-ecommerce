import { getOptimizedImage } from "@/src/lib/imageUtils";
import { apiFetch } from '../lib/api';
import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { MapPin, User, Package, DownloadCloud } from 'lucide-react';

export function OrdersAdmin({ token, userRole = 'admin' }: { token: string, userRole?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [itemPrices, setItemPrices] = useState<{ [key: string]: string }>({});
  const [sendingQuote, setSendingQuote] = useState(false);

  useEffect(() => {
    if (selectedOrder?.items) {
      const prices: { [key: string]: string } = {};
      selectedOrder.items.forEach((item: any) => {
        prices[item.id] = (item.price || 0).toString();
      });
      setItemPrices(prices);
    } else {
      setItemPrices({});
    }
  }, [selectedOrder]);

  useEffect(() => {
    fetchOrders();
  }, [userRole, token]);

  const fetchOrders = async () => {
    try {
      const res = await apiFetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data);
    } catch (e: any) {
      if (e.message !== 'Service temporarily unavailable. Please try again later.') {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  const openOrder = async (id: string) => {
    try {
      const res = await apiFetch(`/api/admin/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedOrder(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/admin/orders/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
        setSelectedOrder((prev: any) => prev?.id === id ? { ...prev, status } : prev);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to update status');
    }
  };

  const handleSendQuote = async () => {
    if (!selectedOrder) return;
    setSendingQuote(true);
    try {
      const payload = {
        items: Object.keys(itemPrices).map(id => ({
          id,
          price: parseFloat(itemPrices[id]) || 0
        }))
      };
      const res = await apiFetch(`/api/admin/orders/${selectedOrder.id}/send-quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        alert('Quotation finalized and email sent to customer automatically!');
        fetchOrders();
        setSelectedOrder(null);
      } else {
        alert(data.error || 'Failed to send quotation');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error: ' + e.message);
    } finally {
      setSendingQuote(false);
    }
  };

  const getShippingAddress = (str: string) => {
    try { return ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(str); } catch { return {}; }
  };

  const handleDownload = async (url: string, defaultName: string = 'download') => {
    try {
      if (url.includes('drive.google.com')) {
        const u = url + (url.includes('?') ? '&' : '?') + 'export=download';
        window.open(u, '_blank');
        return;
      }
      if (url.includes('firebasestorage.googleapis.com')) {
         window.open(url, '_blank');
         return;
      }
      
      const u = url + (url.includes('?') ? '&' : '?') + 'download=1';
      const response = await apiFetch(u);
      if (!response.ok) {
        throw new Error('File not found. It may have been cleared during a server restart since it was a legacy local upload.');
      }
      const blob = await response.blob();
      const objUrl = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = objUrl;
      
      let fileName = defaultName;
      const disposition = response.headers.get('content-disposition');
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, '');
        }
      } else {
        const urlParts = url.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        if (lastPart) {
           fileName = decodeURIComponent(lastPart).split('?')[0];
        }
      }
      
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(objUrl), 100);
    } catch (e) {
      console.error(e);
      alert('Failed to download the image. The file may have been lost or removed.');
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-purple-600" /> Quotation Requests (RFQs)
          </h2>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500">
              <th className="p-4 font-medium">Request ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Total</th>
              <th className="p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-mono text-gray-600">{o.id}</td>
                <td className="p-4">
                  <div className="font-medium text-gray-900">{o.customerName}</div>
                  <div className="text-gray-500">{o.customerEmail}</div>
                </td>
                <td className="p-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${
                    o.status === 'quote_pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    o.status === 'quote_sent' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                    o.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
                    o.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {o.status === 'quote_pending' ? 'Quote Pending' : o.status === 'quote_sent' ? 'Quote Sent' : o.status}
                  </span>
                </td>
                <td className="p-4 font-medium text-gray-900">₹{(o.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-4">
                  <Button variant="outline" size="sm" onClick={() => openOrder(o.id)}>
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900">Quotation Request #{selectedOrder.id}</h2>
                {['admin', 'manager'].includes(userRole) ? (
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                    className="ml-2 bg-gray-50 border border-gray-200 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2"
                  >
                    <option value="quote_pending">Quote Pending</option>
                    <option value="quote_sent">Quote Sent</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {selectedOrder.status}
                  </span>
                )}
              </div>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Close</Button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Customer & Shipping */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Customer</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                    <p className="text-gray-600">{selectedOrder.customerEmail}</p>
                    <p className="text-gray-600 pt-2 border-t mt-2">Payment: <span className="font-semibold text-gray-900">{selectedOrder.paymentMethod}</span></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> Shipping Address</h3>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {(() => {
                      const addr = getShippingAddress(selectedOrder.shippingAddress);
                      return (
                        <>
                          <p className="font-medium text-gray-900">{addr.fullName}</p>
                          <p className="text-gray-600">{addr.phone}</p>
                          <p className="text-gray-600 mt-2">{addr.street}</p>
                          <p className="text-gray-600">{addr.city}, {addr.state} {addr.zip}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-gray-400" /> Products Summary</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y">
                  {selectedOrder.items.map((item: any, idx: number) => {
                    const customizations = item.customizations ? ((str) => { try { return JSON.parse(str); } catch(e) { return {}; } })(item.customizations) : null;
                    return (
                      <div key={idx} className="p-4 bg-white flex flex-col md:flex-row gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center border shrink-0">
                          <>
    {item.productImage ? <img referrerPolicy="no-referrer" src={getOptimizedImage(item.productImage, 100) || ''} alt={item.productName} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} /> : null}
    <div className={`w-full h-full flex items-center justify-center text-gray-400 ${item.productImage ? 'hidden' : ''}`}><svg className="w-6 h-6 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
  </>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.productName}</h4>
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                            <p className="text-sm text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">Quantity: <strong className="text-gray-900">{item.quantity}</strong></p>
                            {['admin', 'manager'].includes(userRole) ? (
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border">
                                  <span className="text-xs text-gray-500 font-bold uppercase">Price (For 1 Qty) (₹):</span>
                                  <input
                                    type="number"
                                    value={itemPrices[item.id] !== undefined ? itemPrices[item.id] : item.price}
                                    onChange={(e) => setItemPrices({ ...itemPrices, [item.id]: e.target.value })}
                                    className="w-24 px-2 py-0.5 border rounded focus:ring-purple-500 focus:border-purple-500 outline-none text-sm font-bold text-purple-900"
                                  />
                                </div>
                                <span className="text-xs text-gray-400 font-medium">
                                  Auto-calculated: ₹{(parseFloat(itemPrices[item.id] !== undefined ? itemPrices[item.id] : item.price) || 0).toLocaleString('en-IN')} × {item.quantity} = <strong className="text-purple-600">₹{((parseFloat(itemPrices[item.id] !== undefined ? itemPrices[item.id] : item.price) || 0) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Unit Price: ₹{(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            )}
                          </div>
                          
                          {/* Media Download Section */}
                          {customizations && (
                            <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-lg">
                              <h5 className="font-semibold text-purple-900 mb-2">Customer Uploads</h5>
                              {(Array.isArray(customizations) ? customizations : [customizations]).map((cust, i) => (
                                <div key={i} className="mb-3 last:mb-0">
                                  <p className="text-sm text-purple-800 mb-1">Placement: <span className="font-medium">{cust.placement}</span></p>
                                  {cust.instructions && (
                                    <p className="text-xs text-purple-950 bg-white p-2.5 rounded-md border border-purple-200 my-1.5 font-semibold">
                                      💬 Customer Note / Query: {cust.instructions}
                                    </p>
                                  )}
                                  {cust.mediaUrl && (
                                    <div className="flex items-center gap-3">
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleDownload(cust.mediaUrl)}
                                        className="bg-white text-purple-700 border border-purple-200 hover:bg-purple-100"
                                      >
                                        <DownloadCloud className="w-4 h-4 mr-2" /> Download Original Media
                                      </Button>
                                      <a href={cust.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:text-purple-800 underline">
                                        View Image
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="font-bold text-gray-900 text-right shrink-0">
                          ₹{((itemPrices[item.id] !== undefined ? parseFloat(itemPrices[item.id]) || 0 : (item.price || 0)) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Custom Quotation Action Panel */}
              {['admin', 'manager'].includes(userRole) && (
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 mt-6">
                  <h4 className="font-bold text-purple-950 mb-1 flex items-center gap-2">
                    <Package className="w-5 h-5 text-purple-600" /> Quotation Pricing Action Panel
                  </h4>
                  <p className="text-sm text-purple-800 mb-4">
                    Enter the price for <strong>1 quantity</strong> of each product above. The system will automatically calculate the subtotal for the requested quantity and update the final quotation value.
                  </p>

                  {/* Real-time Pricing Breakdown & Automatic Calculation List */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-5 border border-purple-200/50 space-y-3">
                    <h5 className="text-xs font-bold text-purple-950 uppercase tracking-wider border-b border-purple-100 pb-2">
                      Live Calculations (Different price per product)
                    </h5>
                    <div className="divide-y divide-purple-100/50 text-xs">
                      {selectedOrder.items.map((item: any) => {
                        const unitPrice = parseFloat(itemPrices[item.id] !== undefined ? itemPrices[item.id] : item.price) || 0;
                        const subtotal = unitPrice * item.quantity;
                        return (
                          <div key={item.id} className="py-2.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                            <span className="font-medium text-gray-800 shrink-0 max-w-xs truncate">{item.productName}</span>
                            <span className="font-mono text-purple-900 bg-purple-50/50 px-2.5 py-1 rounded border border-purple-100 text-[11px] md:text-xs">
                              ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (for 1 Qty) × {item.quantity} Qty = <strong className="font-bold text-purple-700">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-purple-200/50">
                    <div>
                      <p className="text-xs text-purple-700 uppercase tracking-wider font-bold">New Recalculated Total Value</p>
                      <p className="text-3xl font-black text-purple-950 font-mono mt-0.5">
                        ₹{(() => {
                          let sum = 0;
                          selectedOrder.items.forEach((item: any) => {
                            const price = itemPrices[item.id] !== undefined ? (parseFloat(itemPrices[item.id]) || 0) : item.price;
                            sum += price * item.quantity;
                          });
                          return sum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </p>
                    </div>
                    <Button 
                      onClick={handleSendQuote} 
                      disabled={sendingQuote}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-6 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 text-base"
                    >
                      {sendingQuote ? 'Sending Quotation...' : 'Finalize & Email Quote'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
