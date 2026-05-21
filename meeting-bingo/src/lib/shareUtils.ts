import type { GameState } from '../types';
import { CATEGORIES } from '../data/categories';

export function generateShareText(game: GameState): string {
  const category = CATEGORIES.find(c => c.id === game.category);
  const elapsed = game.startedAt && game.completedAt
    ? Math.round((game.completedAt - game.startedAt) / 60000)
    : null;
  const filled = game.filledCount - 1; // exclude free space
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

  return [
    '🎯 I got BINGO playing Meeting Bingo!',
    `📦 Category: ${category?.name ?? game.category}`,
    elapsed != null ? `⏱️ Time: ${elapsed} minute${elapsed === 1 ? '' : 's'}` : null,
    game.winningWord ? `🏆 Winning word: "${game.winningWord}"` : null,
    `📊 Squares filled: ${filled}/24`,
    '',
    `Play at: ${appUrl}`,
  ]
    .filter(line => line !== null)
    .join('\n');
}

export async function shareResult(game: GameState): Promise<void> {
  const text = generateShareText(game);

  if (navigator.share) {
    await navigator.share({ text });
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  // Fallback for non-HTTPS or clipboard-denied contexts
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
