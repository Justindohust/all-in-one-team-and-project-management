# Projects Module - Enhanced UI với 4 cấp Hierarchy

## Tổng quan

Module Projects đã được nâng cấp với giao diện hoàn toàn mới, bao gồm:
- **Table View** với hierarchy 4 cấp: Project → Module → Submodule → Task
- **Detail Panel** với 5 tabs thông tin chi tiết
- **Drag & Drop** để di chuyển items giữa các cấp
- **CRUD Operations** đầy đủ cho tất cả các cấp

## Cấu trúc Hierarchy 4 cấp

```
Project Group (Optional wrapper)
├── Project
│   ├── Module
│   │   ├── Submodule (NEW!)
│   │   │   └── Task
│   │   └── Task (trực tiếp trong module)
```

### 1. **Project** (Dự án)
- Là đơn vị cao nhất trong hierarchy thực tế
- Có thể chứa nhiều modules
- Thuộc về một Project Group

### 2. **Module** (Module)
- Là thành phần lớn của project
- Có thể chứa submodules hoặc tasks trực tiếp
- Có status, priority, dates

### 3. **Submodule** (Submodule) - MỚI
- Là sub-component của module
- Cho phép tổ chức chi tiết hơn
- Chứa các tasks liên quan

### 4. **Task** (Nhiệm vụ)
- Là đơn vị công việc nhỏ nhất
- Có thể thuộc về module hoặc submodule
- Có assignee, due date, status, priority

## Giao diện mới

### Table View
- Hiển thị dạng bảng với các cột:
  - ID
  - SUBJECT (với hierarchy indent)
  - TYPE (PROJECT/MODULE/SUBMODULE/TASK)
  - STATUS
  - ASSIGNEE
  - PRIORITY
  - START DATE
  - FIN (Finish Date)

- Tính năng:
  - 🔽 **Expand/Collapse**: Click vào arrow để mở/đóng children
  - 🖱️ **Click to select**: Click vào row để xem detail
  - 🎨 **Color coding**: Mỗi type có màu riêng
  - ⚡ **Quick actions**: Context menu với right-click

### Detail Panel (5 Tabs)

#### 1. **OVERVIEW** Tab
- Thông tin cơ bản về item
- People section (Assignee, Accountable)
- Estimates và Progress
  - Work time
  - Remaining work
  - % Complete
  - Spent time
- Details (Priority, Dates)
- Action buttons (Edit, Duplicate, Delete)

#### 2. **ACTIVITY** Tab
- Log các hoạt động
- Comment system
- Timeline hiển thị:
  - Ai tạo item
  - Ai cập nhật
  - Thay đổi status
  - Comments

#### 3. **FILES** Tab
- Upload attachments
- Drag & drop area
- Danh sách files đính kèm
- Preview files

#### 4. **RELATIONS** Tab
- Hiển thị Parent item
- Hiển thị Children items
- Add relationships
- Navigate giữa các items

#### 5. **WATCH** Tab
- Theo dõi item
- Danh sách watchers
- Add/remove watchers
- Nhận notifications

## Tính năng CRUD

### Create (Tạo mới)
1. Click nút **Create** ở header
2. Hoặc right-click vào item và chọn **Add Child**
3. Điền thông tin trong modal
4. Type tự động được set dựa trên parent

### Read (Xem)
- Click vào bất kỳ row nào trong table
- Detail panel sẽ slide in từ bên phải
- Switch giữa các tabs để xem thông tin khác nhau

### Update (Cập nhật)
1. Click vào item trong table
2. Click nút **Edit** trong detail panel
3. Hoặc right-click và chọn **Edit**
4. Cập nhật thông tin và Save

### Delete (Xóa)
1. Select item
2. Click nút Delete (icon thùng rác)
3. Confirm deletion
4. Lưu ý: Không thể xóa nếu có children

## Drag & Drop

### Các thao tác hợp lệ:
- ✅ Project → Group
- ✅ Module → Project
- ✅ Submodule → Module
- ✅ Task → Module hoặc Submodule

### Cách sử dụng:
1. Click và giữ item muốn di chuyển
2. Drag đến target item
3. Drop khi thấy highlight
4. Hệ thống tự động validate move hợp lệ

## Database Schema

