import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { AsyncStorage } from "@tanstack/react-query-persist-client";
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV();

const clientStorage: AsyncStorage = {
  setItem: (key, value) => {
    storage.set(key, value);
  },
  getItem: (key) => {
    const value = storage.getString(key);
    return value === undefined ? null : value;
  },
  removeItem: (key) => {
    storage.delete(key);
  },
};

export const clientPersister = createAsyncStoragePersister({
  storage: clientStorage,
});
