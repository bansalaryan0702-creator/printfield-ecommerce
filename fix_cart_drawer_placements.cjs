const fs = require('fs');
let cart = fs.readFileSync('src/components/CartDrawer.tsx', 'utf8');

const regex = /\{item\.customizations\s*&&\s*\([\s\S]*?try\s*\{\s*const\s*parsed\s*=\s*JSON\.parse\(item\.customizations\);[\s\S]*?return\s*null;\s*\}\)\(\)\}\s*<\/div>\s*\)\}/m;

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

cart = cart.replace(regex, newInst);
fs.writeFileSync('src/components/CartDrawer.tsx', cart);

