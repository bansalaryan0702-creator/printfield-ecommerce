const fs = require('fs');

// Fix CartDrawer.tsx
let cart = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');
const oldInst = `{item.customizations && (
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-xs text-purple-600 bg-purple-50 inline-block px-2 py-0.5 rounded border border-purple-100 self-start">
                            Custom Design applied
                          </p>
                          {(() => {
                            try {
                              const parsed = JSON.parse(item.customizations);
                              const instObj = Array.isArray(parsed)
                                 ? parsed.find((c: any) => c.instructions)
                                 : (parsed?.instructions ? parsed : null);
                              if (instObj?.instructions) {
                                return (
                                  <p className="text-[11px] text-purple-900 bg-purple-50/80 px-2 py-1 rounded border border-purple-200/80 font-medium line-clamp-2">
                                    💬 Note: {instObj.instructions}
                                  </p>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}
                        </div>
                      )}`;
const newInst = `{item.customizations && (
                        <div className="flex flex-col gap-1 mt-1">
                          <p className="text-xs text-purple-600 bg-purple-50 inline-block px-2 py-0.5 rounded border border-purple-100 self-start">
                            Custom Design applied
                          </p>
                          {(() => {
                            try {
                              const parsed = JSON.parse(item.customizations);
                              if (Array.isArray(parsed)) {
                                const instObj = parsed.find((c: any) => c.instructions);
                                const placements = parsed.filter((c: any) => c.placement && c.placement !== 'Instructions / Queries').map((c: any) => c.placement);
                                return (
                                  <>
                                    {placements.length > 0 && (
                                      <p className="text-[11px] text-gray-600">
                                        <span className="font-semibold">Placements:</span> {placements.join(', ')}
                                      </p>
                                    )}
                                    {instObj?.instructions && (
                                      <p className="text-[11px] text-purple-900 bg-purple-50/80 px-2 py-1 rounded border border-purple-200/80 font-medium line-clamp-2 mt-0.5">
                                        💬 Note: {instObj.instructions}
                                      </p>
                                    )}
                                  </>
                                );
                              } else if (parsed?.instructions) {
                                return (
                                  <p className="text-[11px] text-purple-900 bg-purple-50/80 px-2 py-1 rounded border border-purple-200/80 font-medium line-clamp-2">
                                    💬 Note: {parsed.instructions}
                                  </p>
                                );
                              }
                            } catch (e) {}
                            return null;
                          })()}
                        </div>
                      )}`;
cart = cart.replace(oldInst, newInst);
fs.writeFileSync('src/components/CartDrawer.tsx', cart);

// Fix Checkout.tsx
let checkout = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const oldCheckoutInst = `                            {vars && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {vars.split(' | ').map((v, i) => (
                                  <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">
                                    {v}
                                  </span>
                                ))}
                              </div>
                            )}`;

const newCheckoutInst = `                            {vars && (
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
                                  const placements = parsed.filter((c: any) => c.placement && c.placement !== 'Instructions / Queries').map((c: any) => c.placement);
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
                            })()}`;

checkout = checkout.replace(oldCheckoutInst, newCheckoutInst);
fs.writeFileSync('src/pages/Checkout.tsx', checkout);
