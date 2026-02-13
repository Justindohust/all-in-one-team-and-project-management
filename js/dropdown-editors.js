/**
 * Dropdown Editors - Inline dropdown editors for table cells
 */

// Show assignee dropdown
function showAssigneeDropdown(assigneeEl, item) {
  const rect = assigneeEl.getBoundingClientRect();

  const users = [
    { id: 1, name: 'John Doe', avatar: 'JD' },
    { id: 2, name: 'Alice Smith', avatar: 'AS' },
    { id: 3, name: 'Mike Kim', avatar: 'MK' },
    { id: 4, name: 'Tina Nguyen', avatar: 'TN' },
    { id: 5, name: 'Sarah Johnson', avatar: 'SJ' }
  ];

  const dropdown = document.createElement('div');
  dropdown.style.cssText = `position:fixed;top:${rect.bottom+5}px;left:${rect.left}px;background:#1e293b;border:1px solid #334155;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);z-index:1000;min-width:200px;max-height:300px;overflow-y:auto;padding:4px`;

  const unassign = document.createElement('div');
  unassign.style.cssText = 'padding:8px 12px;cursor:pointer;border-radius:4px;font-size:13px;color:#94a3b8;border-bottom:1px solid #334155;margin-bottom:4px';
  unassign.textContent = '✕ Unassign';
  unassign.onmouseenter = () => unassign.style.background = '#334155';
  unassign.onmouseleave = () => unassign.style.background = '';
  unassign.onclick = async () => {
    await saveAssigneeChange(item, item.assignee, null);
    dropdown.remove();
  };
  dropdown.appendChild(unassign);

  users.forEach(user => {
    const opt = document.createElement('div');
    opt.style.cssText = 'padding:8px 12px;cursor:pointer;border-radius:4px;font-size:13px;display:flex;align-items:center;gap:8px';
    opt.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;font-weight:600">${user.avatar}</div><span style="color:#e2e8f0">${user.name}</span>`;
    opt.onmouseenter = () => opt.style.background = '#334155';
    opt.onmouseleave = () => opt.style.background = '';
    opt.onclick = async () => {
      await saveAssigneeChange(item, item.assignee, user.name);
      dropdown.remove();
    };
    dropdown.appendChild(opt);
  });

  document.body.appendChild(dropdown);
  setTimeout(() => {
    document.addEventListener('click', function close(e) {
      if (!dropdown.contains(e.target) && e.target !== assigneeEl) {
        dropdown.remove();
        document.removeEventListener('click', close);
      }
    });
  }, 10);
}

async function saveAssigneeChange(item, oldValue, newValue) {
  try {
    const typeMap = { 'PROJECT': 'projects', 'MODULE': 'modules', 'SUBMODULE': 'submodules', 'TASK': 'tasks' };
    const response = await api.request(`/${typeMap[item.type]}/${item.realId}`, {
      method: 'PUT',
      body: JSON.stringify({ assignee: newValue })
    });
    if (response.success) {
      item.assignee = newValue;
      await logActivity(item, 'assignee', oldValue || 'Unassigned', newValue || 'Unassigned');
      renderTableView();
      showNotification('Success', 'Assignee updated', 'success');
    } else {
      throw new Error(response.message || 'Failed');
    }
  }catch (error) {
    console.error('Error:', error);
    showNotification('Error', 'Failed to update assignee', 'error');
  }
}

