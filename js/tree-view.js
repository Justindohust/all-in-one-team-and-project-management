/**
 * Advanced TreeView Component
 * Supports multi-level hierarchies, drag & drop, CRUD operations
 */

class AdvancedTreeView {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = {
      data: options.data || [],
      onSelect: options.onSelect || (() => {}),
      onCreate: options.onCreate || (() => {}),
      onUpdate: options.onUpdate || (() => {}),
      onDelete: options.onDelete || (() => {}),
      onMove: options.onMove || (() => {}),
      allowDrag: options.allowDrag !== false,
      allowEdit: options.allowEdit !== false,
      allowDelete: options.allowDelete !== false,
      allowCreate: options.allowCreate !== false,
      showContextMenu: options.showContextMenu !== false
    };
    
    this.expandedNodes = new Set();
    this.selectedNode = null;
    this.draggedNode = null;
    this.dragOverNode = null;
    
    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.classList.add('tree-view-container');
    this.render();
    this.attachGlobalListeners();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';
    
    if (this.options.data.length === 0) {
      this.container.innerHTML = `
        <div class="text-center py-8 text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <p class="text-sm">No items yet</p>
        </div>
      `;
      return;
    }
    
    const tree = document.createElement('div');
    tree.className = 'tree-view';
    
    this.options.data.forEach(node => {
      tree.appendChild(this.createNodeElement(node, 0));
    });
    