### Bảng mới: `submodules`
```sql
CREATE TABLE submodules (
    id UUID PRIMARY KEY,
    module_id UUID REFERENCES modules(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    priority VARCHAR(10) DEFAULT 'medium',
    start_date DATE,
    due_date DATE,
    progress INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Cột mới trong `tasks`
```sql
ALTER TABLE tasks ADD COLUMN submodule_id UUID REFERENCES submodules(id);
```

## API Endpoints

### Submodules
```
GET    /api/submodules/module/:moduleId  - Get all submodules of a module
GET    /api/submodules/:id                - Get submodule by ID with tasks
POST   /api/submodules                    - Create new submodule
PUT    /api/submodules/:id                - Update submodule
DELETE /api/submodules/:id                - Delete submodule
PATCH  /api/submodules/:id/move           - Move submodule to another module
PATCH  /api/submodules/:id/progress       - Update progress
```

### Updated Endpoints
```
GET /api/project-groups  - Now returns full hierarchy including submodules
```

## Files đã thêm/sửa

### Frontend
- ✅ `views/projects.html` - UI mới với table view và detail panel
- ✅ `js/projects-table-view.js` - Logic cho table view (MỚI)
- ✅ `js/projects.js` - Cập nhật hỗ trợ 4 cấp
- ✅ `js/tree-view.js` - Thêm icon cho submodule
- ✅ `js/api.js` - Thêm API methods cho modules và submodules
- ✅ `css/input.css` - Styles cho table view và detail panel
- ✅ `views/modals.html` - Thêm submodule option

### Backend
- ✅ `backend/routes/submodules.js` - Routes cho submodules (MỚI)
- ✅ `backend/routes/projectGroups.js` - Cập nhật trả về full hierarchy
- ✅ `backend/server.js` - Register submodules route
- ✅ `backend/database/migration-add-submodules.sql` - Migration script (MỚI)

## Cài đặt

### 1. Chạy migration để tạo bảng submodules
```bash
# Kết nối vào PostgreSQL database
psql -U your_username -d your_database

# Chạy migration
\i backend/database/migration-add-submodules.sql
```

### 2. Restart backend server
```bash
cd backend
npm start
```

### 3. Rebuild CSS (nếu dùng Tailwind)
```bash
npm run build:css
```

### 4. Refresh frontend
- Hard refresh browser (Ctrl + F5)
- Clear cache nếu cần

## Sử dụng

### Tạo Submodule
1. Navigate to Projects tab
2. Expand một project để thấy modules
3. Right-click vào module
4. Chọn "Add Child"
5. Type tự động là "Submodule"
6. Điền thông tin và Save

### Di chuyển Task vào Submodule
1. Select task muốn di chuyển
2. Drag task đến submodule target
3. Drop để hoàn thành

### Xem thông tin chi tiết
1. Click vào bất kỳ item nào
2. Detail panel mở tự động
3. Switch giữa các tabs
4. Thực hiện actions (Edit, Delete, etc.)

## Keyboard Shortcuts

- `Ctrl + Click` - Select multiple items (planned)
- `↑/↓` - Navigate giữa items (planned)
- `Enter` - Open detail panel (planned)
- `Esc` - Close detail panel
- `Delete` - Delete selected item (planned)

## Tips & Best Practices

1. **Tổ chức hợp lý**: Sử dụng submodules khi module quá lớn và cần chia nhỏ
2. **Naming convention**: Đặt tên rõ ràng, có ý nghĩa
3. **Status tracking**: Cập nhật status thường xuyên
4. **Assignment**: Assign tasks cho team members cụ thể
5. **Dates**: Set start date và due date để track timeline
6. **Comments**: Sử dụng Activity tab để communicate

## Troubleshooting

### Issue: Không thấy Submodule option
- **Solution**: Check xem modal đã được cập nhật chưa
- Clear cache và refresh

### Issue: Drag & Drop không hoạt động
- **Solution**: Check console log xem có error không
- Đảm bảo move operation hợp lệ

### Issue: Detail panel không hiển thị
- **Solution**: Check xem item có data không
- Xem console log để debug

### Issue: API errors khi tạo submodule
- **Solution**: Đảm bảo database đã chạy migration
- Check backend logs
- Verify token authentication

## Next Steps / Future Enhancements

- [ ] Filter và Search trong table view
- [ ] Bulk operations (select multiple items)
- [ ] Export to Excel/PDF
- [ ] Gantt chart view
- [ ] Calendar integration
- [ ] Real-time collaboration
- [ ] Mobile responsive optimization
- [ ] Keyboard shortcuts
- [ ] Custom fields
- [ ] Advanced permissions

## Support

Nếu có vấn đề hoặc câu hỏi, vui lòng:
1. Check console log (F12)
2. Check backend logs
3. Review this document
4. Create issue với detailed information

---

**Version**: 2.0  
**Last Updated**: February 10, 2026  
**Author**: AI Assistant
