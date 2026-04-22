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

  /*
   * =========================================
   * App startup, shared actions, and sidebar
   * =========================================
   */

  function init() {
    activePage = document.body.dataset.page || 'dashboard';

    if (!Auth.requireAuth()) return;

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

    const logoutButton = document.getElementById('btn-logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', () => Auth.logout());
    }

    wireNotificationsCenter();
    wireFilterPanel();
    renderShortcutToolkit();

    document.addEventListener('keydown', handleShortcuts);
  }

  function handleShortcuts(event) {
    const modifier = event.ctrlKey || event.metaKey;
    if (!modifier) return;

    const target = event.target;
    const isTypingField = target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    );
    if (isTypingField && event.key.toLowerCase() !== 'b') return;

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

  function renderShortcutToolkit() {
    if (document.getElementById('shortcut-toolkit')) return;

    const toolkit = document.createElement('div');
    toolkit.id = 'shortcut-toolkit';
    toolkit.setAttribute('aria-label', 'Keyboard shortcuts');
    toolkit.style.display = 'inline-flex';
    toolkit.style.alignItems = 'center';
    toolkit.style.gap = '10px';
    toolkit.style.padding = '6px 10px';
    toolkit.style.borderRadius = '999px';
    toolkit.style.border = '1px solid #dbe4ff';
    toolkit.style.background = '#eef4ff';
    toolkit.style.color = '#0f172a';
    toolkit.style.fontSize = '12px';
    toolkit.style.fontWeight = '600';
    toolkit.style.whiteSpace = 'nowrap';
    toolkit.innerHTML = '<span>Find: Ctrl/Cmd + F</span><span>Sidebar: Ctrl/Cmd + B</span>';

    const topBarRight = document.querySelector('.top-bar-right');
    if (topBarRight) {
      topBarRight.prepend(toolkit);
      return;
    }

    // Fallback if top bar is not present.
    toolkit.style.position = 'fixed';
    toolkit.style.right = '16px';
    toolkit.style.bottom = '16px';
    toolkit.style.zIndex = '999';
    toolkit.style.boxShadow = '0 8px 24px rgba(2, 6, 23, 0.25)';
    document.body.appendChild(toolkit);
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

  /*
   * =========================================
   * Issue filters and filter panel behavior
   * =========================================
   */

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
    // Toggle visual indicator for active filters on the filter button
    trigger.classList.toggle('has-active-filter', activeCount > 0);

    const clearFilterBtn = panel.querySelector('#btn-clear-filters');
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => {
        saveFilters(DEFAULT_FILTERS);
        panel.classList.remove('open');
        renderFilterPanel();
        renderPage(document.getElementById('search-input')?.value || '');
      });
    }

    const applyFilterBtn = panel.querySelector('#btn-apply-filters');
    if (applyFilterBtn) {
      applyFilterBtn.addEventListener('click', () => {
        saveFilters({
          status: panel.querySelector('#filter-status')?.value || '',
          priority: panel.querySelector('#filter-priority')?.value || '',
          projectId: panel.querySelector('#filter-project')?.value || '',
          overdueOnly: Boolean(panel.querySelector('#filter-overdue')?.checked),
        });
        panel.classList.remove('open');
        renderFilterPanel();
        renderPage(document.getElementById('search-input')?.value || '');
      });
    }
  }
    // Sets up the filter panel toggle behavior and click-outside-to-close functionality
  function setupFilterPanel() {
    const { trigger, panel } = ensureFilterPanel();
    if (!trigger || !panel) return;
    
    if (trigger.dataset.bound === 'true') {
      renderFilterPanel();
      return;
    }

    trigger.addEventListener('click', event => {
      event.stopPropagation();
      renderFilterPanel();
      panel.classList.toggle('open');
    });

    document.addEventListener('click', event => {
      if (panel.contains(event.target) || trigger.contains(event.target)) return;
      panel.classList.remove('open');
    });

    trigger.dataset.bound = 'true';
    renderFilterPanel();
  }

  function wireFilterPanel() {
    setupFilterPanel();
  }

    /*
   * =========================================
   * Settings, notifications, rendering, refresh
   * =========================================
   */

// Retrieves user settings from localStorage with fallback defaults
  function loadUserSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        ...DEFAULT_SETTINGS,
        ...(parsed && typeof parsed === 'object' ? parsed : {}),
        notificationsEnabled: parsed?.notificationsEnabled !== false,
      };
    } catch (error) {
      return { ...DEFAULT_SETTINGS };
    }
  }
