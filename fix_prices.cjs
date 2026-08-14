const fs = require('fs');
let cartDrawer = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');

// Cart Drawer modifications
const oldCartItemPrice = `<span className="font-bold text-gray-900">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>`;
cartDrawer = cartDrawer.replace(oldCartItemPrice, "");

const oldCartTotal = `            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-600">Total Pricing</span>
              <span className="text-lg font-bold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
            </div>`;
const newCartTotal = `            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-600">Total Pricing</span>
              <span className="text-sm font-bold text-purple-700 bg-purple-100 border border-purple-200 px-3 py-1 rounded-full">Calculated on Request</span>
            </div>`;
cartDrawer = cartDrawer.replace(oldCartTotal, newCartTotal);

const missingPricingRequest = `                      {item.product?.instructions && !item.customizations && (
                        <p className="text-[11px] text-purple-900 bg-purple-50/80 px-2 py-1 rounded border border-purple-200/80 font-medium line-clamp-2 mt-1">
                          💬 Note: {item.product.instructions}
                        </p>
                      )}
                      <p className="text-purple-600 font-semibold text-xs mt-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 inline-block">Pricing on request</p>`;
                      
if (!cartDrawer.includes("Pricing on request")) {
    const searchTarget = `                      {item.product?.instructions && !item.customizations && (
                        <p className="text-[11px] text-purple-900 bg-purple-50/80 px-2 py-1 rounded border border-purple-200/80 font-medium line-clamp-2 mt-1">
                          💬 Note: {item.product.instructions}
                        </p>
                      )}`;
    cartDrawer = cartDrawer.replace(searchTarget, missingPricingRequest);
}

fs.writeFileSync('src/components/CartDrawer.tsx', cartDrawer);

// Checkout modifications
let checkout = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const oldCheckoutItemPriceStr1 = `<span className="font-bold text-gray-900 shrink-0">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>`;
checkout = checkout.replace(oldCheckoutItemPriceStr1, "");

const oldCheckoutItemQty = `<p className="text-xs text-gray-500 mt-1.5">Qty: {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}</p>`;
const newCheckoutItemQty = `<p className="text-xs text-gray-500 mt-1.5">Qty: {item.quantity}</p>`;
checkout = checkout.replace(oldCheckoutItemQty, newCheckoutItemQty);

const oldCheckoutTotal = `              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>GST (18%)</span>
                  <span className="font-medium text-gray-900">₹{(total * 0.18).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                  <span>Total Estimate</span>
                  <span>₹{(total * 1.18).toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[11px] text-gray-500 italic mt-3 text-center">
                  *This is an estimated quotation. Our managers will review your files and exact requirements before sending the final invoice.
                </p>
              </div>`;
              
const newCheckoutTotal = `              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Wholesale Pricing</span>
                  <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">Quote on Request</span>
                </div>
                <p className="text-[11px] text-gray-500 italic mt-3 text-center">
                  *Our managers will evaluate your customization files and specifications, add special bulk discounts, and email you a customized invoice quotation directly.
                </p>
              </div>`;
checkout = checkout.replace(oldCheckoutTotal, newCheckoutTotal);

fs.writeFileSync('src/pages/Checkout.tsx', checkout);
