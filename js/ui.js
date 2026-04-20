window.UI = (() => {
  const PROJECTS_COLLAPSED_KEY = 'submission_projects_collapsed';

  // Simple HTML escaping to prevent XSS in rendered content.
  // This improves the overall security.
  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Converts a date value into a short, readable label.
  // This keeps date formatting consistent across the app.
  function formatDate(date) {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  // Renders project links into the left sidebar navigation list.
  // This allows users to jump directly to project-filtered issues.
  function renderSidebarProjects(projects) {
    const list = document.getElementById('sidebar-projects-list');
    if (!list) return;

    list.innerHTML = projects.map(project => `
        <li>
          <a class="nav-link" href="issues.html?project=${encodeURIComponent(project.id)}">
            ${Projects.colorDot(project)}
            ${escapeHtml(project.name)}
          </a>
        </li>
      `).join('');

    wireProjectsSectionToggle();
  }

  // Adds click and keyboard behavior to collapse or expand sidebar projects.
  // This improves navigation accessibility and remembers user preference.
  function wireProjectsSectionToggle() {
    const toggle = document.querySelector('.nav-section-title');
    const list = document.getElementById('sidebar-projects-list');
    if (!toggle || !list) return;

    toggle.setAttribute('role', 'button');
    toggle.setAttribute('tabindex', '0');

    const savedCollapsed = localStorage.getItem(PROJECTS_COLLAPSED_KEY) === '1';
    setProjectsCollapsed(toggle, list, savedCollapsed, false);

    if (toggle.dataset.bound === 'true') return;

    toggle.addEventListener('click', () => {
      const collapsed = list.classList.contains('is-collapsed');
      setProjectsCollapsed(toggle, list, !collapsed, true);
    });

    toggle.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      const collapsed = list.classList.contains('is-collapsed');
      setProjectsCollapsed(toggle, list, !collapsed, true);
    });

    toggle.dataset.bound = 'true';
  }

  // Updates the sidebar project section collapsed state and toggle icon.
  // This keeps visual state and persisted local storage value in sync.
  function setProjectsCollapsed(toggle, list, collapsed, persist) {
    list.classList.toggle('is-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', String(!collapsed));

    const icon = toggle.querySelector('i');
    if (icon) {
      icon.classList.toggle('ph-caret-down', !collapsed);
      icon.classList.toggle('ph-caret-right', collapsed);
    }

    if (persist) {
      localStorage.setItem(PROJECTS_COLLAPSED_KEY, collapsed ? '1' : '0');
    }
  }

  // Counts issues by status for dashboard summary cards.
  // This provides quick progress visibility at a glance.
  function metricCounts(issues) {
    return {
      open: issues.filter(issue => issue.status === 'open').length,
      inProgress: issues.filter(issue => issue.status === 'in-progress').length,
      resolved: issues.filter(issue => issue.status === 'resolved').length,
      overdue: issues.filter(issue => issue.status === 'overdue').length,
    };
  }

  // Builds a short initials label for a person avatar.
  // This ensures a fallback avatar value is always available.
  function personInitials(person) {
    if (!person || !person.name) return '?';
    return People.initials(person.name).slice(0, 2) || '?';
  }

  // Renders the top dashboard metric cards from status counts.
  // This gives users a fast overview of issue workload.
  function renderDashboardMetrics(counts)
   {
    return `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon status-open"><i class="ph ph-bug"></i></div>
            <span class="trend positive"><i class="ph ph-trend-up"></i></span>
          </div>
          <div class="metric-value">${counts.open}</div>
          <div class="metric-label">Open Issues</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon status-in-progress"><i class="ph ph-clock"></i></div>
          </div>
          <div class="metric-value">${counts.inProgress}</div>
          <div class="metric-label">In Progress</div>
        </div>
        <div class="metric-card">
          <div class="metric-header">
            <div class="metric-icon status-resolved"><i class="ph ph-check-circle"></i></div>
            <span class="trend positive"><i class="ph ph-trend-up"></i></span>
          </div>
          <div class="metric-value">${counts.resolved}</div>
          <div class="metric-label">Resolved</div>
        </div>
        <div class="metric-card border-danger">
          <div class="metric-header">
            <div class="metric-icon status-overdue"><i class="ph ph-warning"></i></div>
            <span class="trend negative"><i class="ph ph-trend-down"></i></span>
          </div>
          <div class="metric-value">${counts.overdue}</div>
          <div class="metric-label">Overdue</div>
        </div>
      </div>
    `;
    }

  // Renders the Kanban board columns and issue cards by status.
  // This supports drag-and-drop issue tracking in the dashboard.
  function renderKanbanBoard(issues)
   {
      const columns = [
        { id: 'open', title: 'Open', dot: '#60a5fa' },
        { id: 'in-progress', title: 'In Progress', dot: '#fbd38d' },
        { id: 'resolved', title: 'Resolved', dot: '#4ade80' },
        { id: 'overdue', title: 'Overdue', dot: '#f87171' },
      ];

      return `
        <div class="kanban-board">
          ${columns
            .map(column => {
              const columnIssues = issues.filter(issue => issue.status === column.id);
              return `
                <section class="kanban-column" data-status="${column.id}">
                  <div class="kanban-header">
                    <div class="kanban-title">
                      <span class="project-dot" style="background:${column.dot}"></span>
                      ${column.title}
                      <span class="count">${columnIssues.length}</span>
                    </div>
                    <button class="btn btn-icon-only" data-action="new-issue" aria-label="New issue"><i class="ph ph-plus"></i></button>
                  </div>
                  <div class="kanban-cards" data-status="${column.id}">
                    ${columnIssues
                      .map(issue => {
                        const assignee = issue.assigneeId ? People.get(issue.assigneeId) : null;
                        const project = issue.projectId ? Projects.get(issue.projectId) : null;
                        return `
                          <article class="issue-card" draggable="true" data-issue-id="${issue.id}" data-status="${issue.status}">
                            <div class="issue-card-header">
                              <span class="issue-id">${escapeHtml(issue.id)}</span>
                            </div>
                            <h3 class="issue-title" data-action="view" data-issue-id="${issue.id}">${escapeHtml(issue.summary)}</h3>
                            <div class="issue-meta">
                              ${Issues.priorityBadge(issue.priority)}
                              <span class="issue-project">${escapeHtml(project ? project.name : 'Unassigned')}</span>
                            </div>
                            <div class="issue-footer">
                              <div class="table-assignee">
                                <div class="avatar bg-purple">${escapeHtml(personInitials(assignee))}</div>
                              </div>
                              <div class="issue-date">${escapeHtml(formatDate(issue.targetDate))}</div>
                              <div class="issue-comments"><i class="ph ph-chat-circle"></i>0</div>
                            </div>
                          </div>
                        </article>
                      `;
                    })
                    .join('')}
                </div>
              </section>
            `;
          })
          .join('')}
      </div>
    `;
  }

  // Composes the dashboard section using metrics and Kanban board views.
  // This centralizes the main issue-tracking workspace UI.
  function renderDashboard(issues)
   {
      const counts = metricCounts(issues);

      return `
        ${renderDashboardMetrics(counts)}

        <section>
          <div class="section-header">
            <h2>Issue Board</h2>
            <p class="text-secondary">Drag and drop to update issue status</p>
          </div>
          ${renderKanbanBoard(issues)}
        </section>
      `;
    }

  // Renders the issues table with status, priority, ownership, and actions.
  // This provides a detailed list view for issue management.
  function renderIssuesTable(issues, opts = {})
   {
      const emptyLabel = opts.emptyLabel || 'No issues available.';
      if (!issues.length)
      {
        return `<div class="empty-state">${emptyLabel}</div>`;
      }

      return `
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Target Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${issues
                .map(issue => {
                  const assignee = issue.assigneeId ? People.get(issue.assigneeId) : null;
                  const project = issue.projectId ? Projects.get(issue.projectId) : null;
                  return `
                    <tr data-issue-id="${issue.id}">
                      <td>
                        <div class="issue-cell">
                          <span class="issue-id">${escapeHtml(issue.id)}</span>
                          <a href="#" class="issue-title-link" data-action="view" data-issue-id="${issue.id}">${escapeHtml(issue.summary)}</a>
                        </div>
                        </td>
                        <td>${Issues.statusBadge(issue.status)}</td>
                        <td>${Issues.priorityBadge(issue.priority)}</td>
                        <td>${escapeHtml(project ? project.name : 'Unassigned project')}</td>
                        <td>${escapeHtml(assignee ? assignee.name : 'Unassigned')}</td>
                        <td>${escapeHtml(formatDate(issue.targetDate))}</td>
                        <td>
                        <button class="btn btn-outline btn-sm" data-action="view" data-issue-id="${issue.id}">View</button>
                        <button class="btn btn-primary btn-sm" data-action="edit" data-issue-id="${issue.id}">Edit</button>
                      </td>
                    </tr>
                  `;
                })
              .join('')}
            </tbody>
          </table>
        </div>
      `;
    }

  // Renders project cards and linked issue counts in the projects page.
  // This gives a quick summary of project scope and management actions.
  function renderProjects(projects, issues) {
    return `
      <section>
        <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2>Projects</h2>
            <p class="text-secondary">${projects.length} total projects</p>
          </div>
          <button class="btn btn-outline" id="btn-new-project">New Project</button>
        </div>
        <div class="grid-2">
          ${projects
            .map(project => {
              const projectIssues = issues.filter(issue => issue.projectId === project.id);
              return `
                <article class="project-card">
                  <div class="project-card-header">
                    <div class="project-icon" style="background:${escapeHtml(project.color || '#3b82f6')}">P</div>
                    <div class="project-info">
                      <h3>${escapeHtml(project.name)}</h3>
                      <span class="project-id">${projectIssues.length} linked issues</span>
                    </div>
                  </div>
                  <p class="project-desc">${escapeHtml(project.description || 'No description')}</p>
                  <div style="display:flex;justify-content:flex-end;">
                    <button class="btn btn-outline btn-sm" data-action="delete-project" data-project-id="${escapeHtml(project.id)}">Delete</button>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  }

  // Renders team member cards with assignment and resolution stats.
  // This helps visualize workload distribution across people.
  function renderPeople(people, issues) {
    return `
      <section>
        <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h2>People</h2>
            <p class="text-secondary">${people.length} team members</p>
          </div>
          <button class="btn btn-outline" id="btn-new-person">Add Person</button>
        </div>
        <div class="grid-3">
          ${people
            .map(person => {
              const assigned = issues.filter(issue => issue.assigneeId === person.id);
              return `
                <article class="person-card">
                  <div class="person-card-header">
                    <div class="avatar bg-purple">${escapeHtml(People.initials(person.name || '?'))}</div>
                    <div class="person-info">
                      <h3>${escapeHtml(person.name)}</h3>
                      <span class="person-username">${escapeHtml(People.roleMeta(person.role).label)}</span>
                    </div>
                  </div>
                  <div class="person-email">${escapeHtml(person.email || '')}</div>
                  <div class="person-stats">
                    <div class="stat">
                      <strong>${assigned.length}</strong>
                      <span>Assigned</span>
                    </div>
                    <div class="stat">
                      <strong>${assigned.filter(issue => issue.status === 'resolved').length}</strong>
                      <span>Resolved</span>
                    </div>
                  </div>
                  <div style="display:flex;justify-content:flex-end;">
                    <button class="btn btn-outline btn-sm" data-action="delete-person" data-person-id="${escapeHtml(person.id)}">Delete</button>
                  </div>
                </article>
              `;
            })
            .join('')}
        </div>
      </section>
    `;
  }

  // Wires delete actions for project and person management buttons.
  // This connects UI interactions to the provided page handlers.
  function wireManagementActions(root, handlers = {}) {
    root.querySelectorAll('[data-action="delete-project"]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        if (handlers.onDeleteProject) {
          handlers.onDeleteProject(button.dataset.projectId);
        }
      });
    });

    root.querySelectorAll('[data-action="delete-person"]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        if (handlers.onDeletePerson) {
          handlers.onDeletePerson(button.dataset.personId);
        }
      });
    });
  }

  // Renders the settings form with profile defaults and notification toggle.
  // This centralizes editable user preferences in one section.
  function renderSettings(settings, projects, people) {
    const projectOptions = projects
      .map(project => `<option value="${project.id}" ${settings.defaultProjectId === project.id ? 'selected' : ''}>${escapeHtml(project.name)}</option>`)
      .join('');

    const peopleOptions = people
      .map(person => `<option value="${person.id}" ${settings.defaultAssigneeId === person.id ? 'selected' : ''}>${escapeHtml(person.name)}</option>`)
      .join('');

    return `
      <section class="settings-container">
        <div class="settings-section">
          <h2 class="settings-header"><i class="ph ph-user-gear"></i>Profile & Defaults</h2>
          <form id="settings-form" class="form-grid-2">
            <div class="form-group">
              <label>Display Name</label>
              <input class="form-input" name="displayName" value="${escapeHtml(settings.displayName)}">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-input" name="email" value="${escapeHtml(settings.email)}">
            </div>
            <div class="form-group">
              <label>Default Project</label>
              <select class="form-select" name="defaultProjectId">
                <option value="">None</option>
                ${projectOptions}
              </select>
            </div>
            <div class="form-group">
              <label>Default Assignee</label>
              <select class="form-select" name="defaultAssigneeId">
                <option value="">Unassigned</option>
                ${peopleOptions}
              </select>
            </div>
            <div class="form-group full settings-toggle-row">
              <label for="setting-notifications-enabled">Enable Bell Notifications</label>
              <input id="setting-notifications-enabled" type="checkbox" name="notificationsEnabled" ${settings.notificationsEnabled ? 'checked' : ''}>
            </div>
            <div class="form-group full" style="display:flex;gap:12px;justify-content:flex-end;">
              <button type="button" class="btn btn-outline" id="btn-reset-settings">Reset Defaults</button>
              <button type="submit" class="btn btn-primary">Save Settings</button>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  // Attaches save and reset behavior for the settings form.
  // This converts form state into payloads for app-level handlers.
  function wireSettingsActions(root, handlers = {}) {
    const form = root.querySelector('#settings-form');
    if (!form) return;

    form.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.notificationsEnabled = form.querySelector('#setting-notifications-enabled')?.checked ?? true;
      if (handlers.onSave) handlers.onSave(data);
    });

    const resetBtn = root.querySelector('#btn-reset-settings');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (handlers.onReset) handlers.onReset();
      });
    }
  }

  // Wires view and edit actions in issue table rows.
  // This opens the corresponding modal based on user clicks.
  function wireIssueTableActions(root) {
    root.querySelectorAll('[data-action="view"]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        Forms.openIssueDetail(button.dataset.issueId);
      });
    });

    root.querySelectorAll('[data-action="edit"]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        Forms.openIssueForm(button.dataset.issueId);
      });
    });
  }

  // Wires dashboard interactions including viewing, creation, and drag-drop.
  // This updates issue status in real time and refreshes the UI.
  function wireDashboardActions(root) {
    let draggingIssueId = null;

    root.querySelectorAll('[data-action="view"]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        Forms.openIssueDetail(button.dataset.issueId);
      });
    });

    root.querySelectorAll('[data-action="new-issue"]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        Forms.openIssueForm();
      });
    });

    root.querySelectorAll('.issue-card[draggable="true"]').forEach(card => {
      card.addEventListener('dragstart', event => {
        draggingIssueId = card.dataset.issueId;
        card.classList.add('dragging');
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', draggingIssueId || '');
        }
      });

      card.addEventListener('dragend', () => {
        draggingIssueId = null;
        card.classList.remove('dragging');
        root.querySelectorAll('.kanban-cards').forEach(zone => zone.classList.remove('drag-over'));
      });
    });

    root.querySelectorAll('.kanban-cards').forEach(zone => {
      zone.addEventListener('dragover', event => {
        event.preventDefault();
        zone.classList.add('drag-over');
      });

      zone.addEventListener('dragleave', event => {
        if (!zone.contains(event.relatedTarget)) {
          zone.classList.remove('drag-over');
        }
      });

      zone.addEventListener('drop', event => {
        event.preventDefault();
        zone.classList.remove('drag-over');

        const droppedIssueId = draggingIssueId || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : '');
        const nextStatus = zone.dataset.status;
        if (!droppedIssueId || !nextStatus) return;

        const currentIssue = Issues.get(droppedIssueId);
        if (!currentIssue || currentIssue.status === nextStatus) return;

        const updatePayload = { status: nextStatus };
        if (nextStatus === 'resolved' && !currentIssue.actualDate) {
          updatePayload.actualDate = new Date().toISOString().split('T')[0];
        }

        Issues.update(droppedIssueId, updatePayload);
        const statusLabel = Issues.statusMeta(nextStatus).label;
        const issueSummary = (currentIssue.summary || '').trim();
        const shortSummary = issueSummary.length > 42 ? `${issueSummary.slice(0, 42)}...` : issueSummary;
        const issueLabel = shortSummary ? `${currentIssue.id} - ${shortSummary}` : currentIssue.id;
        app.notify(`${issueLabel} moved to ${statusLabel}`, 'info');
        app.refresh();
      });
    });
  }

  return {
    renderSidebarProjects,
    renderDashboard,
    renderIssuesTable,
    renderProjects,
    renderPeople,
    renderSettings,
    wireManagementActions,
    wireIssueTableActions,
    wireDashboardActions,
    wireSettingsActions,
    formatDate,
    escapeHtml,
  };
})();
