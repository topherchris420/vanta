import { useEffect, useState } from "react";
import workbench from "../lib/research/workbench";

const {
  DEFAULT_SESSION,
  STORAGE_KEY,
  parseSession,
  serializeSession,
  parseReadingList,
} = workbench;

export default function useResearchSession(nodeIds, documentIds) {
  const [session, setSession] = useState(DEFAULT_SESSION);
  const [savedIds, setSavedIds] = useState([]);
  const [ready, setReady] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    const restore = () =>
      setSession(parseSession(window.location.search, nodeIds));
    restore();
    try {
      setSavedIds(
        parseReadingList(window.localStorage.getItem(STORAGE_KEY), documentIds),
      );
    } catch {
      setStorageAvailable(false);
    }
    const sync = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setSavedIds(parseReadingList(event.newValue, documentIds));
      }
    };
    setReady(true);
    window.addEventListener("popstate", restore);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("storage", sync);
    };
  }, [nodeIds, documentIds]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      const path = serializeSession(session, nodeIds);
      if (window.location.pathname + window.location.search !== path) {
        window.history.replaceState(window.history.state, "", path);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [session, nodeIds, ready]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds));
    } catch {
      setStorageAvailable(false);
    }
  }, [savedIds, ready]);

  const updateSession = (patch) =>
    setSession((current) => ({ ...current, node: "", ...patch }));
  const toggleSaved = (id) => {
    if (!documentIds.has(id)) return;
    setSavedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  };
  return {
    session,
    updateSession,
    savedIds,
    toggleSaved,
    storageAvailable,
    ready,
  };
}