    this.container.appendChild(tree);
  }

  createNodeElement(node, level) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node';
    nodeDiv.dataset.nodeId = node.id;
    nodeDiv.dataset.nodeType = node.type || 'item';
    nodeDiv.dataset.level = level;
    
    const isExpanded = this.expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = this.selectedNode === node.id;
    
    // Node content
    const nodeContent = document.createElement('div');
    nodeContent.className = `tree-node-content flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
      isSelected ? 'bg-primary-500/20 text-primary-400 border border-primary-500/50' : 'hover:bg-slate-700/50 text-slate-300'
    }`;
    nodeContent.style.paddingLeft = `${level * 24 + 12}px`;
    nodeContent.draggable = this.options.allowDrag;
    
    // Toggle icon (if has children)
    if (hasChildren) {
      const toggleIcon = document.createElement('div');
      toggleIcon.className = 'tree-toggle';
      toggleIcon.innerHTML = `
        <svg class="w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      `;
      toggleIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNode(node.id);
      });
      nodeContent.appendChild(toggleIcon);
    } else {
      const spacer = document.createElement('div');
      spacer.className = 'w-4 h-4';
      nodeContent.appendChild(spacer);
    }
    
    // Node icon
    const iconEl = document.createElement('div');
    iconEl.className = 'tree-node-icon flex-shrink-0';
    iconEl.innerHTML = this.getNodeIcon(node);
    nodeContent.appendChild(iconEl);
    
    // Node label
    const labelEl = document.createElement('div');
    labelEl.className = 'tree-node-label flex-1 truncate font-medium text-sm';
    labelEl.textContent = node.name || node.title || 'Untitled';
    nodeContent.appendChild(labelEl);
    
    // Node badges
    if (node.count !== undefined) {
      const badge = document.createElement('span');
      badge.className = 'px-2 py-0.5 bg-slate-700 text-slate-300 rounded text-xs';
      badge.textContent = node.count;
      nodeContent.appendChild(badge);
    }
    
    if (node.status) {
      const statusBadge = document.createElement('span');
      statusBadge.className = `px-2 py-0.5 rounded text-xs ${this.getStatusClass(node.status)}`;
      statusBadge.textContent = node.status;
      nodeContent.appendChild(statusBadge);
    }
    
    // Actions menu
    if (this.options.showContextMenu) {
      const menuBtn = document.createElement('button');
      menuBtn.className = 'tree-node-menu opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded transition-opacity';
      menuBtn.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
        </svg>
      `;
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showContextMenu(node, e);
      });
      nodeContent.appendChild(menuBtn);
    }
    
    nodeContent.classList.add('group');
    
    // Event listeners
    nodeContent.addEventListener('click', () => this.selectNode(node));
    
    if (this.options.allowDrag) {
      nodeContent.addEventListener('dragstart', (e) => this.handleDragStart(e, node));
      nodeContent.addEventListener('dragend', (e) => this.handleDragEnd(e));
      nodeContent.addEventListener('dragover', (e) => this.handleDragOver(e, node));
      nodeContent.addEventListener('dragleave', (e) => this.handleDragLeave(e));
      nodeContent.addEventListener('drop', (e) => this.handleDrop(e, node));
    }
    
    nodeDiv.appendChild(nodeContent);
    
    // Children container
    if (hasChildren && isExpanded) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'tree-node-children';
      
      node.children.forEach(childNode => {
        childrenContainer.appendChild(this.createNodeElement(childNode, level + 1));
      });
      
      nodeDiv.appendChild(childrenContainer);
    }
    
    return nodeDiv;
  }

  getNodeIcon(node) {
    const iconMap = {
      group: '<svg class="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>',
      project: '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
      module: '<svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
      task: '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>',
      default: '<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>'
    };
    
    return iconMap[node.type] || iconMap.default;
  }

  getStatusClass(status) {
    const statusMap = {
      active: 'bg-success/20 text-success',
      completed: 'bg-blue-500/20 text-blue-400',
      pending: 'bg-warning/20 text-warning',
      archived: 'bg-slate-600/20 text-slate-400'
    };
    return statusMap[status] || statusMap.pending;
  }

  toggleNode(nodeId) {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
    this.render();
  }

  selectNode(node) {
    this.selectedNode = node.id;
    this.render();
    this.options.onSelect(node);
  }

  // Drag & Drop handlers
  handleDragStart(e, node) {
    this.draggedNode = node;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
    e.target.style.opacity = '0.5';
  }

  handleDragEnd(e) {
    e.target.style.opacity = '';
    this.draggedNode = null;
    this.dragOverNode = null;
    this.render();
  }

  handleDragOver(e, node) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    // Highlight drop target
    const target = e.target.closest('.tree-node-content');
    if (target) {
      target.classList.add('drag-over');
    }
    
    this.dragOverNode = node;
    return false;
  }

  handleDragLeave(e) {
    const target = e.target.closest('.tree-node-content');
    if (target) {
      target.classList.remove('drag-over');
    }
  }

  handleDrop(e, targetNode) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    
    const target = e.target.closest('.tree-node-content');
    if (target) {
      target.classList.remove('drag-over');
    }
    
    if (this.draggedNode && targetNode && this.draggedNode.id !== targetNode.id) {
      // Prevent dropping parent into child
      if (!this.isDescendant(targetNode, this.draggedNode)) {
        this.options.onMove(this.draggedNode, targetNode);
      }
    }
    
    return false;
  }

  isDescendant(parent, possibleDescendant) {
    if (!parent.children) return false;
    
    for (const child of parent.children) {
      if (child.id === possibleDescendant.id) return true;
      if (this.isDescendant(child, possibleDescendant)) return true;
    }
    
    return false;
  }

  showContextMenu(node, event) {
    // Remove existing menu
    const existingMenu = document.querySelector('.tree-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'tree-context-menu fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50';
    menu.style.left = `${event.pageX}px`;
    menu.style.top = `${event.pageY}px`;
    
    const menuItems = [
      { label: 'Add Child', icon: 'M12 4v16m8-8H4', action: () => this.createChild(node), show: this.options.allowCreate },
      { label: 'Edit', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z', action: () => this.editNode(node), show: this.options.allowEdit },
      { label: 'Duplicate', icon: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z', action: () => this.duplicateNode(node), show: this.options.allowCreate },
      { label: 'Delete', icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16', action: () => this.deleteNode(node), show: this.options.allowDelete, danger: true }
    ];
    
    menuItems.filter(item => item.show).forEach(item => {
      const menuItem = document.createElement('button');
      menuItem.className = `w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
        item.danger ? 'text-danger hover:bg-danger/10' : 'text-slate-300 hover:bg-slate-700'
      }`;
      menuItem.innerHTML = `
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/>
        </svg>
        <span>${item.label}</span>
      `;
      menuItem.addEventListener('click', () => {
        item.action();
        menu.remove();
      });
      menu.appendChild(menuItem);
    });
    
    document.body.appendChild(menu);
    
    // Close menu on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeMenu() {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      });
    }, 10);
  }

  createChild(parentNode) {
    this.options.onCreate(parentNode);
  }

  editNode(node) {
    this.options.onUpdate(node);
  }

  duplicateNode(node) {
    this.options.onCreate(null, node);
  }

  deleteNode(node) {
    this.options.onDelete(node);
  }

  attachGlobalListeners() {
    // Add custom styles
    if (!document.getElementById('tree-view-styles')) {
      const styles = document.createElement('style');
      styles.id = 'tree-view-styles';
      styles.textContent = `
        .tree-node-content.drag-over {
          background-color: rgba(59, 130, 246, 0.2) !important;
          border: 2px dashed rgba(59, 130, 246, 0.5);
        }
        .tree-context-menu {
          min-width: 180px;
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // Public API
  updateData(newData) {
    this.options.data = newData;
    this.render();
  }

  expandAll() {
    const expandRecursive = (nodes) => {
      nodes.forEach(node => {
        this.expandedNodes.add(node.id);
        if (node.children) expandRecursive(node.children);
      });
    };
    expandRecursive(this.options.data);
    this.render();
  }

  collapseAll() {
    this.expandedNodes.clear();
    this.render();
  }

  getSelectedNode() {
    return this.selectedNode;
  }

  findNodeById(id, nodes = this.options.data) {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = this.findNodeById(id, node.children);
        if (found) return found;
      }
    }
    return null;
  }
}

// Export for use
window.AdvancedTreeView = AdvancedTreeView;
