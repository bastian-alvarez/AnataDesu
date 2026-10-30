import { questions } from './data.js';
import { defaultPreferences, validatePreferences, validateAnswers, migrateLegacyResult, getArchivedResult } from './engine.js';
import { parseFriendCode } from './compatibility.js';

export const STORAGE_KEY = 'anata-desu:v2';
export const LEGACY_KEY = 'anata-desu:v1';
export const freshSession = () => ({ answers: Array(questions.length).fill(null), current: 0, preferences: defaultPreferences(), configured: false, archive: null, pendingFriend: null });

export function restoreSession(storage) {
  const state = freshSession();
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
    if (saved?.version === 2 && saved.questionSet === 'scenes-1' && validateAnswers(saved.answers, { partial: true })) {
      state.answers = saved.answers;
      state.current = Number.isInteger(saved.current) ? Math.max(0, Math.min(questions.length - 1, saved.current)) : 0;
      if (validatePreferences(saved.preferences)) {
        state.preferences = { mode: saved.preferences.mode, seriesIds: [...saved.preferences.seriesIds] };
        state.configured = saved.configured === true;
      }
      if (getArchivedResult(saved.archive)) state.archive = { id: saved.archive.id, profile: [...saved.archive.profile] };
      state.pendingFriend = parseFriendCode(saved.pendingFriend)?.code || null;
      return { ...state, storageAvailable: true };
    }
    const legacy = JSON.parse(storage.getItem(LEGACY_KEY) || 'null');
    if (legacy?.version === 1) state.archive = migrateLegacyResult(legacy.answers);
    return { ...state, storageAvailable: true };
  } catch { return { ...state, storageAvailable: false }; }
}

export function serializeSession(state) {
  return JSON.stringify({ version: 2, questionSet: 'scenes-1', answers: state.answers, current: state.current, preferences: state.preferences, configured: state.configured, archive: state.archive, pendingFriend: state.pendingFriend });
}
