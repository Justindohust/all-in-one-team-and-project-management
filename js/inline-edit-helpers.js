/**
 * Inline Edit Helpers - Functions for inline editing in table view
 */

// Make name editable (click to edit)
function makeNameEditable(nameEl, item) {
  const originalName = item.name;
  
  // Create textarea
  const textarea = document.createElement('textarea');
  textarea.value = originalName;
  textarea.style.cssText = `
    width: 100%;
    min-width: 200px;
    padding: 4px 8px;
    background: #1e293b;
    color: #e2e8f0;
    border: 2px solid #3b82f6;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    resize: vertical;
    min-height: 32px;
  `;
  
  // Replace name with textarea
  nameEl.replaceWith(textarea);
  textarea.focus();
  textarea.select();
  
  // Save on Enter
  textarea.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newName = textarea.value.trim();
      
      if (newName && newName !== originalName) {
        await saveNameChange(item, originalName, newName);
      }
      
      // Restore name element
      const newNameEl = document.createElement('span');
      newNameEl.style.cssText = nameEl.style.cssText;
      newNameEl.textContent = item.name;
      newNameEl.ondblclick = (e) => { e.stopPropagation(); makeNameEditable(newNameEl, item); };
      textarea.replaceWith(newNameEl);
    } else if (e.key === 'Escape') {
      // Cancel editing
      const newNameEl = document.createElement('span');
      newNameEl.style.cssText = nameEl.style.cssText;
      newNameEl.textContent = originalName;
      newNameEl.ondblclick = (e) => { e.stopPropagation(); makeNameEditable(newNameEl, item); };
      textarea.replaceWith(newNameEl);
    }
  });
  
  // Save on blur
  textarea.addEventListener('blur', async () => {
    const newName = textarea.value.trim();
    
    if (newName && newName !== originalName) {
      await saveNameChange(item, originalName, newName);
    }
    
    // Restore name element
    const newNameEl = document.createElement('span');
    newNameEl.style.cssText = nameEl.style.cssText;
    newNameEl.textContent = item.name;
    newNameEl.ondblclick = (e) => { e.stopPropagation(); makeNameEditable(newNameEl, item); };
    textarea.replaceWith(newNameEl);
  });
}

// Save name change and log activity
async function saveNameChange(item, oldValue, newValue) {
  try {
    const typeMap = {
      'PROJECT': 'projects',
      'MODULE': 'modules',
      'SUBMODULE': 'submodules',
      'TASK': 'tasks'
    };
    
    const endpoint = typeMap[item.type];
    const response = await api.request(`/${endpoint}/${item.realId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newValue })
    });
    
    if (response.success) {
      // Update local data
      item.name = newValue;
      
      // Log activity
      await logActivity(item, 'name', oldValue, newValue);
      
      showNotification('Success', 'Name updated successfully', 'success');
    } else {
      throw new Error(response.message || 'Failed to update name');
    }
  } catch (error) {
    console.error('Error updating name:', error);
    showNotification('Error', 'Failed to update name: ' + error.message, 'error');
  }
}

// Log activity to database
async function logActivity(item, field, oldValue, newValue) {
  try {
    const typeMap = {
      'PROJECT': 'project',
      'MODULE': 'module',
      'SUBMODULE': 'submodule',
      'TASK': 'task'
    };
    
    const entityType = typeMap[item.type];
    const description = `Changed ${field} from "${oldValue}" to "${newValue}"`;
    
    await api.request('/activities', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: entityType,
        entity_id: item.realId,
        activity_type: 'update',
        description: description,
        metadata: {
          field: field,
          old_value: oldValue,
          new_value: newValue
        }
      })
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Helper to get child type
function getChildType(parentType) {
  const childMap = {
    'PROJECT': 'Module',
    'MODULE': 'Submodule',
    'SUBMODULE': 'Task'
  };
  return childMap[parentType] || '';
}

// Check if item can have children
function canHaveChildren(type) {
  return ['PROJECT', 'MODULE', 'SUBMODULE'].includes(type);
}

