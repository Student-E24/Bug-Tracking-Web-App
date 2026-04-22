// Provides a generic interface for persistent data storage using localStorage.
const Storage = (() => {
  function getAll(collection) {
    try {
      return JSON.parse(localStorage.getItem(collection) || '[]');
    } catch {
      return [];
    }
  }

  function get(collection, id) {
    return getAll(collection).find(item => item.id === id) || null;
  }

  function create(collection, data) {
    const items = getAll(collection);
    const item = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    localStorage.setItem(collection, JSON.stringify(items));
    return item;
  }

  function update(collection, id, data) {
    const items = getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = {
      ...items[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(collection, JSON.stringify(items));
    return items[index];
  }

  function remove(collection, id) {
    const items = getAll(collection).filter(item => item.id !== id);
    localStorage.setItem(collection, JSON.stringify(items));
    return true;
  }

  function clear(collection) {
    localStorage.removeItem(collection);
  }

  function query(collection, predicate) {
    return getAll(collection).filter(predicate);
  }

  // Ensures a collection key exists in localStorage as a JSON array.
  function ensureCollection(collection) {
    if (!localStorage.getItem(collection)) {
      localStorage.setItem(collection, '[]');
    }
  }

  // Ensures multiple collection keys exist.
  function ensureCollections(collections = []) {
    collections.forEach(ensureCollection);
  }

  return {
    getAll,
    get,
    create,
    update,
    remove,
    clear,
    query,
    ensureCollection,
    ensureCollections,
  };
})();