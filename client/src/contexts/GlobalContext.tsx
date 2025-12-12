import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { api } from "../utils/api";
import type { Show } from "../utils/api";

interface GlobalContextType {
  getCachedShow: (id: string) => Show | undefined;
  refreshShows: () => Promise<void>;
  shows: Show[];
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Record<string, Show>>({});
  const [shows, setShows] = useState<Show[]>([]);

  const getCachedShow = useCallback(
    (id: string) => {
      return cache[id];
    },
    [cache]
  );

  const refreshShows = useCallback(async () => {
    const fetchedShows = await api.getShows();
    setShows(fetchedShows);
    // Update cache as well
    const newCache: Record<string, Show> = {};
    fetchedShows.forEach((show) => {
      newCache[show.id] = show;
    });
    setCache(newCache);
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GlobalContext.Provider
      value={{ getCachedShow, refreshShows, shows }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error("useGlobal must be used within a GlobalProvider");
  }
  return context;
}
