// Simple text similarity using Jaccard similarity
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

export function checkForDuplicates(
  newPosts: string[],
  previousPosts: string[],
  threshold: number = 0.7
): boolean {
  for (const newPost of newPosts) {
    for (const oldPost of previousPosts) {
      const similarity = calculateSimilarity(newPost, oldPost);
      if (similarity > threshold) {
        console.warn(`High similarity detected (${similarity.toFixed(2)}): "${newPost.substring(0, 50)}..." matches previous content`);
        return true; // Found duplicate
      }
    }
  }
  return false; // No duplicates
}