// Saves user settings to localStorage
  function StoreUserSettings(nextSettings) {
    const merged = {
      ...DEFAULT_SETTINGS,
      ...nextSettings,
      notificationsEnabled: nextSettings.notificationsEnabled !== false,
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  }
// Updates sidebar UI elements with current user settings (name, email, avatar)
  function applySettingsToSidebar() {
    const settings = getSettings();

    const nameEl = document.querySelector('.user-name');
    if (nameEl) {
      nameEl.textContent = settings.displayName || DEFAULT_SETTINGS.displayName;
    }

    const emailEl = document.querySelector('.user-email');
    if (emailEl) {
      emailEl.textContent = settings.email || DEFAULT_SETTINGS.email;
    }

    const avatarEl = document.querySelector('.user-profile .avatar');
    if (avatarEl) {
      const initials = People.initials(settings.displayName || DEFAULT_SETTINGS.displayName).slice(0, 2) || 'AD';
      avatarEl.textContent = initials;
    }
  }
// Fetches notification list from localStorage
  function getNotifications() {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }
// Saves notifications to localStorage (limited to MAX_NOTIFICATIONS)
  function saveNotifications(items) {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
  }
// Converts ISO timestamp to readable time format (e.g., "2:30 PM")
  function formatTime(isoTime) {
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) return 'Just now';

    return date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
// Returns appropriate icon class based on notification type
  function iconForType(type) {
    if (type === 'error') return 'ph-warning-circle';
    if (type === 'info') return 'ph-info';
    return 'ph-check-circle';
  }
// Creates or retrieves the notifications panel DOM elements
  function setupNotificationsPanel() {
    const trigger = document.getElementById('btn-notifications');
    if (!trigger) return { trigger: null, panel: null, badge: null };

    const container = trigger.closest('.top-bar-right');
    const badge = document.getElementById('notification-badge');
    if (!container || !badge) return { trigger: null, panel: null, badge: null };

    let panel = document.getElementById('notification-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'notification-panel';
      panel.className = 'notification-panel';
      container.appendChild(panel);
    }

    return { trigger, panel, badge };
  }

  function ensureNotificationsPanel() {
    return setupNotificationsPanel();
  }
// Renders the notifications panel UI with the current notifications
  function renderNotificationsPanel() {
    const { panel, badge } = ensureNotificationsPanel();
    if (!panel || !badge) return;

    const notifications = getNotifications();
    badge.textContent = String(notifications.length);
    badge.hidden = notifications.length === 0;
// Shows empty state if there are no notifications
    if (!notifications.length) {
      panel.innerHTML = `
        <div class="notification-header">
          <strong>Notifications</strong>
        </div>
        <div class="notification-empty">No updates yet.</div>
      `;
      return;
    }
// Renders the list of notifications
    panel.innerHTML = `
      <div class="notification-header">
        <strong>Notifications</strong>
        <button class="btn btn-outline btn-sm" id="btn-clear-notifications">Clear</button>
      </div>
      <div class="notification-list">
        ${notifications
          .map(item => `
            <div class="notification-item">
              <i class="ph ${iconForType(item.type)}"></i>
              <div class="notification-copy">
                <p>${item.message}</p>
                <span>${formatTime(item.time)}</span>
              </div>
            </div>
          `)
          .join('')}
      </div>
    `;

    const clearBtn = document.getElementById('btn-clear-notifications');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        saveNotifications([]);
        renderNotificationsPanel();
      });
    }
  }
