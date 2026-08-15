const STORAGE_KEY = 'linuxcv:visitor-id';

/**
 * Identifies this browser as the owner of its chat sessions. Without it the
 * server would have no way to keep one visitor's history out of another's.
 */
export const getVisitorId = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return stored;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, created);
  return created;
};
