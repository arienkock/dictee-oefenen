export const SESSION_SIZE = 10;
export const STORAGE_KEY = "dicteeclub-progress-v1";

export function normalize(text) {
  return text.trim().toLocaleLowerCase("nl-NL").replace(/\s+/g, " ").normalize("NFC");
}

export function isCorrect(input, answer) {
  return normalize(input) === normalize(answer);
}

export function emptyProgress() {
  return { level: 3, stats: {} };
}

export function readProgress(storage) {
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object" || !parsed.stats || typeof parsed.stats !== "object") {
      return emptyProgress();
    }
    return {
      level: Math.min(5, Math.max(1, Number(parsed.level) || 3)),
      stats: parsed.stats,
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(storage, progress) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or full storage must not prevent a practice session.
  }
}

export function dueCount(words, progress, now = Date.now()) {
  return words.filter((word) => progress.stats[word.id]?.dueAt <= now).length;
}

export function createSession() {
  return { answered: 0, newCount: 0, firstTryCorrect: 0, seen: [], retries: [], retryAttempts: {}, current: null, phase: "question" };
}

// Due reviews come first. New words stay near the learner's current level;
// the first session therefore begins at level 3, rather than at the easy end.
export function chooseWord(words, progress, session, now = Date.now()) {
  const recent = session.seen.slice(-2);
  const retry = session.retries.find((item) => item.after <= session.answered && !recent.includes(item.id));
  if (retry) return { word: words.find((word) => word.id === retry.id), retry: true };

  if (session.newCount >= SESSION_SIZE) {
    const lastRetry = session.retries.find((item) => !recent.includes(item.id)) ?? session.retries[0];
    return lastRetry ? { word: words.find((word) => word.id === lastRetry.id), retry: true } : null;
  }

  const unseen = words.filter((word) => !session.seen.includes(word.id));
  const available = unseen.length ? unseen : words.filter((word) => !recent.includes(word.id));
  if (!available.length) return null;

  const due = available.filter((word) => progress.stats[word.id]?.dueAt <= now);
  if (due.length) {
    due.sort((a, b) => (progress.stats[a.id].dueAt - progress.stats[b.id].dueAt));
    return { word: due[0], retry: false };
  }

  const fresh = available.filter((word) => !progress.stats[word.id]);
  if (fresh.length) {
    fresh.sort((a, b) => Math.abs(a.difficulty - progress.level) - Math.abs(b.difficulty - progress.level));
    return { word: fresh[0], retry: false };
  }

  available.sort((a, b) => (progress.stats[a.id]?.dueAt ?? 0) - (progress.stats[b.id]?.dueAt ?? 0));
  return { word: available[0], retry: false };
}

export function recordAnswer(progress, session, word, correct, now = Date.now()) {
  const isRetry = session.current?.retry ?? false;
  session.answered += 1;
  session.seen.push(word.id);
  if (!isRetry) {
    session.newCount += 1;
    if (correct) session.firstTryCorrect += 1;
  }

  const previous = progress.stats[word.id] ?? { attempts: 0, correct: 0, streak: 0, misses: 0 };
  const streak = correct ? previous.streak + 1 : 0;
  // A correct answer after a miss is useful practice, but earns a short interval.
  const hadRetry = (session.retryAttempts[word.id] ?? 0) > 0;
  const intervals = [0, 1, 3, 7, 14, 30];
  const days = correct ? (hadRetry ? 1 : intervals[Math.min(streak, 5)]) : 0;
  progress.stats[word.id] = {
    attempts: previous.attempts + 1,
    correct: previous.correct + Number(correct),
    misses: previous.misses + Number(!correct),
    streak,
    dueAt: now + (correct ? days * 86400000 : 0),
    lastAt: now,
  };

  if (isRetry) session.retries = session.retries.filter((item) => item.id !== word.id);
  if (!correct) {
    session.retryAttempts[word.id] = (session.retryAttempts[word.id] ?? 0) + 1;
    if (session.retryAttempts[word.id] <= 2) {
      session.retries.push({ id: word.id, after: session.answered + 2 });
    }
  }

  // Calibrate gradually, using first attempts only. Avoid punishing practice retries.
  if (!isRetry) {
    progress.level = Math.max(1, Math.min(5, progress.level + (correct ? 0.18 : -0.28)));
  }
  return progress.stats[word.id];
}
