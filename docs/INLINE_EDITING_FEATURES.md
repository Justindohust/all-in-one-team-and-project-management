# Inline Editing Features - Projects Table View

## Tổng quan

Đã bổ sung các tính năng inline editing cho Projects Table View, cho phép chỉnh sửa trực tiếp trên bảng mà không cần mở modal.

## Các tính năng đã thêm

### 1. **Inline Name Editing**
- **Cách sử dụng**: Double-click vào tên project/module/submodule/task
- **Chức năng**: 
  - Chuyển text thành textarea để chỉnh sửa
  - Enter để lưu, Escape để hủy
  - Tự động lưu khi blur (click ra ngoài)
  - Log activity với old value → new value

### 2. **Assignee Dropdown**
- **Cách sử dụng**: Click vào cột Assignee
- **Chức năng**:
  - Hiển thị dropdown danh sách users
  - Chọn user để assign
  - Option "Unassign" để bỏ assignee
  - Log activity khi thay đổi

### 3. **Priority Dropdown**
- **Cách sử dụng**: Click vào cột Priority
- **Chức năng**:
  - Hiển thị dropdown với 4 mức: Urgent, High, Medium, Low
  - Có icon màu sắc cho mỗi mức
  - Log activity khi thay đổi

### 4. **Date Picker**
- **Cách sử dụng**: Click vào cột Start Date
- **Chức năng**:
  - Hiển thị date input picker
  - Nút Save để lưu, Clear để xóa date
  - Log activity khi thay đổi

### 5. **Add Child Button**
- **Cách sử dụng**: Hover vào row của PROJECT/MODULE/SUBMODULE
- **Chức năng**:
  - Hiển thị nút "+" ở cột ID
  - Click để thêm child item:
    - PROJECT → Module
    - MODULE → Submodule
    - SUBMODULE → Task
  - Hiện tại show notification, sẽ tích hợp modal sau

### 6. **Detail Panel Updates**
- **Đã bỏ**: Cột "FIN" (Finish Date) khỏi table
- **Đã thêm**: Thông tin Created và Last Updated trong detail panel
- **Format**: Hiển thị relative time (e.g., "2 hours ago", "3 days ago")

## Files đã thay đổi

### 1. `js/inline-edit-helpers.js` (NEW)
- `makeNameEditable()` - Chuyển name thành editable textarea
- `saveNameChange()` - Lưu thay đổi name qua API
- `logActivity()` - Log activity vào database

### 2. `js/dropdown-editors.js` (NEW)
- `showAssigneeDropdown()` - Hiển thị dropdown chọn assignee
- `showPriorityDropdown()` - Hiển thị dropdown chọn priority
- `showDatePicker()` - Hiển thị date picker
- Các hàm save tương ứng với activity logging

### 3. `js/projects-table-view.js` (UPDATED)
- Thêm click handlers cho các cột editable
- Thêm hover effect để show add child button
- Thêm `formatDateTime()` helper function
- Thêm `handleAddChild()` function
- Cập nhật detail panel với created_at và updated_at

### 4. `views/projects.html` (UPDATED)
- Bỏ cột "Fin" khỏi table header
- Cập nhật colspan từ 8 → 7

### 5. `index.html` (UPDATED)
- Thêm script tags cho inline-edit-helpers.js và dropdown-editors.js

## Activity Logging

Tất cả các thay đổi đều được log vào bảng `activities` với format:
```json
{
  "entity_type": "project|module|submodule|task",
  "entity_id": 123,
  "activity_type": "update",
  "description": "Changed [field] from \"[old]\" to \"[new]\"",
  "metadata": {
    "field": "name|assignee|priority|startDate",
    "old_value": "...",
    "new_value": "..."
  }
}
```

## API Endpoints sử dụng

- `PUT /projects/:id` - Update project
- `PUT /modules/:id` - Update module
- `PUT /submodules/:id` - Update submodule
- `PUT /tasks/:id` - Update task
- `POST /activities` - Log activity

## Field Mapping

Frontend → Backend:
- `startDate` → `start_date`
- `finishDate` → `due_date`
- `assignee` → `assignee`
- `priority` → `priority`
- `name` → `name`

## Notifications

Sử dụng `window.showNotification()` để hiển thị:
- Success: Khi cập nhật thành công
- Error: Khi có lỗi xảy ra

## TODO - Tính năng tiếp theo

1. ✅ Inline name editing
2. ✅ Assignee dropdown
3. ✅ Priority dropdown
4. ✅ Date picker
5. ✅ Add child button
6. ✅ Remove FIN column
7. ✅ Add created/updated timestamps
8. ⏳ Type dropdown (cần backend support để convert entity types)
9. ⏳ Tích hợp modal để add child items
10. ⏳ Multi-select assignees (hiện tại chỉ single select)

