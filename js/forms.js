window.Forms = (() => {
  const container = document.getElementById('modals-container');

  // Closes the active modal and clears the modal container after the fade-out.
  // This keeps modal transitions smooth while removing stale content.
  function closeModal() {
    const backdrop = container.querySelector('.modal-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    setTimeout(() => {
      container.innerHTML = '';
    }, 200);
  }

  // Creates a reusable modal shell and wires submit, close, and cancel actions.
  // This centralizes modal behavior so forms stay consistent across the app.
  function openModal(title, bodyHtml, footerHtml = '', onSubmit = null) {
    container.innerHTML = `
      <div class="modal-backdrop">
        <div class="modal-content modal-content-lg">
          <div class="modal-header">
            <h2>${UI.escapeHtml(title)}</h2>
            <button class="close-btn" type="button" aria-label="Close">x</button>
          </div>
          <form id="modal-form">
            <div class="modal-body">${bodyHtml}</div>
            <div class="modal-footer">
              ${footerHtml || `
                <button type="button" class="btn btn-outline" id="btn-cancel">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              `}
            </div>
          </form>
        </div>
      </div>
    `;

    const backdrop = container.querySelector('.modal-backdrop');
    void container.offsetWidth;
    backdrop.classList.add('open');

    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) closeModal();
    });

    container.querySelector('.close-btn').addEventListener('click', closeModal);

    const cancel = container.querySelector('#btn-cancel');
    if (cancel) cancel.addEventListener('click', closeModal);

    if (onSubmit) {
      container.querySelector('#modal-form').addEventListener('submit', event => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        onSubmit(data);
      });
    }

    document.addEventListener('keydown', escHandler);
  }

  // Handles Escape key presses to close the currently open modal.
  // This gives users a quick keyboard shortcut for dismissing dialogs.
  function escHandler(event) {
    if (event.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  }

  // Builds the issue form body with project, person, and field options.
  // This keeps issue creation and editing markup in one place.
  function issueFormBody(issue = null) {
    const projects = Projects.getAll();
    const people = People.getAll();

    const projectOptions = projects
      .map(project => `<option value="${project.id}" ${issue && issue.projectId === project.id ? 'selected' : ''}>${UI.escapeHtml(project.name)}</option>`)
      .join('');

    const peopleOptions = people
      .map(person => `<option value="${person.id}" ${issue && issue.assigneeId === person.id ? 'selected' : ''}>${UI.escapeHtml(person.name)}</option>`)
      .join('');

    const statusOptions = Issues.STATUSES
      .map(status => `<option value="${status.id}" ${issue && issue.status === status.id ? 'selected' : ''}>${status.label}</option>`)
      .join('');

    const priorityOptions = Issues.PRIORITIES
      .map(priority => `<option value="${priority.id}" ${issue && issue.priority === priority.id ? 'selected' : ''}>${priority.label}</option>`)
      .join('');

    const typeOptions = Issues.TYPES
      .map(type => `<option value="${type.id}" ${issue && issue.type === type.id ? 'selected' : ''}>${type.label}</option>`)
      .join('');

    return `
      <div class="form-grid-2">
        <div class="form-group full">
          <label>Summary *</label>
          <input class="form-input" name="summary" required value="${UI.escapeHtml(issue ? issue.summary : '')}">
        </div>
        <div class="form-group full">
          <label>Description *</label>
          <textarea class="form-textarea" name="description" rows="3" required>${UI.escapeHtml(issue ? issue.description : '')}</textarea>
        </div>
        <div class="form-group full">
          <label>Steps To Reproduce *</label>
          <textarea class="form-textarea" name="stepsToReproduce" rows="2" required>${UI.escapeHtml(issue ? issue.stepsToReproduce : '')}</textarea>
        </div>
        <div class="form-group full">
          <label>Expected Result *</label>
          <textarea class="form-textarea" name="expectedResult" rows="2" required>${UI.escapeHtml(issue ? issue.expectedResult : '')}</textarea>
        </div>
        <div class="form-group full">
          <label>Actual Result *</label>
          <textarea class="form-textarea" name="actualResult" rows="2" required>${UI.escapeHtml(issue ? issue.actualResult : '')}</textarea>
        </div>

        <div class="form-group">
          <label>Project *</label>
          <select class="form-select" name="projectId" required>
            <option value="">Select project</option>
            ${projectOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Assignee</label>
          <select class="form-select" name="assigneeId">
            <option value="">Unassigned</option>
            ${peopleOptions}
          </select>
        </div>

        <div class="form-group">
          <label>Status *</label>
          <select class="form-select" name="status" required>${statusOptions}</select>
        </div>
        <div class="form-group">
          <label>Priority *</label>
          <select class="form-select" name="priority" required>${priorityOptions}</select>
        </div>

        <div class="form-group">
          <label>Type *</label>
          <select class="form-select" name="type" required>${typeOptions}</select>
        </div>
        <div class="form-group">
          <label>Tags (comma separated)</label>
          <input class="form-input" name="tags" value="${UI.escapeHtml(issue ? (issue.tags || []).join(', ') : '')}">
        </div>

        <div class="form-group">
          <label>Identified Date *</label>
          <input type="date" class="form-input" name="identifiedDate" required value="${UI.escapeHtml(issue ? issue.identifiedDate : new Date().toISOString().split('T')[0])}">
        </div>
        <div class="form-group">
          <label>Target Date *</label>
          <input type="date" class="form-input" name="targetDate" required value="${UI.escapeHtml(issue ? issue.targetDate : '')}">
        </div>

        <div class="form-group">
          <label>Actual Date</label>
          <input type="date" class="form-input" name="actualDate" value="${UI.escapeHtml(issue ? issue.actualDate : '')}">
        </div>
        <div class="form-group full">
          <label>Resolution Summary</label>
          <textarea class="form-textarea" name="resolutionSummary" rows="2">${UI.escapeHtml(issue ? issue.resolutionSummary : '')}</textarea>
        </div>
      </div>
    `;
  }

  // Opens the issue form in create or edit mode and saves the result.
  // This routes the submitted data to the correct issue handler.
  function openIssueForm(issueId = null) {
    const issue = issueId ? Issues.get(issueId) : null;
    openModal(issue ? 'Edit Issue' : 'Create Issue', issueFormBody(issue), '', data => {
      if (issue) {
        Issues.update(issue.id, data);
        app.notify('Issue updated', 'success');
      } else {
        Issues.create(data);
        app.notify('Issue created', 'success');
      }
      closeModal();
      app.refresh();
    });
  }

  // Opens a read-only issue detail modal with linked project and assignee info.
  // This gives users a quick full view before editing or closing.
  function openIssueDetail(issueId) {
    const issue = Issues.get(issueId);
    if (!issue) return;

    const assignee = issue.assigneeId ? People.get(issue.assigneeId) : null;
    const project = issue.projectId ? Projects.get(issue.projectId) : null;

    const body = `
      <div class="detail-grid">
        <div class="detail-item full">
          <h3>${UI.escapeHtml(issue.summary)}</h3>
          <p class="text-secondary">${UI.escapeHtml(issue.description)}</p>
        </div>
        <div class="detail-item"><label>Status</label><div>${Issues.statusBadge(issue.status)}</div></div>
        <div class="detail-item"><label>Priority</label><div>${Issues.priorityBadge(issue.priority)}</div></div>
        <div class="detail-item"><label>Type</label><div>${UI.escapeHtml(Issues.typeMeta(issue.type).label)}</div></div>
        <div class="detail-item"><label>Project</label><div>${UI.escapeHtml(project ? project.name : 'Unassigned')}</div></div>
        <div class="detail-item"><label>Assignee</label><div>${UI.escapeHtml(assignee ? assignee.name : 'Unassigned')}</div></div>
        <div class="detail-item"><label>Identified Date</label><div>${UI.escapeHtml(UI.formatDate(issue.identifiedDate))}</div></div>
        <div class="detail-item"><label>Target Date</label><div>${UI.escapeHtml(UI.formatDate(issue.targetDate))}</div></div>
        <div class="detail-item"><label>Actual Date</label><div>${UI.escapeHtml(UI.formatDate(issue.actualDate))}</div></div>
        <div class="detail-item full"><label>Steps To Reproduce</label><p>${UI.escapeHtml(issue.stepsToReproduce)}</p></div>
        <div class="detail-item full"><label>Expected Result</label><p>${UI.escapeHtml(issue.expectedResult)}</p></div>
        <div class="detail-item full"><label>Actual Result</label><p>${UI.escapeHtml(issue.actualResult)}</p></div>
        <div class="detail-item full"><label>Resolution Summary</label><p>${UI.escapeHtml(issue.resolutionSummary || 'Not provided')}</p></div>
      </div>
    `;

    openModal(
      'Issue Details',
      body,
      `
        <button type="button" class="btn btn-outline" id="btn-cancel">Close</button>
        <button type="button" class="btn btn-primary" id="btn-edit-issue">Edit Issue</button>
      `
    );

    container.querySelector('#btn-edit-issue').addEventListener('click', () => {
      closeModal();
      openIssueForm(issueId);
    });
  }

  // Builds and opens the project creation form with color picker sync.
  // This keeps project setup simple while preserving a valid color value.
  function openProjectForm() {
    const defaultColor = Projects.randomColor();
    const body = `
      <div class="form-group">
        <label>Project Name *</label>
        <input class="form-input" name="name" required>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea class="form-textarea" name="description" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>Color</label>
        <div class="project-color-row">
          <input type="color" class="project-color-picker" id="project-color-picker" value="${defaultColor}" aria-label="Pick project color">
          <input class="form-input project-color-hex" id="project-color-hex" name="color" value="${defaultColor}" pattern="^#([A-Fa-f0-9]{6})$" title="Use hex color format like #3b82f6">
        </div>
      </div>
    `;

    openModal('Create Project', body, '', data => {
      const normalizedColor = /^#([A-Fa-f0-9]{6})$/.test(String(data.color || '').trim())
        ? String(data.color).trim()
        : defaultColor;

      data.color = normalizedColor;
      Projects.create(data);
      app.notify('Project created', 'success');
      closeModal();
      app.refresh();
    });

    const colorPicker = container.querySelector('#project-color-picker');
    const colorHexInput = container.querySelector('#project-color-hex');

    if (colorPicker && colorHexInput) {
      colorPicker.addEventListener('input', () => {
        colorHexInput.value = colorPicker.value;
      });

      colorHexInput.addEventListener('input', () => {
        const value = colorHexInput.value.trim();
        if (/^#([A-Fa-f0-9]{6})$/.test(value)) {
          colorPicker.value = value;
        }
      });
    }
  }

  // Builds and opens the team member form for adding a new person.
  // This keeps user creation focused on the required profile fields.
  function openPersonForm() {
    const roleOptions = People.ROLES
      .map(role => `<option value="${role.id}">${role.label}</option>`)
      .join('');

    const body = `
      <div class="form-group">
        <label>Full Name *</label>
        <input class="form-input" name="name" required>
      </div>
      <div class="form-group">
        <label>Email *</label>
        <input type="email" class="form-input" name="email" required>
      </div>
      <div class="form-group">
        <label>Role *</label>
        <select class="form-select" name="role" required>${roleOptions}</select>
      </div>
    `;

    openModal('Add Team Member', body, '', data => {
      People.create(data);
      app.notify('Team member added', 'success');
      closeModal();
      app.refresh();
    });
  }

  return {
    openIssueForm,
    openIssueDetail,
    openProjectForm,
    openPersonForm,
    closeModal,
  };
})();
