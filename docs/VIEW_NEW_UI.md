## Hướng dẫn xem UI mới

### Vấn đề đã sửa:
1. ✅ **Database migrations** - Đã chạy thành công
2. ✅ **Seed data** - Đã thêm 14 modules và 12 submodules
3. ✅ **Backend API** - Đang hoạt động bình thường  
4. ✅ **Frontend code** - Đã sửa lỗi initialization

### Các bước để xem UI mới:

1. **Clear browser cache:**
   - Mở DevTools: `F12` hoặc `Ctrl+Shift+I`
   - Right-click vào nút Reload → chọn **"Empty Cache and Hard Reload"**
   - Hoặc: `Ctrl+Shift+Delete` → Clear cache

2. **Mở trang:**
   - URL: http://localhost:3000
   - Login với: john@digihub.io / password123
   - Navigate to **Projects** tab

3. **Features có sẵn:**
   - **Table View Mode** (mặc định): Hiển thị hierarchy đầy đủ
     - Project Groups → Projects → Modules → Submodules → Tasks
     - 8 cột thông tin
     - Click vào hàng để expand/collapse
   
   - **Detail Panel** (bên phải): Click vào bất kỳ item nào để xem
     - Tab OVERVIEW: Thông tin cơ bản
     - Tab ACTIVITY: Activity log và comments
     - Tab FILES: File attachments
     - Tab RELATIONS: Related items
     - Tab WATCH: Watchers
   
   - **View Toggle**: Chuyển đổi giữa Table view và Tree view (nút ở góc trên)

4. **Sample data:** 
   - **DigiFact Framework** project:
     - Frontend Development module (3 submodules)
     - Backend Development module (3 submodules)
   
   - **DigiFact Branding** project:
     - Brand Identity module (2 submodules)
     - Marketing Materials module (1 submodule)
   
   - **DigiFact Contest** project:
     - Contest Platform module (3 submodules)

5. **Kiểm tra nếu vẫn không thấy:**
   - Mở DevTools Console (F12) → xem có lỗi nào không
   - Kiểm tra Network tab → xem API `/api/project-groups` có trả về data không
   - Kiểm tra xem file `projects-table-view.js` có được load không

### Debug Commands:

```javascript
// Trong browser console, test các function:

// 1. Check if table view initialized
console.log('Current view:', currentProjectView);

// 2. Check data loaded
console.log('Projects data:', allProjectsData);

// 3. Manually reload data
loadProjectsData();

// 4. Switch views  
setProjectView('table');

// 5. Check if functions exist
console.log({
  initProjectsTableView: typeof initProjectsTableView,
  renderTableView: typeof renderTableView,
  setProjectView: typeof setProjectView
});
```

### API Test:

```bash
# PowerShell
$headers = @{ 'Authorization' = 'Bearer <your-token>' }
$response = Invoke-RestMethod -Uri 'http://localhost:3001/api/project-groups' -Headers $headers
$response.data | ForEach-Object { Write-Output "Group: $($_.name), Projects: $($_.projects.Length)" }
```

### Troubleshooting:

**Vấn đề:** "Loading projects..." spinning forever
- **Nguyên nhân:** API không trả về data hoặc authentication failed
- **Giải pháp:** Check Network tab, xem response từ `/api/project-groups`

**Vấn đề:** Không thấy detail panel
- **Nguyên nhân:** Chưa click vào item nào
- **Giải pháp:** Click vào bất kỳ hàng nào trong table

**Vấn đề:** Table view trống
- **Nguyên nhân:** Database chưa có data
- **Giải pháp:** Chạy seed script (đã làm rồi)

**Vấn đề:** Console errors
- **Nguyên nhân:** Có thể file JS chưa được load đúng
- **Giải pháp:** Hard reload (Ctrl+F5)

---

**Lưu ý:** Nếu sau khi clear cache mà vẫn không thấy, hãy:
1. Stop và restart Docker containers: `docker-compose restart`
2. Kiểm tra browser console để xem error messages
3. Thử browser khác (Chrome, Firefox, Edge)
