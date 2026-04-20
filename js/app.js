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
  //add you part here after the comment and then remove the comment.

  //persn 2 add your code here. and after delete the comment.

  //person 3 add your code here. and after delete the comment.

  
  })();

document.addEventListener('DOMContentLoaded', app.init);