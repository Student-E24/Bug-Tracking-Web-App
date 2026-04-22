/**
 * issues.js - Issue domain logic for submission app.
 */
const Issues = (() => {
  const COLLECTION = 'issues';

  const STATUSES = [
    { id: 'open', label: 'Open', colorClass: 'status-open' },
    { id: 'in-progress', label: 'In Progress', colorClass: 'status-in-progress' },
    { id: 'resolved', label: 'Resolved', colorClass: 'status-resolved' },
    { id: 'overdue', label: 'Overdue', colorClass: 'status-overdue' },
  ];

  const PRIORITIES = [
    { id: 'low', label: 'Low', colorClass: 'priority-low' },
    { id: 'medium', label: 'Medium', colorClass: 'priority-medium' },
    { id: 'high', label: 'High', colorClass: 'priority-high' },
  ];

  const TYPES = [
    { id: 'bug', label: 'Bug' },
    { id: 'feature', label: 'Feature' },
    { id: 'task', label: 'Task' },
    { id: 'improvement', label: 'Improvement' },
  ];
  function getAll() {
    return Storage.getAll(COLLECTION);
  }

  function get(id) {
    return Storage.get(COLLECTION, id);
  }

  function create(data) {
    return Storage.create(COLLECTION, normalizeIssueInput(data));
  }

  function update(id, data) {
    const normalized = normalizeIssueInput(data, true);
    const saved = Storage.update(COLLECTION, id, normalized);
    if (saved && saved.status === 'resolved' && !saved.actualDate) {
      return Storage.update(COLLECTION, id, { actualDate: todayDate() });
    }
    return saved;
  }

  function remove(id) {
    return Storage.remove(COLLECTION, id);
  }

  function byStatus(status) {
    return Storage.query(COLLECTION, issue => issue.status === status);
  }

  function byProject(projectId) {
    return Storage.query(COLLECTION, issue => issue.projectId === projectId);
  }

  function byAssignee(assigneeId) {
    return Storage.query(COLLECTION, issue => issue.assigneeId === assigneeId);
  }

  function search(term) {
    const value = (term || '').trim().toLowerCase();
    if (!value) return getAll();
    return Storage.query(COLLECTION, issue =>
      (issue.summary || '').toLowerCase().includes(value) ||
      (issue.description || '').toLowerCase().includes(value) ||
      (issue.stepsToReproduce || '').toLowerCase().includes(value) ||
      (issue.expectedResult || '').toLowerCase().includes(value) ||
      (issue.actualResult || '').toLowerCase().includes(value) ||
      (issue.tags || []).some(tag => String(tag).toLowerCase().includes(value))
    );
  }

  function checkOverdue() {
    const today = todayDate();
    getAll().forEach(issue => {
      if (
        issue.status !== 'resolved' &&
        issue.targetDate &&
        issue.targetDate < today &&
        issue.status !== 'overdue'
      ) {
        Storage.update(COLLECTION, issue.id, { status: 'overdue' });
      }
    });
  }

  function statusMeta(id) {
    return STATUSES.find(item => item.id === id) || STATUSES[0];
  }

  function priorityMeta(id) {
    return PRIORITIES.find(item => item.id === id) || PRIORITIES[1];
  }

  function typeMeta(id) {
    return TYPES.find(item => item.id === id) || TYPES[0];
  }

  function statusBadge(status) {
    const meta = statusMeta(status);
    return `<span class="badge status-badge ${meta.colorClass}">${meta.label}</span>`;
  }

  function priorityBadge(priority) {
    const meta = priorityMeta(priority);
    return `<span class="badge priority-badge ${meta.colorClass}">${meta.label}</span>`;
  }

  function normalizeIssueInput(data, isUpdate = false) {
    const normalized = {
      summary: (data.summary || '').trim(),
      description: (data.description || '').trim(),
      stepsToReproduce: (data.stepsToReproduce || '').trim(),
      expectedResult: (data.expectedResult || '').trim(),
      actualResult: (data.actualResult || '').trim(),
      identifiedDate: data.identifiedDate || todayDate(),
      targetDate: data.targetDate || '',
      actualDate: data.actualDate || '',
      resolutionSummary: (data.resolutionSummary || '').trim(),
      status: data.status || 'open',
      priority: data.priority || 'medium',
      type: data.type || 'bug',
      projectId: data.projectId || '',
      assigneeId: data.assigneeId || '',
      tags: Array.isArray(data.tags)
        ? data.tags
        : String(data.tags || '')
            .split(',')
            .map(tag => tag.trim())
            .filter(Boolean),
    };

    if (!isUpdate) {
      return normalized;
    }

    return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== undefined));
  }

  function todayDate() {
    return new Date().toISOString().split('T')[0];
  }

  return {
    getAll,
    get,
    create,
    update,
    remove,
    byStatus,
    byProject,
    byAssignee,
    search,
    checkOverdue,
    statusMeta,
    priorityMeta,
    typeMeta,
    statusBadge,
    priorityBadge,
    STATUSES,
    PRIORITIES,
    TYPES,
  };
})();