//Manages team members, their roles, and avatar generation.
const People = (() => {
  const COLLECTION = 'people';
    // Available roles for team members
  const ROLES = [
    { id: 'developer', label: 'Developer' },
    { id: 'designer',  label: 'Designer'  },
    { id: 'tester',    label: 'Tester'    },
    { id: 'manager',   label: 'Manager'   },
    { id: 'devops',    label: 'DevOps'    },
  ];

  /* ── CRUD ────────────────────────────────────────────────── */
  function getAll()          { return Storage.getAll(COLLECTION); } //retrieves all people from storage
  function getPersonById(id)           { return Storage.get(COLLECTION, id); } // Gets a single person by ID
  function createPerson(data)      { return Storage.create(COLLECTION, data); }//Creates a new person
  function updatePerson(id, data)  { return Storage.update(COLLECTION, id, data); } //Updates an existing person
  function removePerson(id)        { return Storage.remove(COLLECTION, id); } //Deletes a person by ID

  /* ── Helpers ─────────────────────────────────────────────── */
  function initials(name) {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }//Extracts initials from a person's name
//Generates HTML for an avatar circle
  function avatarHtml(person) {
    const text = person ? initials(person.name) : '?';
    return <span class="avatar-circle">${text}</span>;
  }
// Gets a person's name by ID, returns fallback if not found
  function getName(id) {
    const p = get(id);
    return p ? p.name : '—';
  }
// Gets metadata for a role ID
  function roleMeta(id) {
    return ROLES.find(r => r.id === id) || { id, label: id };
  }

  return { getAll, get, create, update, remove, initials, avatarHtml, getName, roleMeta, ROLES };
})();