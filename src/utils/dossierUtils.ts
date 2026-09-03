import { Dossier } from '../types';

/**
 * Calculates the next sequential chapter/dossier number based on existing dossiers.
 * Scans for the maximum existing chapterNumber and returns Math.max(max + 1, list.length + 1).
 */
export function getNextChapterNumber(dossiers: Dossier[]): number {
  if (!dossiers || dossiers.length === 0) return 1;
  const maxNumber = dossiers.reduce((max, d) => {
    const num = typeof d.chapterNumber === 'number' ? d.chapterNumber : parseInt(String(d.chapterNumber), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  return Math.max(maxNumber + 1, dossiers.length + 1);
}

/**
 * Formats a chapter/dossier number with zero padding (e.g. 1 -> "01", 7 -> "07", 12 -> "12")
 */
export function formatDossierNumber(chapterNumber: number | string | undefined, fallbackIndex?: number): string {
  if (chapterNumber !== undefined && chapterNumber !== null) {
    const num = typeof chapterNumber === 'number' ? chapterNumber : parseInt(String(chapterNumber), 10);
    if (!isNaN(num) && num > 0) {
      return String(num).padStart(2, '0');
    }
  }
  if (fallbackIndex !== undefined && fallbackIndex >= 0) {
    return String(fallbackIndex + 1).padStart(2, '0');
  }
  return '01';
}

/**
 * Reconciles and merges client-side (localStorage) dossiers and server-side (dossiers_store.json) dossiers.
 * Uses `lastModified` ISO timestamps to guarantee that user modifications (e.g. title edits)
 * are NEVER overwritten by stale server seed data or older cache.
 */
export function reconcileDossiers(
  localDossiers: Dossier[],
  serverDossiers: Dossier[],
  deletedIds: Set<string> | string[] = new Set()
): { merged: Dossier[]; hasLocalUpdatesToSync: boolean } {
  const deletedSet = deletedIds instanceof Set ? deletedIds : new Set(deletedIds);

  const cleanServer = (serverDossiers || []).filter(d => d && d.id && !deletedSet.has(d.id));
  const cleanLocal = (localDossiers || []).filter(d => d && d.id && !deletedSet.has(d.id));

  if (cleanServer.length === 0) {
    return { merged: cleanLocal, hasLocalUpdatesToSync: cleanLocal.length > 0 };
  }
  if (cleanLocal.length === 0) {
    return { merged: cleanServer, hasLocalUpdatesToSync: false };
  }

  let hasLocalUpdatesToSync = false;
  const serverMap = new Map<string, Dossier>(cleanServer.map(d => [d.id, d]));
  const mergedList: Dossier[] = [];

  // Process all local dossiers first
  cleanLocal.forEach(local => {
    const server = serverMap.get(local.id);
    if (!server) {
      // Local exists, server doesn't -> Keep local and mark for sync
      mergedList.push(local);
      hasLocalUpdatesToSync = true;
    } else {
      // Both exist: compare timestamps
      const localTime = local.lastModified ? new Date(local.lastModified).getTime() : 0;
      const serverTime = server.lastModified ? new Date(server.lastModified).getTime() : 0;

      if (localTime > serverTime) {
        // Local is newer: preserve local and queue for server sync
        mergedList.push(local);
        hasLocalUpdatesToSync = true;
      } else if (serverTime > localTime) {
        // Server is newer
        mergedList.push(server);
      } else {
        // Equal or neither has timestamp: if local title differs and is non-empty, prefer local edit
        if (local.title && local.title !== server.title) {
          mergedList.push({ ...server, ...local });
          hasLocalUpdatesToSync = true;
        } else {
          mergedList.push(server);
        }
      }
      serverMap.delete(local.id);
    }
  });

  return { merged: mergedList, hasLocalUpdatesToSync };
}

