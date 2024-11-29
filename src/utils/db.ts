export class KeyDatabase {
  private static DB_NAME = "KeyStorage";
  private static DB_VERSION = 1;
  private static STORE_NAME = "keys";

  private static async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        KeyDatabase.DB_NAME,
        KeyDatabase.DB_VERSION,
      );

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(KeyDatabase.STORE_NAME)) {
          db.createObjectStore(KeyDatabase.STORE_NAME);
        }
      };
    });
  }

  static async saveKeys(
    userId: string,
    keys: { publicKey: string; secretKey: string },
  ) {
    try {
      const db = await this.openDB();
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);

        const keyData = {
          ...keys,
          timestamp: Date.now(),
        };

        const request = store.put(keyData, `keys_${userId}`);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();

        transaction.oncomplete = () => db.close();
      });
    } catch (error) {
      console.error("Failed to save keys:", error);
      throw error;
    }
  }

  static async getKeys(
    userId: string,
  ): Promise<{ publicKey: string; secretKey: string } | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readonly");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(`keys_${userId}`);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const data = request.result;
          if (!data) {
            resolve(null);
          } else {
            // Check if keys are expired (24 hours)
            const KEY_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
            if (Date.now() - data.timestamp > KEY_EXPIRY) {
              this.deleteKeys(userId);
              resolve(null);
            } else {
              resolve({
                publicKey: data.publicKey,
                secretKey: data.secretKey,
              });
            }
          }
        };

        transaction.oncomplete = () => db.close();
      });
    } catch (error) {
      console.error("Failed to get keys:", error);
      throw error;
    }
  }

  static async deleteKeys(userId: string): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(`keys_${userId}`);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();

        transaction.oncomplete = () => db.close();
      });
    } catch (error) {
      console.error("Failed to delete keys:", error);
      throw error;
    }
  }

  static async clearAllKeys(): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], "readwrite");
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();

        transaction.oncomplete = () => db.close();
      });
    } catch (error) {
      console.error("Failed to clear keys:", error);
      throw error;
    }
  }
}
