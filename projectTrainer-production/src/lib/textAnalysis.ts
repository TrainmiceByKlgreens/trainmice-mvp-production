const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'if', 'in', 'into', 'is', 'it',
  'no', 'not', 'of', 'on', 'or', 'such', 'that', 'the', 'their', 'then', 'there', 'these',
  'they', 'this', 'to', 'was', 'will', 'with', 'very', 'also', 'can', 'could', 'would', 'should',
  'have', 'has', 'had', 'do', 'does', 'did', 'been', 'being', 'am', 'i', 'we', 'you', 'he', 'she',
  'him', 'her', 'his', 'its', 'our', 'your', 'my', 'me', 'us', 'them', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'any', 'many', 'much', 'so', 'than', 'too', 'from', 'up', 'about', 'after', 'before',
  'between', 'during', 'until', 'while', 'out', 'over', 'under', 'again', 'further', 'once'
]);

export function extractTopWords(texts: (string | null)[], topN: number = 5): string[] {
  const wordCounts = new Map<string, number>();

  texts.forEach(text => {
    if (!text) return;

    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !STOP_WORDS.has(word));

    words.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
  });

  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word);
}

export function classifySentiment(averageRating: number): 'Positive' | 'Neutral' | 'Negative' {
  if (averageRating >= 4) return 'Positive';
  if (averageRating >= 3) return 'Neutral';
  return 'Negative';
}

export function parseInterestLevel(count: number, totalParticipants: number): 'High' | 'Medium' | 'Low' {
  if (totalParticipants === 0) return 'Low';

  const percentage = (count / totalParticipants) * 100;

  if (percentage >= 50) return 'High';
  if (percentage >= 25) return 'Medium';
  return 'Low';
}

export function extractKeywords(texts: (string | null)[], minLength: number = 4): string[] {
  const keywords = new Set<string>();

  texts.forEach(text => {
    if (!text) return;

    const words = text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= minLength && !STOP_WORDS.has(word));

    words.forEach(word => keywords.add(word));
  });

  return Array.from(keywords).slice(0, 10);
}
