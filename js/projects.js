
// projects.js – Project logic

const Projects = (() => {
  const COLLECTION = 'projects';

  const PALETTE = [
    '#4361ee', '#3f8efc', '#7b2d8b', '#f72585',
    '#4cc9f0', '#06d6a0', '#fb5607', '#ffbe0b',
  ];

  /* ── CRUD ────────────────────────────────────────────────── */
  function getAll()          { return Storage.getAll(COLLECTION); }
  function get(id)           { return Storage.get(COLLECTION, id); }
  function create(data)      { return Storage.create(COLLECTION, data); }
  function update(id, data)  { return Storage.update(COLLECTION, id, data); }
  function remove(id)        { return Storage.remove(COLLECTION, id); }

  /* ── Helpers ─────────────────────────────────────────────── */
  function getName(id) {
    const p = get(id);
    return p ? p.name : '—';
  }

  function colorDot(project) {
    const color = project ? project.color : '#ccc';
    return `<span class="project-dot" style="background:${color}"></span>`;
  }

  function randomColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }

  return { getAll, get, create, update, remove, getName, colorDot, randomColor, PALETTE };
})();