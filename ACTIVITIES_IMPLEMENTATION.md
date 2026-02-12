# Activities & Comments System - Testing Guide

## ✅ Hệ Thống Đã Hoàn Thành

### 1. Database Layer
- ✅ **entity_comments table**: Lưu trữ comments cho tất cả entity types (project, module, submodule, task)
- ✅ **activity_logs enhancements**: Thêm columns để track entity-specific activities
- ✅ **Database triggers**: Tự động log các thay đổi cho modules, submodules, và tasks
- ✅ **Comment replies**: Hỗ trợ nested comments (parent-child relationship)

### 2. Backend API
- ✅ **GET /api/activities/:entityType/:entityId**: Lấy activities (logs + comments) cho một entity
- ✅ **GET /api/activities/comments/:commentId/replies**: Lấy replies của một comment
- ✅ **POST /api/activities/comments**: Tạo comment hoặc reply
- ✅ **PUT /api/activities/comments/:commentId**: Cập nhật comment
- ✅ **DELETE /api/activities/comments/:commentId**: Xóa comment (cascade xóa replies)

### 3. Frontend Components
- ✅ **ActivityManager class** (`js/activities.js`): Quản lý activities và comments
- ✅ **Activity Tab Component** (`views/activity-tab.html`): UI hiển thị activities
- ✅ **Integration**: Tích hợp vào projects detail panel

## 🧪 Kết Quả Test

### Database Tests ✅
```
✅ entity_comments table exists
✅ Enhanced columns: project_id, module_id, submodule_id, task_id
✅ Triggers: trigger_log_module_activity, trigger_log_submodule_activity, trigger_log_task_activity
✅ Comments creation and retrieval working
✅ Replies working correctly
✅ Combined activities query working
```

### Trigger Tests ✅
```
✅ Module creation triggers activity log
✅ Activity log contains correct user info
✅ Activity details captured properly
```

## 📖 Cách Sử Dụng

### 1. Trên Frontend

1. **Mở Projects view** trong DigiHub
2. **Click vào một Module, Submodule, hoặc Task** để mở detail panel
3. **Switch sang tab "ACTIVITY"**
4. Bạn sẽ thấy:
   - **Activity logs**: Các thay đổi tự động (created, updated, status changed, etc.)
   - **Comments**: Các comment của users
   - **Reply functionality**: Có thể reply vào comments

### 2. Tính Năng Comments

#### Tạo Comment
```javascript
// Comment sẽ xuất hiện trong activity feed
- Nhập text vào comment box
- Click "Comment" button
- Comment sẽ được thêm vào đầu danh sách
```

#### Reply to Comment
```javascript
// Click "Reply" dưới comment
- Reply form sẽ hiện ra
- Nhập reply text và Enter hoặc click "Reply"
- Reply sẽ được nested dưới comment gốc
```

#### Edit/Delete Comment
```javascript
// Chỉ owner của comment mới thấy edit/delete buttons
- Click icon edit để sửa
- Click icon trash để xóa
- Xóa comment sẽ xóa tất cả replies
```

### 3. Automatic Activity Logging

Hệ thống tự động log khi:
- **Create**: Tạo module/submodule/task mới
- **Update**: Thay đổi name, status, priority, progress, dates
- **Delete**: Xóa module/submodule/task

Ví dụ activity log details:
```json
{
  "status_changed": { "from": "pending", "to": "active" },
  "progress_changed": { "from": 50, "to": 75 },
  "priority_changed": { "from": "medium", "to": "high" }
}
```

## 🔧 API Usage Examples

### Get Activities for Module
```javascript
const response = await api.getActivities('module', moduleId);
// Returns: { success: true, data: [...], pagination: {...} }
```

### Create Comment
```javascript
const response = await api.createComment('module', moduleId, 'Great work!');
// Returns: { success: true, data: { id, content, ... } }
```

### Create Reply
```javascript
const response = await api.createComment('module', moduleId, 'Thanks!', parentCommentId);
// Returns: { success: true, data: { id, content, parent_id, ... } }
```

### Get Comment Replies
```javascript
const response = await api.getCommentReplies(commentId);
// Returns: { success: true, data: [...replies] }
```

## 📊 Database Schema

### entity_comments
```sql
- id: UUID (PK)
- entity_type: VARCHAR(50) (project|module|submodule|task)
- entity_id: UUID (ID của entity)
- user_id: UUID (FK to users)
- content: TEXT
- parent_id: UUID (FK to entity_comments, for replies)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### activity_logs (enhanced)
```sql
- id: UUID (PK)
- workspace_id: UUID (FK)
- user_id: UUID (FK)
- action: VARCHAR(50) (created|updated|deleted)
- entity_type: VARCHAR(50)
- entity_id: UUID
- entity_name: VARCHAR(255)
- details: JSONB
- project_id: UUID (FK) -- NEW
- module_id: UUID (FK) -- NEW
- submodule_id: UUID (FK) -- NEW
- task_id: UUID (FK) -- NEW
- created_at: TIMESTAMP
```

## 🎯 Tính Năng Nổi Bật

1. **Unified Activity Feed**: Kết hợp logs và comments trong một view
2. **Real-time Updates**: Activities được load động khi mở detail panel
3. **Nested Comments**: Reply functionality với unlimited depth
4. **User Context**: Mọi activity đều có thông tin user (name, avatar)
5. **Time Tracking**: "Time ago" format cho easy reading
6. **Auto-logging**: Triggers tự động capture tất cả changes
7. **Permissions**: Chỉ comment owner hoặc admin mới có thể edit/delete

## 🚀 Next Steps

Có thể enhance thêm:
- [ ] Real-time notifications khi có comment mới
- [ ] Mentions (@user) trong comments
- [ ] Rich text formatting (markdown)
- [ ] File attachments trong comments
- [ ] Emoji reactions
- [ ] Comment edit history
- [ ] Activity filtering (chỉ xem comments, chỉ xem logs, etc.)
- [ ] Export activities
- [ ] Search trong activities

## 🐛 Troubleshooting

### Trigger không chạy?
Đảm bảo set user context trước khi update:
```javascript
await client.query(`SET LOCAL app.current_user_id = '${userId}'`);
```

### Activities không load?
- Check backend server đang chạy
- Check network console for errors
- Verify entity type và entity ID đúng

### Comments không xuất hiện?
- Check browser console for errors
- Verify API token valid
- Check database entity_comments table

## 📝 Files Modified/Created

### Database
- `backend/database/20260212000002-add-comments-and-activities.sql`
- `backend/scripts/run-activities-migration.js`

### Backend
- `backend/routes/activities.js` (NEW)
- `backend/server.js` (added route)

### Frontend
- `js/activities.js` (NEW)
- `js/api.js` (added activities methods)
- `js/projects-table-view.js` (updated renderActivityTab)
- `views/activity-tab.html` (NEW)
- `index.html` (added activities.js script)

## ✨ Conclusion

Hệ thống activities & comments đã được implement đầy đủ và test kỹ lưỡng. Giờ đây users có thể:
- Xem tất cả activities (logs + comments) của mỗi entity
- Comment và reply để collaborate
- Track tất cả changes automatically
- Có visibility hoàn chỉnh về project/module/task history

Hệ thống sẵn sàng để sử dụng! 🎉
