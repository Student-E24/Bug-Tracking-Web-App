/**
 * people.js – People logic
 */
const People = (() => {
  const COLLECTION = 'people';

  const ROLES = [
    { id: 'developer', label: 'Developer' },
    { id: 'designer',  label: 'Designer'  },
    { id: 'tester',    label: 'Tester'    },
    { id: 'manager',   label: 'Manager'   },
    { id: 'devops',    label: 'DevOps'    },
  ];

  /* ── CRUD ────────────────────────────────────────────────── */
  function getAll()          { return Storage.getAll(COLLECTION); }
  function get(id)           { return Storage.get(COLLECTION, id); }
  function create(data)      { return Storage.create(COLLECTION, data); }
  function update(id, data)  { return Storage.update(COLLECTION, id, data); }
  function remove(id)        { return Storage.remove(COLLECTION, id); }

  /* ── Helpers ─────────────────────────────────────────────── */
  function fullName(person) {
    if (!person) return '';
    return [person.name, person.surname].filter(Boolean).join(' ');
  }

  function initials(name) {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  function avatarHtml(person, size = 32) {
    if (person && person.profilePicture) {
      return `<img class="avatar-img" src="${person.profilePicture}" alt="${fullName(person)}" style="width:${size}px;height:${size}px;" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'avatar-circle',style:'width:${size}px;height:${size}px;',textContent:'${initials(fullName(person)) || '?'}'}))">`;
    }
    const text = person ? (initials(fullName(person)) || '?') : '?';
    return `<span class="avatar-circle" style="width:${size}px;height:${size}px;">${text}</span>`;
  }

  function getName(id) {
    const p = get(id);
    return p ? fullName(p) || p.name : '—';
  }

  function roleMeta(id) {
    return ROLES.find(r => r.id === id) || { id, label: id };
  }

  return { getAll, get, create, update, remove, initials, avatarHtml, fullName, getName, roleMeta, ROLES };
})();