window.app = (() => {
  let activePage = 'dashboard';
  const SIDEBAR_STATE_KEY = 'submission_sidebar_collapsed';
  const NOTIFICATIONS_KEY = 'submission_notifications';
  const SETTINGS_KEY = 'submission_settings';
  const FILTERS_KEY = 'submission_issue_filters';
  const MAX_NOTIFICATIONS = 30;
  const DEFAULT_FILTERS = {
    status: '',
    priority: '',
    projectId: '',
    overdueOnly: false,
  };
  
  const DEFAULT_SETTINGS = {
    displayName: 'Admin User',
    email: 'submission@bugtrack.io',
    defaultProjectId: '',
    defaultAssigneeId: '',
    notificationsEnabled: true,
  };

  function init() {
    activePage = document.body.dataset.page || 'dashboard';

    Seed.run();
    Issues.checkOverdue();

    applySettingsToSidebar();
    applySavedSidebarState();
    wireSharedActions();
    renderPage();
  }

  function wireSharedActions() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => renderPage(searchInput.value));
    }

    const newIssueButton = document.getElementById('btn-new-issue');
    if (newIssueButton) {
      newIssueButton.addEventListener('click', () => Forms.openIssueForm());
    }

    wireNotificationsCenter();
    wireFilterPanel();

    document.addEventListener('keydown', handleShortcuts);
  }

  function handleShortcuts(event) {
    const modifier = event.ctrlKey || event.metaKey;
    if (!modifier) return;

    const key = event.key.toLowerCase();

    if (key === 'b') {
      event.preventDefault();
      toggleSidebar();
      return;
    }

    if (key === 'f') {
      const searchInput = document.getElementById('search-input');
      if (!searchInput) return;
      event.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  }

  function applySavedSidebarState() {
    const layout = document.querySelector('.app-layout');
    if (!layout) return;

    if (localStorage.getItem(SIDEBAR_STATE_KEY) === '1') {
      layout.classList.add('sidebar-collapsed');
    }
  }

  function toggleSidebar() {
    const layout = document.querySelector('.app-layout');
    if (!layout) return;

    const collapsed = layout.classList.toggle('sidebar-collapsed');
    localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? '1' : '0');
  }

  function getFilters() {
    try {
      const raw = localStorage.getItem(FILTERS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ...DEFAULT_FILTERS,
        ...(parsed && typeof parsed === 'object' ? parsed : {}),
        overdueOnly: Boolean(parsed?.overdueOnly),
      };
    } catch (error) {
      return { ...DEFAULT_FILTERS };
    }
  }

  function saveFilters(nextFilters) {
    const merged = {
      ...DEFAULT_FILTERS,
      ...nextFilters,
      overdueOnly: Boolean(nextFilters.overdueOnly),
    };
    localStorage.setItem(FILTERS_KEY, JSON.stringify(merged));
    return merged;
  }

  function countActiveFilters(filters) {
    return [filters.status, filters.priority, filters.projectId].filter(Boolean).length + (filters.overdueOnly ? 1 : 0);
  }

  function applyIssueFilters(issues) {
    const filters = getFilters();
    const today = new Date().toISOString().split('T')[0];

    return issues.filter(issue => {
      if (filters.status && issue.status !== filters.status) return false;
      if (filters.priority && issue.priority !== filters.priority) return false;
      if (filters.projectId && issue.projectId !== filters.projectId) return false;
      if (filters.overdueOnly) {
        const isOverdue = issue.status === 'overdue' || (issue.status !== 'resolved' && issue.targetDate && issue.targetDate < today);
        if (!isOverdue) return false;
      }
      return true;
    });
  }

  function ensureFilterPanel() {
    const trigger = document.getElementById('btn-filter');
    if (!trigger) return { trigger: null, panel: null };

    const container = trigger.closest('.top-bar-right');
    if (!container) return { trigger: null, panel: null };

    let panel = document.getElementById('filter-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'filter-panel';
      panel.className = 'filter-panel';
      container.appendChild(panel);
    }

    return { trigger, panel };
  }

  function renderFilterPanel() {
    const { trigger, panel } = ensureFilterPanel();
    if (!trigger || !panel) return;

    const filters = getFilters();
    const projects = Projects.getAll();
    const activeCount = countActiveFilters(filters);

    const projectOptions = projects
      .map(project => `<option value="${project.id}" ${filters.projectId === project.id ? 'selected' : ''}>${project.name}</option>`)
      .join('');

    panel.innerHTML = `
      <div class="filter-panel-header">
        <strong>Filter Issues</strong>
      </div>
      <div class="filter-panel-body">
        <label class="filter-row">
          <span>Status</span>
          <select class="form-select" id="filter-status">
            <option value="">All</option>
            ${Issues.STATUSES.map(s => `<option value="${s.id}" ${filters.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
          </select>
        </label>
        <label class="filter-row">
          <span>Priority</span>
          <select class="form-select" id="filter-priority">
            <option value="">All</option>
            ${Issues.PRIORITIES.map(p => `<option value="${p.id}" ${filters.priority === p.id ? 'selected' : ''}>${p.label}</option>`).join('')}
          </select>
        </label>
        <label class="filter-row">
          <span>Project</span>
          <select class="form-select" id="filter-project">
            <option value="">All</option>
            ${projectOptions}
          </select>
        </label>
        <label class="filter-check-row">
          <input type="checkbox" id="filter-overdue" ${filters.overdueOnly ? 'checked' : ''}>
          <span>Overdue only</span>
        </label>
      </div>
      <div class="filter-panel-footer">
        <button type="button" class="btn btn-outline btn-sm" id="btn-clear-filters">Clear</button>
        <button type="button" class="btn btn-primary btn-sm" id="btn-apply-filters">Apply</button>
      </div>
    `;

    trigger.classList.toggle('has-active-filter', activeCount > 0);

  //persn 2 add your code here. and after delete the comment.

  //person 3 add your code here. and after delete the comment.

  
  })();

document.addEventListener('DOMContentLoaded', app.init);