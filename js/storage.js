/**
 * storage.js – localStorage CRUD abstraction
 * All collections are stored as JSON arrays in localStorage.
 */
const Storage = (() => {
  // Loads all records from a localStorage collection.
  // This centralizes JSON parsing and fallback handling for empty data.
  function getAll(collection) {
    try {
      return JSON.parse(localStorage.getItem(collection) || '[]');
    } catch {
      return [];
    }
  }

  // Finds a single record by id inside a localStorage collection.
  // This provides a simple lookup helper on top of getAll.
  function get(collection, id) {
    return getAll(collection).find(item => item.id === id) || null;
  }

  // Creates a new record with generated metadata and saves it.
  // This ensures each stored item gets a stable id and timestamps.
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

  // Updates an existing record in a localStorage collection.
  // This preserves the original id while refreshing the updated timestamp.
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

  // Removes a record by id from a localStorage collection.
  // This rewrites the collection without the deleted item.
  function remove(collection, id) {
    const items = getAll(collection).filter(item => item.id !== id);
    localStorage.setItem(collection, JSON.stringify(items));
    return true;
  }

  // Clears an entire localStorage collection.
  // This is useful for resetting one stored dataset at a time.
  function clear(collection) {
    localStorage.removeItem(collection);
  }

  // Filters collection items with a custom predicate.
  // This provides a reusable query helper for derived results.
  function query(collection, predicate) {
    return getAll(collection).filter(predicate);
  }

  return { getAll, get, create, update, remove, clear, query };
})();
