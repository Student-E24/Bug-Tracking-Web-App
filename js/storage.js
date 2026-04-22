//Provides a generic interface for persistent data storage
const Storage = (() => {
  function getAll(collection) {
    try {
      return JSON.parse(localStorage.getItem(collection) || '[]');
    } catch {
      return [];
    }
  }
//Retrieves a single item by ID from a collection
  function getItemByID(collection, id) {
    return getAll(collection).find(item => item.id === id) || null;
  }
//Creates a new item in the collection
  function createItem(collection, data) {
    const items = getAll(collection);
    const item = {
      ...data,
      id: ${Date.now()}-${Math.random().toString(36).slice(2, 7)},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(item);
    localStorage.setItem(collection, JSON.stringify(items));
    return item;
  }
//Updates an existing item in the collection
  function updateItem(collection, id, data) {
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
//Deletes an item from the collection
  function removeItem(collection, id) {
    const items = getAll(collection).filter(item => item.id !== id);
    localStorage.setItem(collection, JSON.stringify(items));
    return true;
  }
// Clears/deletes an entire collection
  function clearCollection(collection) {
    localStorage.removeItem(collection);
  }
// Queries items in a collection using a predicate function
  function queryItem(collection, predicate) {
    return getAll(collection).filter(predicate);
  }

  return { getAll, get, create, update, remove, clear, query };
})();