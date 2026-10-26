// Conservative copy-based duplicate check shared by AI acceptance and pool
// selection. This catches closely matching outcomes, not semantic equivalence.
const words = text => new Set(text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(word =>
  !['a', 'an', 'the', 'to', 'for', 'your', 'you', 'in', 'on', 'and', 'of', 'is', 'are', 'with', 'when'].includes(word)) || []);

export function sameOutcome(a, b) {
  const overlap = (x, y) => {
    const left = words(x), right = words(y);
    return left.size && right.size ? [...left].filter(word => right.has(word)).length / Math.max(left.size, right.size) : 0;
  };
  return overlap(a.done_when, b.done_when) >= 0.8 ||
    (overlap(a.title, b.title) >= 0.8 && overlap(a.steps.join(' '), b.steps.join(' ')) >= 0.65);
}
