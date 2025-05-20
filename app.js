  /** @format */

  document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const addTaskModal = document.getElementById('add-task-modal');
    const taskDetailModal = document.getElementById('task-detail-modal');
    const mainAddBtn = document.getElementById('main-add-btn');
    const columnAddBtns = document.querySelectorAll('.add-task-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const closeDetailModalBtn = document.getElementById('close-detail-modal');
    const closeDetailBtn = document.getElementById('close-detail-btn');
    const cancelTaskBtn = document.getElementById('cancel-task');
    const submitTaskBtn = document.getElementById('submit-task');
    const taskForm = document.getElementById('task-form');
    const taskColumnInput = document.getElementById('task-column');
    const assigneeOptions = document.querySelectorAll('.assignee-option');
    const taskDetailContent = document.getElementById('task-detail-content');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const tasksLink = document.getElementById('tasks-link');
    const pageTitle = document.getElementById('page-title');

    // Task data and selected assignees
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
    let selectedAssignees = [];

    // Initialize the board with saved tasks
    function initializeBoard() {
      // Clear all columns first
      document.getElementById('todo-tasks').innerHTML = '';
      document.getElementById('done-tasks').innerHTML = '';

      // Load tasks from localStorage
      tasks = JSON.parse(localStorage.getItem('tasks')) || [];
      completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];

      // Add tasks to the appropriate columns
      tasks.forEach((task) => {
        createTaskCard(task, false);
      });

      // Only show the 5 most recent completed tasks initially
      const recentCompletedTasks = [...completedTasks]
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5);

      recentCompletedTasks.forEach((task) => {
        // Make sure the column is set to 'done' for completed tasks
        task.column = 'done';
        createTaskCard(task, false);
      });

      // Add "View History" button if there are more completed tasks
      if (completedTasks.length > 5) {
        const viewHistoryBtn = document.createElement('div');
        viewHistoryBtn.className = 'view-history-btn';
        viewHistoryBtn.innerHTML = `
      <button class="btn-view-history">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        View All History (${completedTasks.length})
      </button>
    `;
        document.getElementById('done-tasks').appendChild(viewHistoryBtn);

        // Add event listener to view history button
        viewHistoryBtn
          .querySelector('.btn-view-history')
          .addEventListener('click', showTaskHistory);
      }
    }

    // Save tasks to localStorage
    function saveTasks() {
      localStorage.setItem('tasks', JSON.stringify(tasks));
      localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }

    // Show task history modal
    function showTaskHistory() {
      // Create history modal if it doesn't exist
      if (!document.getElementById('task-history-modal')) {
        const historyModal = document.createElement('div');
        historyModal.className = 'modal-overlay';
        historyModal.id = 'task-history-modal';

        historyModal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Task History</h2>
          <button class="modal-close" id="close-history-modal">×</button>
        </div>
        <div class="modal-body">
          <div class="task-history-filters">
            <select id="history-filter" class="form-select" style="width: auto; margin-bottom: 15px;">
              <option value="all">All Categories</option>
              <option value="design">Design and planning</option>
              <option value="Operations">Operations</option>
              <option value="marketing">Marketing</option>
              <option value="Maintenance">Maintenance and Projects</option>
            </select>
            <div class="task-history-search">
              <input type="text" id="history-search" class="form-input" placeholder="Search tasks..." style="width: 200px;">
            </div>
          </div>
          <div id="task-history-list" style="max-height: 400px; overflow-y: auto;"></div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" id="close-history-btn">Close</button>
        </div>
      </div>
    `;

        document.body.appendChild(historyModal);

        // Add event listeners for history modal
        document
          .getElementById('close-history-modal')
          .addEventListener('click', () => {
            document
              .getElementById('task-history-modal')
              .classList.remove('active');
          });

        document
          .getElementById('close-history-btn')
          .addEventListener('click', () => {
            document
              .getElementById('task-history-modal')
              .classList.remove('active');
          });

        document
          .getElementById('history-filter')
          .addEventListener('change', updateHistoryList);
        document
          .getElementById('history-search')
          .addEventListener('input', updateHistoryList);

        // Close on click outside
        historyModal.addEventListener('click', (e) => {
          if (e.target === historyModal) {
            historyModal.classList.remove('active');
          }
        });
      }

      // Show the modal and populate with tasks
      document.getElementById('task-history-modal').classList.add('active');
      updateHistoryList();
    }

    // Update the history list based on filters and search
    function updateHistoryList() {
      const historyList = document.getElementById('task-history-list');
      const filterValue = document.getElementById('history-filter').value;
      const searchValue = document
        .getElementById('history-search')
        .value.toLowerCase();

      // Sort completed tasks by completion date (newest first)
      const sortedTasks = [...completedTasks].sort(
        (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
      );

      // Filter tasks based on category and search term
      const filteredTasks = sortedTasks.filter((task) => {
        const matchesCategory =
          filterValue === 'all' || task.category === filterValue;
        const matchesSearch =
          task.title.toLowerCase().includes(searchValue) ||
          task.company.toLowerCase().includes(searchValue) ||
          task.description.toLowerCase().includes(searchValue);
        return matchesCategory && matchesSearch;
      });

      // Clear the list
      historyList.innerHTML = '';

      // Add tasks to the list
      if (filteredTasks.length === 0) {
        historyList.innerHTML =
          '<div style="padding: 20px; text-align: center; color: #888;">No completed tasks found</div>';
      } else {
        filteredTasks.forEach((task) => {
          const completedDate = new Date(task.completedAt);
          const formattedDate = completedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          const taskItem = document.createElement('div');
          taskItem.className = 'task-history-item';
          taskItem.style.cssText =
            'padding: 15px; border-bottom: 1px solid #f0f0f0; cursor: pointer;';
          taskItem.dataset.taskId = task.id;

          taskItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <div>
            <span class="task-tag ${task.category}" style="margin-right: 8px;">${
            task.category.charAt(0).toUpperCase() + task.category.slice(1)
          }</span>
            <strong>${task.title}</strong>
          </div>
          <div style="color: #888; font-size: 12px;">Completed: ${formattedDate}</div>
        </div>
        <div style="color: #666; font-size: 14px; margin-bottom: 5px;">${
          task.company
        }</div>
        <div style="display: flex; align-items: center; gap: 15px; font-size: 12px; color: #888;">
          <div>
            <span class="priority-dot ${
              task.priority
            }" style="display: inline-block;"></span>
            ${
              task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
            } Priority
          </div>
          <div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; margin-right: 4px;">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Due: ${formatDate(task.dueDate)}
          </div>
        </div>
      `;

          // Add click event to view task details
          taskItem.addEventListener('click', () => {
            openTaskDetailModal(task.id, true);
            document
              .getElementById('task-history-modal')
              .classList.remove('active');
          });

          historyList.appendChild(taskItem);
        });
      }
    }
    // Event listeners for opening the modal
    mainAddBtn.addEventListener('click', () => {
      openModal('todo');
    });

    // Add event listeners for column add buttons
    columnAddBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const column = btn.getAttribute('data-column');
        openModal(column);
      });
    });

    // Event listeners for closing the modal
    closeModalBtn.addEventListener('click', closeModal);
    cancelTaskBtn.addEventListener('click', closeModal);

    // Close modal when clicking outside
    addTaskModal.addEventListener('click', (e) => {
      if (e.target === addTaskModal) {
        closeModal();
      }
    });

    // Add keyboard event listener to close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && addTaskModal.classList.contains('active')) {
        closeModal();
      }
    });

    

    // Handle assignee selection
    assigneeOptions.forEach((option) => {
      option.addEventListener('click', () => {
        const assigneeId = option.getAttribute('data-id');

        // Toggle selection
        if (option.classList.contains('selected')) {
          // Remove from selected
          option.classList.remove('selected');
          selectedAssignees = selectedAssignees.filter((id) => id !== assigneeId);
        } else {
          // Add to selected
          option.classList.add('selected');
          selectedAssignees.push(assigneeId);
        }
      });
    });

    // Add CSS for the view history button
    const style = document.createElement('style');
    style.textContent = `
    .btn-view-history {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border: 1px dashed #ccc;
    border-radius: 8px;
    padding: 12px;
    margin-top: 10px;
    color: #666;
    cursor: pointer;
    font-size: 14px;
    gap: 8px;
    transition: background-color 0.2s;
    }
    
    .btn-view-history:hover {
    background-color: #f0f0f5;
    color: #6366f1;
    }
    
    .task-history-filters {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    align-items: center;
    }
    
    .task-history-item:hover {
    background-color: #f8f9fa;
    }
    `;
    document.head.appendChild(style);

    // Open modal function
    function openModal(column = 'todo') {
      taskColumnInput.value = column;
      addTaskModal.classList.add('active');
      // Reset form
      taskForm.reset();
      selectedAssignees = [];
      assigneeOptions.forEach((option) => option.classList.remove('selected'));
      // Set today's date as default
      document.getElementById('task-due-date').valueAsDate = new Date();
    }

    // Open task detail modal
    function openTaskDetailModal(taskId, isCompleted = false) {
      const taskArray = isCompleted ? completedTasks : tasks;
      const task = taskArray.find((t) => t.id === taskId);
      if (!task) return;

      // Initialize comments array if it doesn't exist
      if (!task.comments) {
        task.comments = [];
      }

      // Format the due date for display
      const dueDate = new Date(task.dueDate);
      const formattedDate = dueDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      // Create task detail content
      taskDetailContent.innerHTML = `
    <div class="task-detail-header">
    <div>
      <div class="task-tag ${task.category}">${
        task.category.charAt(0).toUpperCase() + task.category.slice(1)
      }</div>
      <h1 class="task-detail-title">${task.title}</h1>
    </div>
    </div>
    
    <div class="task-detail-meta">
    <div class="task-detail-meta-item">
      <span class="task-detail-meta-label">Company:</span>
      <span class="task-detail-meta-value">${task.company}</span>
    </div>
    <div class="task-detail-meta-item">
      <span class="task-detail-meta-label">Priority:</span>
      <span class="task-detail-meta-value">
        <span class="priority-dot ${task.priority}"></span>
        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
      </span>
    </div>
    <div class="task-detail-meta-item">
      <span class="task-detail-meta-label">Due Date:</span>
      <span class="task-detail-meta-value">${formattedDate}</span>
    </div>
    <div class="task-detail-meta-item">
      <span class="task-detail-meta-label">Status:</span>
          <span class="task-detail-meta-value">${
            task.column === 'done' ? 'Completed' : 'In Progress'
          }</span>
    </div>
    </div>
    
    <div class="task-detail-content">
    <div class="task-detail-main">
    <div class="task-detail-section">
      <h3 class="task-detail-section-title">Description</h3>
      <div class="task-detail-description">${task.description}</div>
    </div>
    
    <div class="task-detail-section">
      <h3 class="task-detail-section-title">Assignees</h3>
      <div class="task-detail-assignees">
        ${task.assignees
          .map((id) => {
            const assigneeEl = document.querySelector(
              `.assignee-option[data-id="${id}"]`
            );
            if (!assigneeEl) return '';
            const imgSrc = assigneeEl.querySelector('img').src;
            const name = assigneeEl.textContent.trim();
            return `
            <div class="task-detail-assignee">
              <img src="${imgSrc}" alt="${name}">
              ${name}
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
    
    <div class="task-detail-section task-detail-comments">
      <h3 class="task-detail-section-title">Comments</h3>
      <div id="comments-container">
        ${
          task.comments && task.comments.length > 0
            ? task.comments
                .map(
                  (comment) => `
            <div class="task-detail-comment">
              <img src="${comment.avatar}" alt="${
                    comment.author
                  }" class="task-detail-comment-avatar">
              <div class="task-detail-comment-content">
                <div class="task-detail-comment-header">
                  <span class="task-detail-comment-author">${
                    comment.author
                  }</span>
                  <span class="task-detail-comment-time">${formatCommentTime(
                    comment.timestamp
                  )}</span>
                </div>
                <div class="task-detail-comment-text">${comment.text}</div>
              </div>
            </div>
          `
                )
                .join('')
            : `
            <div class="task-detail-comment">
              <img src="images/CM.JPEG" alt="User" class="task-detail-comment-avatar">
              <div class="task-detail-comment-content">
                <div class="task-detail-comment-header">
                  <span class="task-detail-comment-author">Cletus Mubanga</span>
                  <span class="task-detail-comment-time"></span>
                </div>
                <div class="task-detail-comment-text">
                  
                </div>
              </div>
            </div>
          `
        }
      </div>
      
      <div class="task-detail-comment-form">
        <textarea class="task-detail-comment-input" id="comment-input" placeholder="Add a comment..."></textarea>
        <button class="btn-submit" id="post-comment-btn">Post</button>
      </div>
    </div>
    </div>
    
    <div class="task-detail-sidebar">
    <div class="task-detail-section task-detail-activity">
      <h3 class="task-detail-section-title">Activity</h3>
      <div class="task-detail-activity-item">
        <img src="images/CM.JPEG" alt="User" class="task-detail-activity-avatar">
        <div>
          <div class="task-detail-activity-text">
            <strong>Cletus Mubanga</strong> created this task
          </div>
          <div class="task-detail-activity-time">${new Date(
            task.createdAt
          ).toLocaleString()}</div>
        </div>
      </div>
      
      ${
        task.column === 'done'
          ? `
      <div class="task-detail-activity-item">
        <img src="images/CM.JPEG" alt="User" class="task-detail-activity-avatar">
        <div>
          <div class="task-detail-activity-text">
            <strong>Cletus Mubanga</strong> marked this task as done
          </div>
          <div class="task-detail-activity-time">${
            task.completedAt
              ? new Date(task.completedAt).toLocaleString()
              : new Date().toLocaleString()
          }</div>
        </div>
      </div>
      `
          : ''
      }
    </div>
    
    ${
      !isCompleted
        ? `
    <div class="task-detail-section">
      <button class="btn-submit" id="detail-mark-done" data-task-id="${task.id}" style="width: 100%;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        Mark as Done
      </button>
    </div>
    `
        : ''
    }
    </div>
    </div>
    `;

      taskDetailModal.classList.add('active');

      // Add event listener for the mark as done button in the detail view
      const markDoneBtn = document.getElementById('detail-mark-done');
      if (markDoneBtn) {
        markDoneBtn.addEventListener('click', () => {
          const taskId = markDoneBtn.getAttribute('data-task-id');
          markTaskAsDone(taskId);
          closeTaskDetailModal();
        });
      }

      // Add event listener for the post comment button
      const postCommentBtn = document.getElementById('post-comment-btn');
      if (postCommentBtn) {
        postCommentBtn.addEventListener('click', () => {
          const commentInput = document.getElementById('comment-input');
          const commentText = commentInput.value.trim();

          if (commentText) {
            // Create the comment object
            const comment = {
              id: Date.now().toString(),
              author: 'Cletus Mubanga', // Current user (hardcoded for demo)
              avatar: 'images/CM.JPEG', // Current user avatar
              text: commentText,
              timestamp: new Date().toISOString(),
            };

            // Add the comment to the task
            task.comments.push(comment);

            // Save to localStorage
            saveTasks();

            // Update the comments display
            const commentsContainer =
              document.getElementById('comments-container');
            const commentElement = document.createElement('div');
            commentElement.className = 'task-detail-comment';
            commentElement.innerHTML = `
      <img src="${comment.avatar}" alt="${comment.author}" class="task-detail-comment-avatar">
      <div class="task-detail-comment-content">
        <div class="task-detail-comment-header">
          <span class="task-detail-comment-author">${comment.author}</span>
          <span class="task-detail-comment-time">Just now</span>
        </div>
        <div class="task-detail-comment-text">${comment.text}</div>
      </div>
    `;

            // Replace the default comment if it's the first one
            if (task.comments.length === 1) {
              commentsContainer.innerHTML = '';
            }

            commentsContainer.appendChild(commentElement);
            commentInput.value = ''; // Clear the input after posting
          }
        });
      }
    }

    // Format comment time (e.g., "2 hours ago", "5 minutes ago", etc.)
    function formatCommentTime(timestamp) {
      const now = new Date();
      const commentTime = new Date(timestamp);
      const diffMs = now - commentTime;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffDay > 0) {
        return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
      } else if (diffHour > 0) {
        return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
      } else if (diffMin > 0) {
        return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
      } else {
        return 'Just now';
      }
    }

    // Close modal function
    function closeModal() {
      addTaskModal.classList.remove('active');
    }

    // Close task detail modal
    function closeTaskDetailModal() {
      taskDetailModal.classList.remove('active');
    }

    // Event listeners for closing the task detail modal
    document
      .getElementById('close-detail-modal')
      .addEventListener('click', closeTaskDetailModal);
    document
      .getElementById('close-detail-btn')
      .addEventListener('click', closeTaskDetailModal);

    // Close modal when clicking outside
    taskDetailModal.addEventListener('click', (e) => {
      if (e.target === taskDetailModal) {
        closeTaskDetailModal();
      }
    });

    // Add keyboard event listener to close modal with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && taskDetailModal.classList.contains('active')) {
        closeTaskDetailModal();
      }
    });

    // Toggle sidebar
    function toggleSidebar() {
      sidebar.classList.toggle('active');
      document.getElementById('sidebar-overlay').classList.toggle('active');
    }

    // Calculate analytics data
    function calculateAnalytics() {
      const totalTasks = tasks.length + completedTasks.length;
      const completedTasksCount = completedTasks.length;
      const completionRate =
        totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

      // Update completion stats
      document.getElementById(
        'completion-rate'
      ).textContent = `${completionRate}%`;
      document.getElementById(
        'completion-progress'
      ).style.width = `${completionRate}%`;
      document.getElementById('completed-tasks').textContent =
        completedTasksCount;
      document.getElementById('total-tasks').textContent = totalTasks;

      // Combine tasks for analytics
      const allTasks = [...tasks, ...completedTasks];

      // Update priority stats
      document.getElementById('high-priority').textContent = allTasks.filter(
        (task) => task.priority === 'high'
      ).length;
      document.getElementById('medium-priority').textContent = allTasks.filter(
        (task) => task.priority === 'medium'
      ).length;
      document.getElementById('low-priority').textContent = allTasks.filter(
        (task) => task.priority === 'low'
      ).length;

        // Update category stats
      document.getElementById('design-tasks').textContent = allTasks.filter(
        (task) => task.category === 'design'
      ).length;

      document.getElementById('operations-tasks').textContent = allTasks.filter(
        (task) => task.category === 'Operations'
      ).length;

      document.getElementById('marketing-tasks').textContent = allTasks.filter(
        (task) => task.category === 'marketing'
      ).length;

      document.getElementById('maintenance-tasks').textContent = allTasks.filter(
        (task) => task.category === 'Maintenance'
      ).length;



      // Update upcoming tasks
      const upcomingTasksList = document.getElementById('upcoming-tasks-list');
      upcomingTasksList.innerHTML = '';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingTasks = tasks
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5);

      if (upcomingTasks.length === 0) {
        upcomingTasksList.innerHTML =
          '<div style="padding: 20px; text-align: center; color: #888;">No upcoming tasks</div>';
      } else {
        upcomingTasks.forEach((task) => {
          const dueDate = new Date(task.dueDate);
          const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

          const taskEl = document.createElement('div');
          taskEl.className = 'upcoming-task';
          taskEl.innerHTML = `
      <div>
        <div class="upcoming-task-title">${task.title}</div>
        <div class="upcoming-task-meta">${
          task.company
        } • Due ${dueDate.toLocaleDateString()}</div>
      </div>
      <div class="upcoming-task-days">${daysDiff}d</div>
    `;

          upcomingTasksList.appendChild(taskEl);
        });
      }

      // Update team workload
      const teamWorkload = document.getElementById('team-workload');
      teamWorkload.innerHTML = '';

      // Get all assignee IDs from active tasks only
      const allAssigneeIds = tasks.flatMap((task) => task.assignees);

      // Count tasks per assignee
      const assigneeTaskCount = {};
      allAssigneeIds.forEach((id) => {
        assigneeTaskCount[id] = (assigneeTaskCount[id] || 0) + 1;
      });

      // Create team member workload items
      assigneeOptions.forEach((option) => {
        const assigneeId = option.getAttribute('data-id');
        const assigneeImg = option.querySelector('img').src;
        const assigneeName = option.textContent.trim();
        const taskCount = assigneeTaskCount[assigneeId] || 0;

        const memberEl = document.createElement('div');
        memberEl.className = 'team-member';
        memberEl.innerHTML = `
    <img src="${assigneeImg}" alt="${assigneeName}" class="team-member-avatar">
    <div class="team-member-info">
      <div class="team-member-name">${assigneeName}</div>
      <div class="team-member-stats">${taskCount} ${
          taskCount === 1 ? 'task' : 'tasks'
        }</div>
    </div>
    `;

        teamWorkload.appendChild(memberEl);
      });
    }

    // Format date function
    function formatDate(dateString) {
      const date = new Date(dateString);
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    // Create task card function
    function createTaskCard(taskData, saveToStorage = true) {
      const {
        id,
        title,
        company,
        category,
        description,
        priority,
        dueDate,
        assignees,
        column,
      } = taskData;

      // Create task card element
      const taskCard = document.createElement('div');
      taskCard.className = 'task-card fade-in';
      taskCard.dataset.taskId = id;

      // Create task content
      taskCard.innerHTML = `
    <div class="task-tag ${category}">${
        category.charAt(0).toUpperCase() + category.slice(1)
      }</div>
    <div class="task-header">
    <h3 class="task-title">${title}</h3>
    <button class="remove-task-btn" data-task-id="${id}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    </div>
    <div class="task-company">${company}</div>
    <p class="task-description">${description}</p>
    <div class="task-meta">
    <div class="task-priority">
      <div class="priority-dot ${priority}"></div>
      ${priority.charAt(0).toUpperCase() + priority.slice(1)}
    </div>
    <div class="task-due">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      ${formatDate(dueDate)}
    </div>
    </div>
    ${
      column === 'todo'
        ? `
    <button class="done-task-btn" data-task-id="${id}">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
    Mark as Done
    </button>
    `
        : ''
    }
    <div class="task-footer">
    <div class="task-assignees">
      ${assignees
        .map((id) => {
          const assigneeEl = document.querySelector(
            `.assignee-option[data-id="${id}"]`
          );
          if (!assigneeEl) return '';
          const imgSrc = assigneeEl.querySelector('img').src;
          return `<img src="${imgSrc}" alt="Assignee" class="assignee">`;
        })
        .join('')}
    </div>
    <div class="task-stats">
      <div class="stat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        ${taskData.comments ? taskData.comments.length : 0}
      </div>
      <div class="stat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 11 12 14 22 4"></polyline>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
        </svg>
        0/3
      </div>
    </div>
    </div>
    `;

      // Add click event to open task details
      taskCard.addEventListener('click', (e) => {
        // Don't open details if clicking on buttons
        if (
          !e.target.closest('.remove-task-btn') &&
          !e.target.closest('.done-task-btn')
        ) {
          openTaskDetailModal(id, column === 'done');
        }
      });

      // Add task card to appropriate column
      const columnEl = document.getElementById(`${column}-tasks`);
      columnEl.insertBefore(taskCard, columnEl.firstChild);

      // Save to storage if needed
      if (saveToStorage) {
        if (column === 'todo') {
          tasks.push(taskData);
        } else {
          completedTasks.push(taskData);
        }
        saveTasks();
      }
    }

    // Handle task removal
    function removeTask(taskId, isCompleted = false) {
      // Remove from DOM
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.remove();
      }

      // Remove from tasks array
      if (isCompleted) {
        completedTasks = completedTasks.filter((task) => task.id !== taskId);
      } else {
        tasks = tasks.filter((task) => task.id !== taskId);
      }

      // Update localStorage
      saveTasks();

      // Refresh the board to update the history button if needed
      if (isCompleted) {
        initializeBoard();
      }
    }

    // Handle marking task as done
    function markTaskAsDone(taskId) {
      const taskIndex = tasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return;

      // Update task status
      const task = { ...tasks[taskIndex] };
      task.column = 'done';
      task.completedAt = new Date().toISOString();

      // Remove from active tasks
      tasks.splice(taskIndex, 1);

      // Add to completed tasks
      completedTasks.push(task);

      // Remove from current column
      const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
      if (taskElement) {
        taskElement.remove();
      }

      // Update localStorage
      saveTasks();

      // Refresh the board to show the most recent completed tasks
      initializeBoard();
    }

    // Event delegation for remove buttons and done buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.remove-task-btn')) {
        const taskId = e.target
          .closest('.remove-task-btn')
          .getAttribute('data-task-id');
        const isCompleted = e.target.closest('.task-column.done') !== null;
        if (confirm('Are you sure you want to remove this task?')) {
          removeTask(taskId, isCompleted);
        }
      }

      if (e.target.closest('.done-task-btn')) {
        const taskId = e.target
          .closest('.done-task-btn')
          .getAttribute('data-task-id');
        markTaskAsDone(taskId);
      }
    });

    // Add to the script section
    function showCalendarView() {
      pageTitle.textContent = 'Calendar';

      // Create or show calendar view
      let calendarView = document.getElementById('calendar-view');

      if (!calendarView) {
        calendarView = document.createElement('div');
        calendarView.className = 'analytics-container';
        calendarView.id = 'calendar-view';
        document.querySelector('.main-content').appendChild(calendarView);
      }

      // Get current month and year
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Generate calendar HTML
      calendarView.innerHTML = `
    <div class="analytics-card">
    <div class="analytics-card-header">
    <div class="analytics-card-title" style="display: flex; align-items: center; gap: 15px;">
      <button id="prev-month-btn" style="background: none; border: none; cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <h2 id="calendar-month-year">${today.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      })}</h2>
      <button id="next-month-btn" style="background: none; border: none; cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
    </div>
    <div style="padding: 15px 0;">
    <div id="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px;">
      ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .map(
          (day) => `
        <div style="text-align: center; font-weight: 500; padding: 5px; color: #666;">${day}</div>
      `
        )
        .join('')}
      ${generateCalendarDays(currentMonth, currentYear)}
    </div>
    </div>
    </div>
    `;

      // Add event listeners for month navigation
      document.getElementById('prev-month-btn').addEventListener('click', () => {
        const [month, year] = document
          .getElementById('calendar-month-year')
          .textContent.split(' ');
        const date = new Date(`${month} 1, ${year}`);
        date.setMonth(date.getMonth() - 1);
        updateCalendarView(date.getMonth(), date.getFullYear());
      });

      document.getElementById('next-month-btn').addEventListener('click', () => {
        const [month, year] = document
          .getElementById('calendar-month-year')
          .textContent.split(' ');
        const date = new Date(`${month} 1, ${year}`);
        date.setMonth(date.getMonth() + 1);
        updateCalendarView(date.getMonth(), date.getFullYear());
      });

      calendarView.classList.remove('hidden');
    }

    function generateCalendarDays(month, year) {
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const today = new Date();

      let daysHTML = '';

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        daysHTML += `<div style="height: 80px; background-color: #f8f9fa;"></div>`;
      }

      // Add cells for each day of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];

        // Find tasks for this date
        const tasksForDate = [...tasks, ...completedTasks].filter((task) => {
          const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
          return taskDate === dateString;
        });

        const isToday = date.toDateString() === today.toDateString();

        daysHTML += `
    <div class="calendar-day ${isToday ? 'today' : ''}"
    data-date="${dateString}"
    >
    <div class="calendar-day-number">
      ${day}
    </div>
    ${tasksForDate
      .map(
        (task) => `
      <div 
        class="calendar-task"
        style="background-color: ${getCategoryColor(
          task.category
        )}; color: white;"
        data-task-id="${task.id}"
      >
        ${task.title}
      </div>
    `
      )
      .join('')}
    </div>
    `;
      }

      return daysHTML;
    }

    function getCategoryColor(category) {
      const colors = {
        design: '#f97316',
        operations: '#8b5cf6',
        marketing: '#0ea5e9',
        Maintenance: '#ec4899',
      };
      return colors[category] || '#6366f1';
    }

    function updateCalendarView(month, year) {
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      document.getElementById(
        'calendar-month-year'
      ).textContent = `${monthNames[month]} ${year}`;
      document.getElementById('calendar-grid').innerHTML = `
    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      .map(
        (day) => `
    <div style="text-align: center; font-weight: 500; padding: 5px; color: #666;">${day}</div>
    `
      )
      .join('')}
    ${generateCalendarDays(month, year)}
    `;

      // Add click events to task items
      document
        .querySelectorAll('#calendar-grid [data-task-id]')
        .forEach((item) => {
          item.addEventListener('click', (e) => {
            const taskId = e.target.getAttribute('data-task-id');
            const task = [...tasks, ...completedTasks].find(
              (t) => t.id === taskId
            );
            if (task) {
              openTaskDetailModal(taskId, task.column === 'done');
            }
          });
        });
    }

    // Add to the script section
    function showTeamView() {
      pageTitle.textContent = 'Team';

      // Create or show team view
      let teamView = document.getElementById('team-view');

      if (!teamView) {
        teamView = document.createElement('div');
        teamView.className = 'analytics-container';
        teamView.id = 'team-view';
        document.querySelector('.main-content').appendChild(teamView);
      }

      // Get all unique assignees from tasks
      const allAssigneeIds = [
        ...new Set(
          [...tasks, ...completedTasks].flatMap((task) => task.assignees)
        ),
      ];

      teamView.innerHTML = `
    <div class="analytics-card">
    <div class="analytics-card-header">
        <div class="analytics-card-title">Team Members</div>
    <button class="btn-add" id="add-team-member-btn">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      Add Member
    </button>
    </div>
    <div style="padding: 15px 0;">
    <div id="team-members-list">
      ${allAssigneeIds
        .map((id) => {
          const assigneeEl = document.querySelector(
            `.assignee-option[data-id="${id}"]`
          );
          if (!assigneeEl) return '';
          const imgSrc = assigneeEl.querySelector('img').src;
          const name = assigneeEl.textContent.trim();

          // Count tasks for this member
          const taskCount = [...tasks, ...completedTasks].filter((task) =>
            task.assignees.includes(id)
          ).length;

          return `
          <div class="team-member-card">
            <div style="display: flex; align-items: center; gap: 15px;">
              <img src="${imgSrc}" alt="${name}" class="team-member-avatar">
              <div style="flex: 1;">
                <div class="team-member-name">${name}</div>
                <div class="team-member-stats">${taskCount} ${
            taskCount === 1 ? 'task' : 'tasks'
          }</div>
              </div>
              <div class="team-member-actions">
                <button class="assign-team-member-btn" data-id="${id}" style="background: none; border: none; cursor: pointer;">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
    </div>
    </div>
    `;

      // Add event listener for add team member button
      document
        .getElementById('add-team-member-btn')
        .addEventListener('click', showAddTeamMemberModal);

      // Add event listeners for assign buttons
      document.querySelectorAll('.assign-team-member-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const memberId = e.target.closest('button').getAttribute('data-id');
          assignMemberToTask(memberId);
        });
      });

      teamView.classList.remove('hidden');
    }

    function showAddTeamMemberModal() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay active';
      modal.innerHTML = `
    <div class="modal">
    <div class="modal-header">
    <h2 class="modal-title">Add Team Member</h2>
    <button class="modal-close" id="close-add-member-modal">×</button>
    </div>
    <div class="modal-body">
    <form id="add-member-form">
      <div class="form-group">
        <label for="member-name" class="form-label">Name</label>
        <input type="text" id="member-name" class="form-input" placeholder="Enter member name" required>
      </div>
      <div class="form-group">
        <label for="member-role" class="form-label">Role</label>
        <input type="text" id="member-role" class="form-input" placeholder="Enter member role">
      </div>
      <div class="form-group">
        <label for="member-avatar" class="form-label">Avatar URL</label>
        <input type="url" id="member-avatar" class="form-input" placeholder="Enter image URL">
      </div>
    </form>
    </div>
    <div class="modal-footer">
    <button class="btn-cancel" id="cancel-add-member">Cancel</button>
    <button class="btn-submit" id="submit-add-member">Add Member</button>
    </div>
    </div>
    `;


      document.body.appendChild(modal);

      // Close modal handlers
      document
        .getElementById('close-add-member-modal')
        .addEventListener('click', () => {
          modal.remove();
        });

      document
        .getElementById('cancel-add-member')
        .addEventListener('click', () => {
          modal.remove();
        });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      // Submit handler
      document
        .getElementById('submit-add-member')
        .addEventListener('click', () => {
          const name = document.getElementById('member-name').value;
          const role = document.getElementById('member-role').value;
          const avatar =
            document.getElementById('member-avatar').value ||
            `https://randomuser.me/api/portraits/${
              Math.random() > 0.5 ? 'men' : 'women'
            }/${Math.floor(Math.random() * 100)}.jpg`;

          if (!name) {
            alert('Please enter a name');
            return;
          }

          // Generate new ID
          const newId = (
            document.querySelectorAll('.assignee-option').length + 1
          ).toString();

          // Create new assignee option
          const assigneeSelector = document.querySelector('.assignee-selector');
          const newOption = document.createElement('div');
          newOption.className = 'assignee-option';
          newOption.dataset.id = newId;
          newOption.innerHTML = `
    <img src="${avatar}" alt="${name}">
    ${name}
    `;

          assigneeSelector.appendChild(newOption);

          // Add click event for selection
          newOption.addEventListener('click', () => {
            const assigneeId = newOption.getAttribute('data-id');

            // Toggle selection
            if (newOption.classList.contains('selected')) {
              // Remove from selected
              newOption.classList.remove('selected');
              selectedAssignees = selectedAssignees.filter(
                (id) => id !== assigneeId
              );
            } else {
              // Add to selected
              newOption.classList.add('selected');
              selectedAssignees.push(assigneeId);
            }
          });

          // Close modal and refresh team view
          modal.remove();
          showTeamView();
        });
    }

    function assignMemberToTask(memberId) {
      // Show modal to select task
      const modal = document.createElement('div');
      modal.className = 'modal-overlay active';
      modal.innerHTML = `
    <div class="modal">
    <div class="modal-header">
    <h2 class="modal-title">Assign to Task</h2>
    <button class="modal-close" id="close-assign-modal">×</button>
    </div>
    <div class="modal-body">
    <div class="form-group">
      <label class="form-label">Select Task</label>
      <select id="task-to-assign" class="form-select">
        ${tasks
          .map(
            (task) => `
          <option value="${task.id}">${task.title} (${task.company})</option>
        `
          )
          .join('')}
      </select>
    </div>
    </div>
    <div class="modal-footer">
    <button class="btn-cancel" id="cancel-assign">Cancel</button>
    <button class="btn-submit" id="submit-assign">Assign</button>
    </div>
    </div>
    `;

      document.body.appendChild(modal);

      // Close modal handlers
      document
        .getElementById('close-assign-modal')
        .addEventListener('click', () => {
          modal.remove();
        });

      document.getElementById('cancel-assign').addEventListener('click', () => {
        modal.remove();
      });

      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.remove();
        }
      });

      // Submit handler
      document.getElementById('submit-assign').addEventListener('click', () => {
        const taskId = document.getElementById('task-to-assign').value;
        const task = tasks.find((t) => t.id === taskId);

        if (task && !task.assignees.includes(memberId)) {
          task.assignees.push(memberId);
          saveTasks();

          // Update task card if visible
          const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
          if (taskCard) {
            const assigneeEl = document.querySelector(
              `.assignee-option[data-id="${memberId}"]`
            );
            if (assigneeEl) {
              const imgSrc = assigneeEl.querySelector('img').src;
              const assigneesContainer =
                taskCard.querySelector('.task-assignees');
              const newAssignee = document.createElement('img');
              newAssignee.className = 'assignee';
              newAssignee.src = imgSrc;
              assigneesContainer.appendChild(newAssignee);
            }
          }
        }

        modal.remove();
        showTeamView();
      });
    }

    // Handle task form submission
    submitTaskBtn.addEventListener('click', (e) => {
      e.preventDefault();

      // Get form data
      const title = document.getElementById('task-title').value;
      const company = document.getElementById('task-company').value;
      const category = document.getElementById('task-category').value;
      const description = document.getElementById('task-description').value;
      const priority = document.getElementById('task-priority').value;
      const dueDate = document.getElementById('task-due-date').value;
      const column = document.getElementById('task-column').value;

      // Validate required fields
      if (!title) {
        alert('Please enter a task title');
        return;
      }

      if (!dueDate) {
        alert('Please select a due date');
        return;
      }

      // Validate date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(dueDate);

      if (selectedDate < today) {
        alert('Please select a date that is not in the past');
        return;
      }

      // Create task object
      const taskData = {
        id: Date.now().toString(),
        title,
        company: company || 'Unnamed Company',
        category,
        description: description || 'No description provided',
        priority,
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        assignees: selectedAssignees,
        column,
        createdAt: new Date().toISOString(),
      };

      // Create task card
      createTaskCard(taskData);

      // Close modal
      closeModal();
    });

    // Switch between board and analytics views
    function switchView(view) {
      // Update active tab
      document.querySelectorAll('.tab').forEach((tab) => {
        tab.classList.toggle('active', tab.getAttribute('data-view') === view);
      });

      // Update page title
      document.getElementById('page-title').textContent =
        view === 'board' ? 'Tasks' : 'Analytics';

      // Show/hide views
      document
        .getElementById('board-view')
        .classList.toggle('hidden', view !== 'board');
      document
        .getElementById('analytics-view')
        .classList.toggle('hidden', view !== 'analytics');

      // Calculate analytics if needed
      if (view === 'analytics') {
        calculateAnalytics();
      }
    }

    // Handle tab switching
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const view = tab.getAttribute('data-view');
        switchView(view);
      });
    });

    // Show content based on sidebar navigation
    // Update the showContent function
    function showContent(contentType) {
      // Hide all views first
      document.getElementById('board-view').classList.add('hidden');
      document.getElementById('analytics-view').classList.add('hidden');

      // Hide any custom views
      document.querySelectorAll('.analytics-container').forEach((el) => {
        el.classList.add('hidden');
      });

      // Update page title and show appropriate view
      switch (contentType) {
        case 'tasks':
          pageTitle.textContent = 'Tasks';
          document.getElementById('board-view').classList.remove('hidden');
          break;
        case 'analytics':
          pageTitle.textContent = 'Analytics';
          document.getElementById('analytics-view').classList.remove('hidden');
          calculateAnalytics();
          break;
        case 'calendar':
          showCalendarView();
          break;
        case 'team':
          showTeamView();
          break;
        case 'active-tasks':
          showActiveTasksView();
          break;
        case 'home':
        default:
          pageTitle.textContent = 'Dashboard';
          // Could add a dashboard view here
          document.getElementById('board-view').classList.remove('hidden');
          break;
      }

      // Close sidebar on mobile
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('active');
      }
    }

    // Show active tasks view
    function showActiveTasksView() {
      pageTitle.textContent = 'Active Tasks';

      // Create or show active tasks view
      let activeTasksView = document.getElementById('active-tasks-view');

      if (!activeTasksView) {
        activeTasksView = document.createElement('div');
        activeTasksView.className = 'analytics-container';
        activeTasksView.id = 'active-tasks-view';
        document.querySelector('.main-content').appendChild(activeTasksView);
      }

      // Get all active tasks
      const activeTasks = [...tasks];
      const hasActiveTasks = activeTasks.length > 0;

      // Sort tasks by due date (closest first)
      activeTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      activeTasksView.innerHTML = `
    <div class="analytics-card" style="margin-bottom: 20px;">
    <div class="analytics-card-header">
      <div class="analytics-card-title">Active Tasks (${
        activeTasks.length
      })</div>
      <button class="btn-add" id="add-task-btn-list" style="margin: 0; padding: 5px 10px; font-size: 12px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Add Task
      </button>
    </div>
    <div style="padding: 15px 0;">
      ${
        hasActiveTasks
          ? `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #eaeaea;">
              <th style="text-align: left; padding: 10px; font-weight: 500; color: #666;">Task</th>
              <th style="text-align: left; padding: 10px; font-weight: 500; color: #666;">Project</th>
              <th style="text-align: left; padding: 10px; font-weight: 500; color: #666;">Due Date</th>
              <th style="text-align: left; padding: 10px; font-weight: 500; color: #666;">Priority</th>
              <th style="text-align: left; padding: 10px; font-weight: 500; color: #666;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${activeTasks
              .map((task) => {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const daysDiff = Math.ceil(
                  (dueDate - today) / (1000 * 60 * 60 * 24)
                );
                const isOverdue = daysDiff < 0;
                const isToday = daysDiff === 0;

                const formattedDate = dueDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });

                return `
                <tr style="border-bottom: 1px solid #f0f0f0;" data-task-id="${
                  task.id
                }">
                  <td style="padding: 12px 10px;">
                    <div style="font-weight: 500;">${task.title}</div>
                    <div style="font-size: 12px; color: #888;">${
                      task.category
                    }</div>
                  </td>
                  <td style="padding: 12px 10px;">${task.company}</td>
                  <td style="padding: 12px 10px;">
                    <div style="color: ${
                      isOverdue ? '#ef4444' : isToday ? '#f97316' : '#666'
                    };">
                      ${formattedDate}
                      ${isOverdue ? ' (Overdue)' : isToday ? ' (Today)' : ''}
                    </div>
                  </td>
                  <td style="padding: 12px 10px;">
                    <span style="display: inline-flex; align-items: center;">
                      <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${
                        task.priority === 'high'
                          ? '#ef4444'
                          : task.priority === 'medium'
                          ? '#f97316'
                          : '#22c55e'
                      }; margin-right: 6px;"></span>
                      ${
                        task.priority.charAt(0).toUpperCase() +
                        task.priority.slice(1)
                      }
                    </span>
                  </td>
                  <td style="padding: 12px 10px;">
                    <div style="display: flex; gap: 8px;">
                      <button class="done-task-btn-list" data-task-id="${
                        task.id
                      }" style="background-color: #22c55e; color: white; border: none; padding: 5px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        Done
                      </button>
                      <button class="view-task-btn-list" data-task-id="${
                        task.id
                      }" style="background-color: #6366f1; color: white; border: none; padding: 5px 8px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      `
          : `
        <div class="empty-state" style="height: 150px;">
          <div class="empty-state-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div class="empty-state-text">No active tasks available</div>
          <button class="empty-state-btn" id="empty-add-task-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add a new task
          </button>
        </div>
      `
      }
    </div>
    </div>
    `;

      activeTasksView.classList.remove('hidden');

      // Add event listeners for task actions
      document.querySelectorAll('.done-task-btn-list').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const taskId = e.target.getAttribute('data-task-id');
          markTaskAsDone(taskId);
          showActiveTasksView(); // Refresh the view
        });
      });

      document.querySelectorAll('.view-task-btn-list').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const taskId = e.target.getAttribute('data-task-id');
          openTaskDetailModal(taskId);
        });
      });

      // Add task button
      const addTaskBtn = document.getElementById('add-task-btn-list');
      if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
          openModal('todo');
        });
      }

      // Empty state add task button
      const emptyAddTaskBtn = document.getElementById('empty-add-task-btn');
      if (emptyAddTaskBtn) {
        emptyAddTaskBtn.addEventListener('click', () => {
          openModal('todo');
        });
      }

      // Make table rows clickable
      document.querySelectorAll('tr[data-task-id]').forEach((row) => {
        row.addEventListener('click', (e) => {
          if (!e.target.closest('button')) {
            const taskId = row.getAttribute('data-task-id');
            openTaskDetailModal(taskId);
          }
        });
        row.style.cursor = 'pointer';
      });
    }

    // Handle sidebar navigation
    document.querySelectorAll('.sidebar-nav a').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links
        document.querySelectorAll('.sidebar-nav a').forEach((l) => {
          l.classList.remove('active');
        });

        // Add active class to clicked link
        link.classList.add('active');

        // Get the content type from data attribute
        const contentType = link.getAttribute('data-view');

        // Show the appropriate content
        showContent(contentType);
      });
    });

    // Toggle sidebar on mobile
    sidebarToggle.addEventListener('click', toggleSidebar);

    // Initialize the board
    initializeBoard();

    // Set initial view to tasks
    showContent('tasks');
  });
  document.getElementById('logout-btn').addEventListener('click', function () {
  // Perform logout actions here (like clearing tokens or session data)
  window.location.href = 'index.html'; // Redirect to login page
});