function showPriorityDropdown(priorityEl, item) {
  const rect = priorityEl.getBoundingClientRect();
  const priorities = [
    { value: 'urgent', label: 'Urgent', icon: '🔴' },
    { value: 'high', label: 'High', icon: '🟠' },
    { value: 'medium', label: 'Medium', icon: '🟡' },
    { value: 'low', label: 'Low', icon: '🟢' }
  ];

  const dropdown = document.createElement('div');
  dropdown.style.cssText = `position:fixed;top:${rect.bottom+5}px;left:${rect.left}px;background:#1e293b;border:1px solid #334155;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);z-index:1000;min-width:150px;padding:4px`;

  priorities.forEach(p => {
    const opt = document.createElement('div');
    opt.style.cssText = 'padding:8px 12px;cursor:pointer;border-radius:4px;font-size:13px;display:flex;align-items:center;gap:8px;color:#e2e8f0';
    opt.innerHTML = `<span>${p.icon}</span><span>${p.label}</span>`;
    opt.onmouseenter = () => opt.style.background = '#334155';
    opt.onmouseleave = () => opt.style.background = '';
    opt.onclick = async () => {
      await savePriorityChange(item, item.priority, p.label);
      dropdown.remove();
    };
    dropdown.appendChild(opt);
  });

  document.body.appendChild(dropdown);
  setTimeout(() => {
    document.addEventListener('click', function close(e) {
      if (!dropdown.contains(e.target) && e.target !== priorityEl) {
        dropdown.remove();
        document.removeEventListener('click', close);
      }
    });
  }, 10);
}

async function savePriorityChange(item, oldValue, newValue) {
  try {
    const typeMap = { 'PROJECT': 'projects', 'MODULE': 'modules', 'SUBMODULE': 'submodules', 'TASK': 'tasks' };
    const response = await api.request(`/${typeMap[item.type]}/${item.realId}`, {
      method: 'PUT',
      body: JSON.stringify({ priority: newValue.toLowerCase() })
    });
    if (response.success) {
      item.priority = newValue;
      await logActivity(item, 'priority', oldValue, newValue);
      renderTableView();
      showNotification('Success', 'Priority updated', 'success');
    } else {
      throw new Error(response.message || 'Failed');
    }
  } catch (error) {
    console.error('Error:', error);
    showNotification('Error', 'Failed to update priority', 'error');
  }
}

function showDatePicker(dateEl, item) {
  const rect = dateEl.getBoundingClientRect();
  const field = dateEl.dataset.field;

  const picker = document.createElement('div');
  picker.style.cssText = `position:fixed;top:${rect.bottom+5}px;left:${rect.left}px;background:#1e293b;border:1px solid #334155;border-radius:8px;box-shadow:0 10px 25px rgba(0,0,0,0.5);z-index:1000;padding:12px;min-width:250px`;

  const input = document.createElement('input');
  input.type = 'date';
  input.value = item[field] || '';
  input.style.cssText = 'width:100%;padding:8px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:4px;font-size:13px';
  picker.appendChild(input);

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex;gap:8px;margin-top:8px';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.style.cssText = 'flex:1;padding:6px 12px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px';
  saveBtn.onclick = async () => {
    await saveDateChange(item, field, item[field], input.value);
    picker.remove();
  };

  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.style.cssText = 'padding:6px 12px;background:#475569;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px';
  clearBtn.onclick = async () => {
    await saveDateChange(item, field, item[field], null);
    picker.remove();
  };

  btnContainer.appendChild(saveBtn);
  btnContainer.appendChild(clearBtn);
  picker.appendChild(btnContainer);
  document.body.appendChild(picker);
  input.focus();

  setTimeout(() => {
    document.addEventListener('click', function close(e) {
      if (!picker.contains(e.target) && e.target !== dateEl) {
        picker.remove();
        document.removeEventListener('click', close);
      }
    });
  }, 10);
}

async function saveDateChange(item, field, oldValue, newValue) {
  try {
    const typeMap = { 'PROJECT': 'projects', 'MODULE': 'modules', 'SUBMODULE': 'submodules', 'TASK': 'tasks' };
    const fieldMap = { 'startDate': 'start_date', 'finishDate': 'due_date' };
    const response = await api.request(`/${typeMap[item.type]}/${item.realId}`, {
      method: 'PUT',
      body: JSON.stringify({ [fieldMap[field] || field]: newValue })
    });
    if (response.success) {
      item[field] = newValue;
      await logActivity(item, field, oldValue || 'Not set', newValue || 'Not set');
      renderTableView();
      showNotification('Success', 'Date updated', 'success');
    } else {
      throw new Error(response.message || 'Failed');
    }
  }catch (error) {
    console.error('Error:', error);
    showNotification('Error', 'Failed to update date', 'error');
  }
}