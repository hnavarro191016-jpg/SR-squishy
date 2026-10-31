// Caché de alta capacidad en IndexedDB para fotos de productos (soporta >500 MB sin límite de LocalStorage)
const DB_NAME = 'SquishyImageCacheDB';
const STORE_NAME = 'product_images';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no disponible'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedImagesMap() {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const map = {};
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          map[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          resolve(map);
        }
      };
      cursorReq.onerror = () => resolve({});
    });
  } catch (e) {
    return {};
  }
}

export async function setCachedProductImages(productId, images) {
  if (!productId || !Array.isArray(images) || images.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(images, productId);
  } catch (e) {
    // Ignorar en modo incógnito restringido
  }
}

export async function setCachedProductsImagesBulk(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    items.forEach(item => {
      if (item.id && Array.isArray(item.images) && item.images.length > 0) {
        store.put(item.images, item.id);
      }
    });
  } catch (e) {
    // Ignorar errores de almacenamiento
  }
}
