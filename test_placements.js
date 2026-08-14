const custom = JSON.stringify([
  { placement: 'front', mediaUrl: 'abc' },
  { placement: 'Instructions / Queries', instructions: 'please rush' },
  { placement: 'back', mediaUrl: 'def' }
]);
const parsed = JSON.parse(custom);
let placements = [];
if (Array.isArray(parsed)) {
  placements = parsed.filter(c => c.placement && c.placement !== 'Instructions / Queries').map(c => c.placement);
}
console.log("Placements: ", placements.join(', '));
