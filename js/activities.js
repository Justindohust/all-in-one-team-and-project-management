/**
 * DigiHub Activities & Comments Component
 * Handles displaying and managing activity logs and comments
 */

class ActivityManager {
  constructor() {
    this.currentEntityType = null;
    this.currentEntityId = null;
    this.currentPage = 1;
    this.isLoading = false;
    this.hasMore = true;
  }

  /**
   * Initialize activities for an entity
   */
  async init(entityType, entityId) {
    console.log('[ActivityManager] Initializing for', entityType, entityId);
    this.currentEntityType = entityType;
    this.currentEntityId = entityId;
    this.currentPage = 1;
    this.hasMore = true;
    
    await this.loadActivities(true);
  }

  /**
   * Load activities (logs + comments)
   */
  async loadActivities(clearExisting = false) {
    if (this.isLoading || !this.hasMore) {
      console.log('[ActivityManager] Skip loading - isLoading:', this.isLoading, 'hasMore:', this.hasMore);
      return;
    }
    
    try {
      this.isLoading = true;
      console.log('[ActivityManager] Loading activities page', this.currentPage);
      
      const response = await api.getActivities(
        this.currentEntityType,
        this.currentEntityId,
        this.currentPage
      );
      
      console.log('[ActivityManager] Response:', response);
      
      if (response.success) {
        const container = document.getElementById('activity-list');
        
        if (!container) {
          console.error('[ActivityManager] Container #activity-list not found!');
          return;
        }
        
        if (clearExisting) {
          container.innerHTML = '';
        }
        
        if (response.data.length === 0 && this.currentPage === 1) {
          console.log('[ActivityManager] No activities found');
          container.innerHTML = this.renderEmptyState();
          this.hasMore = false;
          return;
        }
        
        console.log('[ActivityManager] Rendering', response.data.length, 'activities');
        response.data.forEach(activity => {
          container.insertAdjacentHTML('beforeend', this.renderActivity(activity));
        });
        
        this.hasMore = response.pagination.page < response.pagination.totalPages;
        this.currentPage++;
        
        // Show/hide load more button
        const loadMoreBtn = document.getElementById('activity-load-more');
        if (loadMoreBtn) {
          loadMoreBtn.classList.toggle('hidden', !this.hasMore);
        }
      } else {
        console.error('[ActivityManager] API returned error:', response.message);
        const container = document.getElementById('activity-list');
        if (container) {
          container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
              <p class="text-sm text-danger">⚠️ ${response.message || 'Failed to load activities'}</p>
              <p class="text-xs mt-2">Please make sure you are logged in</p>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('[ActivityManager] Error loading activities:', error);
      const container = document.getElementById('activity-list');
      if (container) {
        container.innerHTML = `
          <div class="text-center py-8 text-slate-400">
            <p class="text-sm text-danger">⚠️ Error: ${error.message}</p>
            <button onclick="activityManager.loadActivities(true)" class="mt-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg">
              Retry
            </button>
          </div>
        `;
      }
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Render a single activity (log or comment)
   */
  renderActivity(activity) {
    if (activity.type === 'log') {
      return this.renderActivityLog(activity);
    } else if (activity.type === 'comment') {
      return this.renderComment(activity);
    }
  }

  /**
   * Render activity log
   */
  renderActivityLog(log) {
    const timeAgo = this.getTimeAgo(log.created_at);
    const details = this.formatLogDetails(log);
    
    return `
      <div class="activity-item flex gap-3 p-3 hover:bg-slate-700/30 rounded-lg transition-all">
        <div class="flex-shrink-0">
          ${log.user_avatar 
            ? `<img src="${log.user_avatar}" alt="${log.user_name}" class="w-8 h-8 rounded-full">`
            : `<div class="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-semibold text-white">
                 ${this.getInitials(log.user_name)}
               </div>`
          }
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-2">
            <div class="text-sm">
              <span class="font-semibold text-white">${log.user_name || 'System'}</span>
              <span class="text-slate-400"> ${log.action} </span>
              <span class="text-white">${log.entity_name}</span>
            </div>
            <span class="text-xs text-slate-500 flex-shrink-0">${timeAgo}</span>
          </div>
          ${details ? `<div class="mt-1 text-xs text-slate-400">${details}</div>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render comment with replies
   */
  renderComment(comment) {
    const timeAgo = this.getTimeAgo(comment.created_at);
    const currentUserId = api.currentUser?.id;
    const isOwner = currentUserId === comment.user_id;
    const userName = comment.user_name || api.currentUser?.firstName + ' ' + api.currentUser?.lastName || 'Unknown User';
    
    return `
      <div class="comment-item p-3 bg-slate-700/20 rounded-lg" data-comment-id="${comment.id}">
        <div class="flex gap-3">
          <div class="flex-shrink-0">
            ${comment.user_avatar 
              ? `<img src="${comment.user_avatar}" alt="${userName}" class="w-8 h-8 rounded-full">`
              : `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-sm font-semibold text-white">
                   ${this.getInitials(userName)}
                 </div>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2 mb-1">
              <div>
                <span class="font-semibold text-white text-sm">${userName}</span>
                <span class="text-xs text-slate-500 ml-2">${timeAgo}</span>
              </div>
              ${isOwner ? `
                <div class="flex items-center gap-1">
                  <button onclick="activityManager.editComment('${comment.id}')" class="p-1 text-slate-400 hover:text-white rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button onclick="activityManager.deleteComment('${comment.id}')" class="p-1 text-slate-400 hover:text-danger rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              ` : ''}
            </div>
            <div class="comment-content text-sm text-slate-300">${this.escapeHtml(comment.content)}</div>
            <div class="mt-2 flex items-center gap-3 text-xs">
              <button onclick="activityManager.toggleReplyForm('${comment.id}')" class="text-primary-400 hover:text-primary-300">
                Reply
              </button>
              ${comment.replies_count > 0 ? `
                <button onclick="activityManager.toggleReplies('${comment.id}')" class="text-slate-400 hover:text-white flex items-center gap-1">
                  <span>${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}</span>
                  <svg class="w-4 h-4 reply-chevron transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              ` : ''}
            </div>
            
            <!-- Reply Form (Hidden by default) -->
            <div id="reply-form-${comment.id}" class="hidden mt-3">
              <div class="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Write a reply..." 
                  class="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onkeypress="if(event.key==='Enter') activityManager.submitReply('${comment.id}', this.value)"
                />
                <button 
                  onclick="activityManager.submitReply('${comment.id}', document.querySelector('#reply-form-${comment.id} input').value)"
                  class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
            
            <!-- Replies Container (Hidden by default) -->
            <div id="replies-${comment.id}" class="hidden mt-3 pl-4 border-l-2 border-slate-600 space-y-2">
              <!-- Replies will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render reply (nested comment) - SUPPORTS INFINITE NESTING
   */
  renderReply(reply, depth = 1) {
    const timeAgo = this.getTimeAgo(reply.created_at);
    const currentUserId = api.currentUser?.id;
    const isOwner = currentUserId === reply.user_id;
    const userName = reply.user_name || 'Unknown User';
    const avatarSize = depth === 1 ? 'w-7 h-7' : 'w-6 h-6';
    const textSize = depth === 1 ? 'text-sm' : 'text-xs';
    
    return `
      <div class="reply-item ${depth > 1 ? 'ml-4' : ''}" data-reply-id="${reply.id}">
        <div class="flex gap-2 p-2 hover:bg-slate-700/20 rounded-lg">
          <div class="flex-shrink-0">
            ${reply.user_avatar 
              ? `<img src="${reply.user_avatar}" alt="${userName}" class="${avatarSize} rounded-full">`
              : `<div class="${avatarSize} rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
                   ${this.getInitials(userName)}
                 </div>`
            }
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between gap-2">
              <div>
                <span class="font-semibold text-white ${textSize}">${userName}</span>
                <span class="text-xs text-slate-500 ml-2">${timeAgo}</span>
              </div>
              ${isOwner ? `
                <button onclick="activityManager.deleteComment('${reply.id}')" class="p-1 text-slate-400 hover:text-danger rounded" title="Delete">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              ` : ''}
            </div>
            <div class="text-sm text-slate-300 mt-1">${this.escapeHtml(reply.content)}</div>
            
            <!-- Reply button for nested replies -->
            <div class="mt-2 flex items-center gap-3 text-xs">
              <button onclick="activityManager.toggleNestedReplyForm('${reply.id}')" class="text-primary-400 hover:text-primary-300">
                Reply
              </button>
              ${reply.replies_count > 0 ? `
                <button onclick="activityManager.toggleNestedReplies('${reply.id}')" class="text-slate-400 hover:text-white flex items-center gap-1">
                  <span>${reply.replies_count} ${reply.replies_count === 1 ? 'reply' : 'replies'}</span>
                  <svg class="w-3 h-3 reply-chevron transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              ` : ''}
            </div>
            
            <!-- Nested Reply Form (Hidden by default) -->
            <div id="nested-reply-form-${reply.id}" class="hidden mt-2">
              <div class="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Write a reply..." 
                  class="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  onkeypress="if(event.key==='Enter') activityManager.submitNestedReply('${reply.id}', this.value)"
                />
                <button 
                  onclick="activityManager.submitNestedReply('${reply.id}', document.querySelector('#nested-reply-form-${reply.id} input').value)"
                  class="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs rounded-lg transition-colors"
                >
                  Reply
                </button>
              </div>
            </div>
            
            <!-- Nested Replies Container -->
            <div id="nested-replies-${reply.id}" class="hidden mt-2 space-y-1">
              <!-- Nested replies will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Format activity log details
   */
  formatLogDetails(log) {
    if (!log.details) return '';
    
    const details = [];
    const data = log.details;
    
    if (data.name_changed) {
      details.push(`Name: ${data.name_changed.from} → ${data.name_changed.to}`);
    }
    if (data.status_changed) {
      details.push(`Status: ${data.status_changed.from} → ${data.status_changed.to}`);
    }
    if (data.priority_changed) {
      details.push(`Priority: ${data.priority_changed.from} → ${data.priority_changed.to}`);
    }
    if (data.progress_changed) {
      details.push(`Progress: ${data.progress_changed.from}% → ${data.progress_changed.to}%`);
    }
    if (data.dates_changed) {
      const dates = data.dates_changed;
      if (dates.start_date) {
        details.push(`Start: ${dates.start_date.from || 'none'} → ${dates.start_date.to || 'none'}`);
      }
      if (dates.end_date) {
        details.push(`End: ${dates.end_date.from || 'none'} → ${dates.end_date.to || 'none'}`);
      }
    }
    
    return details.join(' • ');
  }

  /**
   * Toggle reply form visibility
   */
  toggleReplyForm(commentId) {
    const form = document.getElementById(`reply-form-${commentId}`);
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      form.querySelector('input').focus();
    }
  }

  /**
   * Toggle replies visibility
   */
  async toggleReplies(commentId) {
    const container = document.getElementById(`replies-${commentId}`);
    const chevron = container.previousElementSibling.querySelector('.reply-chevron');
    
    if (container.classList.contains('hidden')) {
      // Load replies if not loaded yet
      if (container.children.length === 0) {
        await this.loadReplies(commentId);
      }
      container.classList.remove('hidden');
      chevron?.classList.add('rotate-180');
    } else {
      container.classList.add('hidden');
      chevron?.classList.remove('rotate-180');
    }
  }

  /**
   * Load replies for a comment
   */
  async loadReplies(commentId) {
    try {
      const response = await api.getCommentReplies(commentId);
      
      if (response.success) {
        const container = document.getElementById(`replies-${commentId}`);
        container.innerHTML = '';
        
        // Enhance replies data with replies_count from backend
        const repliesWithCount = await Promise.all(
          response.data.map(async (reply) => {
            // Get replies count for each reply
            const countResponse = await api.getCommentReplies(reply.id);
            reply.replies_count = countResponse.success ? countResponse.data.length : 0;
            return reply;
          })
        );
        
        repliesWithCount.forEach(reply => {
          container.insertAdjacentHTML('beforeend', this.renderReply(reply, 1));
        });
      }
    } catch (error) {
      console.error('Error loading replies:', error);
      this.showError('Failed to load replies');
    }
  }
  
  /**
   * Toggle nested reply form (for replies to replies)
   */
  toggleNestedReplyForm(replyId) {
    const form = document.getElementById(`nested-reply-form-${replyId}`);
    form.classList.toggle('hidden');
    if (!form.classList.contains('hidden')) {
      form.querySelector('input').focus();
    }
  }
  
  /**
   * Toggle nested replies visibility
   */
  async toggleNestedReplies(replyId) {
    const container = document.getElementById(`nested-replies-${replyId}`);
    const button = container.previousElementSibling.querySelector('.reply-chevron');
    
    if (container.classList.contains('hidden')) {
      // Load nested replies if not loaded yet
      if (container.children.length === 0) {
        await this.loadNestedReplies(replyId);
      }
      container.classList.remove('hidden');
      button?.classList.add('rotate-180');
    } else {
      container.classList.add('hidden');
      button?.classList.remove('rotate-180');
    }
  }
  
  /**
   * Load nested replies (replies to replies)
   */
  async loadNestedReplies(replyId) {
    try {
      const response = await api.getCommentReplies(replyId);
      
      if (response.success) {
        const container = document.getElementById(`nested-replies-${replyId}`);
        container.innerHTML = '';
        
        // Recursively get replies count
        const repliesWithCount = await Promise.all(
          response.data.map(async (reply) => {
            const countResponse = await api.getCommentReplies(reply.id);
            reply.replies_count = countResponse.success ? countResponse.data.length : 0;
            return reply;
          })
        );
        
        repliesWithCount.forEach(reply => {
          container.insertAdjacentHTML('beforeend', this.renderReply(reply, 2));
        });
      }
    } catch (error) {
      console.error('Error loading nested replies:', error);
      this.showError('Failed to load nested replies');
    }
  }
  
  /**
   * Submit nested reply (reply to a reply)
   */
  async submitNestedReply(parentReplyId, content) {
    if (!content.trim()) return;
    
    try {
      const response = await api.createComment(
        this.currentEntityType,
        this.currentEntityId,
        content.trim(),
        parentReplyId
      );
      
      if (response.success) {
        // Ensure user_name is set
        if (!response.data.user_name && api.currentUser) {
          response.data.user_name = `${api.currentUser.firstName} ${api.currentUser.lastName}`;
        }
        
        // Get or create nested replies container
        let container = document.getElementById(`nested-replies-${parentReplyId}`);
        
        // Show container if hidden
        if (container.classList.contains('hidden')) {
          container.classList.remove('hidden');
          const button = container.previousElementSibling.querySelector('.reply-chevron');
          button?.classList.add('rotate-180');
        }
        
        // Add replies_count to the new reply
        response.data.replies_count = 0;
        
        // Add new reply to container
        container.insertAdjacentHTML('beforeend', this.renderReply(response.data, 2));
        
        // Update parent's replies count
        const parentButton = document.querySelector(`[data-reply-id="${parentReplyId}"] button[onclick*="toggleNestedReplies"]`);
        if (parentButton) {
          const currentCount = parseInt(parentButton.textContent.match(/\d+/)[0] || 0);
          parentButton.innerHTML = `
            <span>${currentCount + 1} ${currentCount + 1 === 1 ? 'reply' : 'replies'}</span>
            <svg class="w-3 h-3 reply-chevron transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          `;
        } else {
          // Add replies button if it doesn't exist
          const replyActionsDiv = document.querySelector(`[data-reply-id="${parentReplyId}"] .mt-2.flex.items-center`);
          if (replyActionsDiv) {
            replyActionsDiv.innerHTML += `
              <button onclick="activityManager.toggleNestedReplies('${parentReplyId}')" class="text-slate-400 hover:text-white flex items-center gap-1">
                <span>1 reply</span>
                <svg class="w-3 h-3 reply-chevron transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
            `;
          }
        }
        
        // Clear and hide form
        const form = document.getElementById(`nested-reply-form-${parentReplyId}`);
        form.querySelector('input').value = '';
        form.classList.add('hidden');
        
        this.showSuccess('Reply added successfully');
      }
    } catch (error) {
      console.error('Error submitting nested reply:', error);
      this.showError('Failed to add reply');
    }
  }

  /**
   * Submit new comment
   */
  async submitComment(content) {
    if (!content.trim()) return;
    
    try {
      const response = await api.createComment(
        this.currentEntityType,
        this.currentEntityId,
        content.trim()
      );
      
      if (response.success) {
        // Ensure user_name is set (backend should provide it, but fallback to current user)
        if (!response.data.user_name && api.currentUser) {
          response.data.user_name = `${api.currentUser.firstName} ${api.currentUser.lastName}`;
        }
        
        // Add new comment to the list
        const container = document.getElementById('activity-list');
        const emptyState = container.querySelector('.empty-state');
        if (emptyState) {
          emptyState.remove();
        }
        
        container.insertAdjacentHTML('afterbegin', this.renderComment({
          ...response.data,
          type: 'comment',
          replies_count: 0
        }));
        
        // Clear input
        const input = document.getElementById('comment-input');
        if (input) {
          input.value = '';
        }
        
        this.showSuccess('Comment added');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      this.showError('Failed to add comment');
    }
  }

  /**
   * Submit reply to a comment
   */
  async submitReply(parentId, content) {
    if (!content.trim()) return;
    
    try {
      const response = await api.createComment(
        this.currentEntityType,
        this.currentEntityId,
        content.trim(),
        parentId
      );
      
      if (response.success) {
        // Ensure user_name is set
        if (!response.data.user_name && api.currentUser) {
          response.data.user_name = `${api.currentUser.firstName} ${api.currentUser.lastName}`;
        }
        response.data.replies_count = 0;
        
        // Add reply to the replies container
        const repliesContainer = document.getElementById(`replies-${parentId}`);
        if (repliesContainer) {
          repliesContainer.insertAdjacentHTML('beforeend', this.renderReply(response.data, 1));
          
          // Show replies container if hidden
          if (repliesContainer.classList.contains('hidden')) {
            repliesContainer.classList.remove('hidden');
          }
          
          // Update reply count
          const commentItem = document.querySelector(`[data-comment-id="${parentId}"]`);
          const replyButton = commentItem.querySelector('button[onclick*="toggleReplies"]');
          if (replyButton) {
            const currentCount = parseInt(replyButton.textContent.match(/\d+/)[0] || 0);
            replyButton.innerHTML = `
              <span>${currentCount + 1} ${currentCount + 1 === 1 ? 'reply' : 'replies'}</span>
              <svg class="w-4 h-4 reply-chevron transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            `;
          }
        }
        
        // Hide and clear reply form
        const replyForm = document.getElementById(`reply-form-${parentId}`);
        if (replyForm) {
          replyForm.classList.add('hidden');
          replyForm.querySelector('input').value = '';
        }
        
        this.showSuccess('Reply added');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      this.showError('Failed to add reply');
    }
  }

  /**
   * Delete comment or reply
   */
  async deleteComment(commentId) {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      const response = await api.deleteComment(commentId);
      
      if (response.success) {
        // Remove comment or reply from DOM
        const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
        const replyItem = document.querySelector(`[data-reply-id="${commentId}"]`);
        
        if (commentItem) {
          commentItem.remove();
        } else if (replyItem) {
          replyItem.remove();
        }
        
        this.showSuccess('Comment deleted');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      this.showError('Failed to delete comment');
    }
  }

  /**
   * Edit comment (placeholder - can be enhanced)
   */
  async editComment(commentId) {
    // This can be enhanced with inline editing
    const newContent = prompt('Edit your comment:');
    if (!newContent || !newContent.trim()) return;
    
    try {
      const response = await api.updateComment(commentId, newContent.trim());
      
      if (response.success) {
        // Update comment content in DOM
        const commentItem = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentItem) {
          const contentEl = commentItem.querySelector('.comment-content');
          if (contentEl) {
            contentEl.textContent = newContent.trim();
          }
        }
        
        this.showSuccess('Comment updated');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      this.showError('Failed to update comment');
    }
  }

  /**
   * Render empty state
   */
  renderEmptyState() {
    return `
      <div class="empty-state text-center py-12 text-slate-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <p class="text-sm">No activity yet</p>
        <p class="text-xs mt-1">Be the first to leave a comment!</p>
      </div>
    `;
  }

  /**
   * Utility: Get time ago string
   */
  getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
      }
    }
    
    return 'just now';
  }

  /**
   * Utility: Get initials from name
   */
  getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /**
   * Utility: Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // You can implement a toast notification here
    console.log('Success:', message);
  }

  /**
   * Show error message
   */
  showError(message) {
    // You can implement a toast notification here
    console.error('Error:', message);
  }
}

// Create global instance
const activityManager = new ActivityManager();