// Initializes the notification center with click handlers
  function  InitializeNotificationsCenter() {
    const { trigger, panel } = ensureNotificationsPanel();
    if (!trigger || !panel) return;

    if (trigger.dataset.bound === 'true') {
      renderNotificationsPanel();
      return;
    }

    trigger.addEventListener('click', event => {
      event.stopPropagation();
      panel.classList.toggle('open');
    });

    document.addEventListener('click', event => {
      if (panel.contains(event.target) || trigger.contains(event.target)) return;
      panel.classList.remove('open');
    });

    trigger.dataset.bound = 'true';
    renderNotificationsPanel();
  }

  function wireNotificationsCenter() {
    InitializeNotificationsCenter();
  }

  function getSettings() {
    return loadUserSettings();
  }

  function saveSettings(nextSettings) {
    return StoreUserSettings(nextSettings);
  }

  function notify(message, type = 'success') {
    if (!getSettings().notificationsEnabled) return;

    const current = getNotifications();
    const next = [{ message, type, time: new Date().toISOString() }, ...current].slice(0, MAX_NOTIFICATIONS);
    saveNotifications(next);
    renderNotificationsPanel();
  }

  function renderPage(searchTerm = '') {
    const view = document.getElementById('view-container');
    if (!view) return;

    const issues = searchTerm ? Issues.search(searchTerm) : Issues.getAll();
    const filteredIssues = applyIssueFilters(issues);
    const people = People.getAll();
    const projects = Projects.getAll();

    renderFilterPanel();
    UI.renderSidebarProjects(projects);

    if (activePage === 'dashboard') {
      view.innerHTML = UI.renderDashboard(filteredIssues);
      UI.wireDashboardActions(view);
      return;
    }

    if (activePage === 'issues') {
      const params = new URLSearchParams(window.location.search);
      const project = params.get('project');
      const filtered = project ? filteredIssues.filter(issue => issue.projectId === project) : filteredIssues;
      view.innerHTML = `
        <section>
          <div class="section-header">
            <h2>All Issues</h2>
            <p class="text-secondary">${filtered.length} issues shown</p>
          </div>
          ${UI.renderIssuesTable(filtered)}
        </section>
      `;
      UI.wireIssueTableActions(view);
      return;
    }

    if (activePage === 'projects') {
      view.innerHTML = UI.renderProjects(projects, issues);
      const newProjectButton = document.getElementById('btn-new-project');
      if (newProjectButton) {
        newProjectButton.addEventListener('click', () => Forms.openProjectForm());
      }

      UI.wireManagementActions(view, {
        onDeleteProject: projectId => {
          const project = Projects.get(projectId);
          if (!project) return;

          const linkedIssues = Issues.getAll().filter(issue => issue.projectId === projectId);
          const warning = linkedIssues.length
            ? `Delete project "${project.name}"? ${linkedIssues.length} linked issue(s) will be unassigned.`
            : `Delete project "${project.name}"?`;

          if (!window.confirm(warning)) return;

          linkedIssues.forEach(issue => {
            Issues.update(issue.id, { projectId: '' });
          });

          Projects.remove(projectId);
          notify(`Project "${project.name}" deleted`, 'info');
          refresh();
        },
      });
      return;
    }

    if (activePage === 'people') {
      view.innerHTML = UI.renderPeople(people, issues);
      const newPersonButton = document.getElementById('btn-new-person');
      if (newPersonButton) {
        newPersonButton.addEventListener('click', () => Forms.openPersonForm());
      }

      UI.wireManagementActions(view, {
        onDeletePerson: personId => {
          const person = People.get(personId);
          if (!person) return;

          const assignedIssues = Issues.getAll().filter(issue => issue.assigneeId === personId);
          const warning = assignedIssues.length
            ? `Delete person "${person.name}"? ${assignedIssues.length} assigned issue(s) will become unassigned.`
            : `Delete person "${person.name}"?`;

          if (!window.confirm(warning)) return;

          assignedIssues.forEach(issue => {
            Issues.update(issue.id, { assigneeId: '' });
          });

          People.remove(personId);
          notify(`Person "${person.name}" deleted`, 'info');
          refresh();
        },
      });
      return;
    }

    if (activePage === 'settings') {
      const settings = getSettings();
      view.innerHTML = UI.renderSettings(settings, projects, people);
      UI.wireSettingsActions(view, {
        onSave: nextSettings => {
          const saved = saveSettings(nextSettings);
          applySettingsToSidebar();
          if (saved.notificationsEnabled) {
            notify('Settings saved', 'success');
          }
          renderPage();
        },
        onReset: () => {
          saveSettings(DEFAULT_SETTINGS);
          applySettingsToSidebar();
          notify('Settings reset to defaults', 'info');
          renderPage();
        },
      });
    }
  }

  function refresh() {
    Issues.checkOverdue();
    renderPage(document.getElementById('search-input')?.value || '');
  }

  return {
    init,
    refresh,
    toggleSidebar,
    notify,
  };
})();

document.addEventListener('DOMContentLoaded', app.init);
