import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getFolders, getItems } from "./database";
import { useAuth } from "./auth";

const DataContext = createContext();

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [folders, setFolders] = useState([]);
  const [items, setItems] = useState([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [f, i] = await Promise.all([getFolders(), getItems()]);
      setFolders(f);
      setItems(i);
      setVersion((v) => v + 1);
    } catch (err) {
      console.error("Data refresh error:", err);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  return (
    <DataContext.Provider value={{ folders, items, refresh, version }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext) || { folders: [], items: [], refresh: () => {}, version: 0 };
}
