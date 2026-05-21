function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/['']/g, "'").replace(/[""]/g, '"').trim();
}

export const WORD_ALIASES: Record<string, string[]> = {
  'ci/cd': ['ci cd', 'cicd', 'continuous integration'],
  'mvp': ['minimum viable product', 'm.v.p.'],
  'roi': ['return on investment', 'r.o.i.'],
  'api': ['a.p.i.'],
  'devops': ['dev ops', 'dev-ops'],
};

export function detectWords(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const normalized = normalizeText(transcript);
  const detected: string[] = [];

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;
    const nw = normalizeText(word);

    if (nw.includes(' ')) {
      // Phrase: word-boundary check at edges to avoid false positives
      const regex = new RegExp(`\\b${escapeRegex(nw)}\\b`, 'i');
      if (regex.test(normalized)) detected.push(word);
    } else {
      if (new RegExp(`\\b${escapeRegex(nw)}\\b`, 'i').test(normalized)) {
        detected.push(word);
      }
    }
  }

  return detected;
}

export function detectWordsWithAliases(
  transcript: string,
  cardWords: string[],
  alreadyFilled: Set<string>,
): string[] {
  const detected = detectWords(transcript, cardWords, alreadyFilled);
  const normalized = normalizeText(transcript);

  for (const word of cardWords) {
    if (alreadyFilled.has(word.toLowerCase())) continue;
    if (detected.includes(word)) continue;

    const aliases = WORD_ALIASES[word.toLowerCase()];
    if (aliases) {
      for (const alias of aliases) {
        if (normalized.includes(alias)) {
          detected.push(word);
          break;
        }
      }
    }
  }

  return detected;
}
