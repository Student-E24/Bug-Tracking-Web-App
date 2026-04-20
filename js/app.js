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

  //persn 2 add your code here. and after delete the comment.

  //person 3 add your code here. and after delete the comment.

  
  })();

document.addEventListener('DOMContentLoaded', app.init);