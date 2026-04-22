//projects.js – Project domain logic for submission app.
const Projects = (() => {
  const COLLECTION = 'projects';
// Predefined color palette for project visual identification
  const COLOR_PALETTE = [
    '#4361ee', '#3f8efc', '#7b2d8b', '#f72585',
    '#4cc9f0', '#06d6a0', '#fb5607', '#ffbe0b',
  ];

  /* ── CRUD ────────────────────────────────────────────────── */
  function getAll()          { return Storage.getAll(COLLECTION); } //Retrieves all projects from storage
  function getProjectById(id)           { return Storage.get(COLLECTION, id); } //Gets a single project by ID
  function createProjet(data)      { return Storage.create(COLLECTION, data); } //Creates a new project
  function updateProject(id, data)  { return Storage.update(COLLECTION, id, data); }//Updates an existing project
  function removeProject(id)        { return Storage.remove(COLLECTION, id); }//Removes an existing project

  /* ── Helpers ─────────────────────────────────────────────── */
  function getProjectName(id) {
    const p = get(id);
    return p ? p.name : '—';
  }//Gets a project's name by ID, returns fallback if not found

  function colorDot(project) {
    const color = project ? project.color : '#ccc';
    return <span class="project-dot" style="background:${color}"></span>;
  }//Generates HTML for a colored dot representing a project

  function randomColor() {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }//Selects a random color from the predefined palette

  return { getAll, get, create, update, remove, getName, colorDot, randomColor, PALETTE };
})();