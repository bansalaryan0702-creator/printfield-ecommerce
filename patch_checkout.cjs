const fs = require('fs');
let code = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

const target1 = `const placements = parsed.filter((c: any) => c.placement && c.placement !== 'Instructions / Queries').map((c: any) => c.placement);`;
const replacement1 = `
                                  const placementLabels: Record<string, string> = {
                                    'front': 'Front',
                                    'back': 'Back',
                                    'left_chest': 'Left Pocket',
                                    'right_chest': 'Right Pocket',
                                    'front-full': 'Full Front'
                                  };
                                  const placements = parsed.filter((c: any) => c.placement && c.placement !== 'Instructions / Queries').map((c: any) => placementLabels[c.placement] || c.placement);`;

code = code.replace(target1, replacement1);
fs.writeFileSync('src/pages/Checkout.tsx', code);
