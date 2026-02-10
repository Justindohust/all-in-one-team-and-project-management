# Common Errors Library

Tài liệu này tổng hợp các lỗi thường gặp trong dự án **All-in-One Team and Project Management** và cách giải quyết chi tiết.

---

## 1. Failed to Load Resource: 404 (Not Found)

### 🔴 Hiện tượng (Symptoms)

**Browser Console:**
```
GET http://localhost:3000/js/projects.js net::ERR_ABORTED 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
```

hoặc

```
GET http://localhost:3000/api/projects 404 (Not Found)
Failed to load resource: the server responded with a status of 404 (Not Found)
```

**Kết quả:**
- Trang web không load đầy đủ chức năng
- Giao diện bị lỗi, JavaScript không chạy
- API calls thất bại, dữ liệu không hiển thị
- Console đỏ lòm báo lỗi liên tục

---

### 🔍 Nguyên nhân (Root Causes)

#### **A. File path không đúng (Most Common)**

1. **Path tuyệt đối vs tương đối sai:**
   ```html
   <!-- ❌ SAI -->
   <script src="/js/projects.js"></script>  <!-- Tìm từ root server -->
   
   <!-- ✅ ĐÚNG -->
   <script src="./js/projects.js"></script> <!-- Tìm từ vị trí file hiện tại -->
   ```

2. **Case-sensitive paths (Linux/Docker):**
   ```javascript
   // ❌ SAI - File thật tên là "projects.js"
   import { loadProjects } from './js/Projects.js';
   
   // ✅ ĐÚNG
   import { loadProjects } from './js/projects.js';
   ```

3. **Đường dẫn file không tồn tại:**
   ```javascript
   // ❌ SAI - File đã đổi tên hoặc di chuyển
   fetch('/api/project-groups')  // Route thật là 'projectGroups'
   
   // ✅ ĐÚNG
   fetch('/api/projectGroups')
   ```

#### **B. Backend route chưa được định nghĩa**

```javascript
// ❌ SAI - Route chưa tồn tại trong backend/server.js
app.get('/api/projects', ...)  // Chưa định nghĩa

// ✅ ĐÚNG - Phải có trong backend/server.js
const projectsRouter = require('./routes/projects');
app.use('/api/projects', projectsRouter);
```

#### **C. Static file serving chưa được cấu hình**

```javascript
// ❌ SAI - Chưa cấu hình serve static files
app.use('/api/...', ...);  // Chỉ có API routes

// ✅ ĐÚNG - Phải có static middleware
app.use(express.static('public'));  
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));
app.use('/views', express.static('views'));
```

#### **D. Build/Bundle chưa chạy (Tailwind CSS)**

```bash
# ❌ CSS output chưa được generate
GET http://localhost:3000/css/output.css 404

# ✅ Phải chạy Tailwind build trước
npm run build:css
```

#### **E. CORS hoặc Nginx rewrites (Production)**

```nginx
# ❌ SAI - Nginx chưa cấu hình đúng static files
location / {
    proxy_pass http://backend:3000;  # Tất cả request đều đến backend
}

# ✅ ĐÚNG - Serve static files trước
location /js/ {
    root /usr/share/nginx/html;
}
location /css/ {
    root /usr/share/nginx/html;
}
```

---

### ✅ Giải pháp (Solutions)

#### **1️⃣ Kiểm tra file có tồn tại không**

```powershell
# Từ project root
Get-ChildItem -Recurse -Filter "projects.js"

# Hoặc
Test-Path ".\js\projects.js"
```

**Action:**
- Nếu file KHÔNG tồn tại → Tạo file hoặc sửa path
- Nếu file TỒN TẠI → Kiểm tra path chính xác

#### **2️⃣ Sửa đường dẫn trong HTML**

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <!-- ✅ Đường dẫn tương đối từ index.html -->
    <link rel="stylesheet" href="./css/output.css">
</head>
<body>
    <!-- ✅ Đường dẫn tương đối -->
    <script type="module" src="./js/app.js"></script>
    <script type="module" src="./js/api.js"></script>
</body>
</html>
```

#### **3️⃣ Kiểm tra backend static serving**

**Trong `backend/server.js`:**
```javascript
const express = require('express');
const path = require('path');
const app = express();

// ✅ QUAN TRỌNG: Serve static files từ frontend
app.use(express.static(path.join(__dirname, '../'))); // Serve toàn bộ project root
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/views', express.static(path.join(__dirname, '../views')));

// API routes sau static files
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
// ... các routes khác

// Fallback for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});
```

#### **4️⃣ Sửa API calls trong frontend**

**Trong `js/api.js`:**
```javascript
// ❌ SAI
const response = await fetch('/project-groups');

// ✅ ĐÚNG - Đảm bảo route khớp với backend
const response = await fetch('/api/projectGroups');
```

#### **5️⃣ Kiểm tra backend routes đã định nghĩa**

**Trong `backend/server.js`:**
```javascript
// Liệt kê TẤT CẢ các routes đã mounted
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projectGroups', projectGroupsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/team', teamRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/modules', modulesRouter);       // ✅ Cần có
app.use('/api/submodules', submodulesRouter); // ✅ Cần có
```

#### **6️⃣ Build Tailwind CSS**

```powershell
# Development với watch mode
npm run dev

# hoặc build một lần
npm run build:css
```

#### **7️⃣ Kiểm tra Docker/Nginx config (Nếu dùng)**

**Trong `nginx.conf`:**
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # ✅ Serve static files trước
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        access_log off;
    }

    # ✅ API routes đến backend
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # ✅ Fallback cho SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### 🛠️ Debug Workflow (Quy trình xử lý)

**Bước 1: Xác định loại resource bị lỗi**
```javascript
// Mở DevTools Console, xem đường dẫn đầy đủ
// Ví dụ: http://localhost:3000/js/projects.js
```

**Bước 2: Kiểm tra file có tồn tại**
```powershell
# Từ project root
Test-Path ".\js\projects.js"  # PowerShell
# hoặc
ls js/projects.js  # Bash/Linux
```

**Bước 3: Kiểm tra cấu hình server**
```javascript
// Trong backend/server.js
console.log('Static paths:', {
    root: path.join(__dirname, '../'),
    js: path.join(__dirname, '../js'),
    css: path.join(__dirname, '../css')
});
```

**Bước 4: Test direct access**
```bash
# Mở browser, truy cập trực tiếp
http://localhost:3000/js/projects.js
# → Nếu 404: Server chưa serve file
# → Nếu thấy code: Path trong HTML sai
```

**Bước 5: Kiểm tra API route**
```bash
# Test API endpoint
curl http://localhost:3000/api/projects
# hoặc
Invoke-WebRequest -Uri "http://localhost:3000/api/projects"
```

---

### 🚫 Cách phòng tránh (Prevention)

#### **1. Quy ước đặt tên và đường dẫn:**
- ✅ Luôn dùng lowercase cho tên file và folder
- ✅ Dùng kebab-case cho files: `project-detail.js`
- ✅ Dùng camelCase cho routes API: `/api/projectGroups`
- ✅ Sử dụng đường dẫn tương đối `./ hoặc ../` trong HTML

#### **2. Checklist khi thêm file mới:**
```markdown
- [ ] File đã tạo đúng folder?
- [ ] Tên file khớp với import/require statement?
- [ ] Path trong HTML/JS trỏ đúng file?
- [ ] Backend đã cấu hình serve static cho folder này?
- [ ] API route đã được mount trong server.js?
- [ ] Route name khớp giữa frontend và backend?
```

#### **3. VS Code extensions hỗ trợ:**
- **Path Intellisense**: Autocomplete file paths
- **Import Cost**: Hiển thị size của imports
- **REST Client**: Test API endpoints ngay trong VS Code

#### **4. Script kiểm tra tự động:**

**`check-resources.js`**
```javascript
const fs = require('fs');
const path = require('path');

// Danh sách files cần thiết
const requiredFiles = [
    './js/app.js',
    './js/api.js',
    './js/projects.js',
    './css/output.css',
    './views/dashboard.html',
    // ... thêm files khác
];

requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`❌ MISSING: ${file}`);
    } else {
        console.log(`✅ OK: ${file}`);
    }
});
```

```powershell
# Chạy kiểm tra
node check-resources.js
```

#### **5. Git pre-commit hook:**

**`.git/hooks/pre-commit`**
```bash
#!/bin/sh
# Kiểm tra các file quan trọng trước khi commit
files=("js/app.js" "js/api.js" "backend/server.js")
for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "Error: $file is missing!"
        exit 1
    fi
done
```

---

### 📊 Common 404 Patterns trong project này

| Path bị lỗi | Nguyên nhân | Giải pháp |
|------------|-------------|-----------|
| `/js/projects.js` | Chưa load module trong HTML | Thêm `<script src="./js/projects.js" type="module">` |
| `/api/modules` | Route chưa mount trong server.js | Thêm `app.use('/api/modules', modulesRouter)` |
| `/css/output.css` | Tailwind chưa build | Chạy `npm run build:css` |
| `/views/dashboard.html` | Static middleware chưa cấu hình cho /views | Thêm `app.use('/views', express.static('views'))` |
| `/api/projectGroups` | Typo trong API call hoặc route | Đồng bộ tên route giữa frontend/backend |

---

### 📝 Tóm tắt Quick Fix

```powershell
# 1. Kiểm tra file tồn tại
Test-Path ".\js\projects.js"

# 2. Restart server
cd backend
node server.js

# 3. Build CSS
npm run build:css

# 4. Clear cache
# Chrome: Ctrl+Shift+Del hoặc Ctrl+F5 (hard refresh)

# 5. Test API
curl http://localhost:3000/api/projects
```

**Nếu vẫn lỗi:**
1. Check `backend/server.js` → static middleware
2. Check network tab trong DevTools → xem request URL đầy đủ
3. Check backend console → xem có log request không
4. So sánh path trong code vs path thực tế của file

---

### 🎯 Key Takeaways

> **404 Error = Resource Not Found**
> - ✅ File không tồn tại ở path được request
> - ✅ Server chưa được config để serve file đó
> - ✅ Path trong code không khớp với path thực tế
> - ✅ API route chưa được định nghĩa trong backend

**Remember:**
- Development: Luôn check console trước
- Path: Tương đối (`./ hoặc ../`) trong HTML/JS
- Backend: Serve static files TRƯỚC API routes
- Testing: Test direct URL trong browser trước
  - Model mới vừa được tạo
  - Upgrade module lần đầu
  - View được load trước khi table được tạo trong DB

### Giải pháp
**Cách 1: Tách inline tree thành view riêng (RECOMMENDED)**

```xml
<!-- Tạo view riêng cho model con -->
<record id="view_formula_process_step_tree" model="ir.ui.view">
    <field name="name">formula.process.step.tree</field>
    <field name="model">formula.process.step</field>
    <field name="arch" type="xml">
        <list editable="bottom">
            <field name="sequence" widget="handle"/>
            <field name="name"/>
            <field name="description"/>
            <field name="notes"/>
        </list>
    </field>
</record>

<!-- Trong form view, reference đến view đã tạo -->
<field name="process_step_ids" nolabel="1" 
       context="{'tree_view_ref': 'mes_mold.view_formula_process_step_tree'}"/>
```

**Cách 2: Đảm bảo model được tạo trước**
- Kiểm tra model đã được import trong `models/__init__.py`
- Kiểm tra security access được định nghĩa trong `ir.model.access.csv`
- Restart Odoo 2 lần: lần 1 tạo table, lần 2 load view

### Cách phòng tránh
- Luôn tạo view riêng cho models có quan hệ One2many/Many2many
- Không dùng inline tree cho model mới
- Đảm bảo security access được định nghĩa đầy đủ

---

## 3. Invalid View Type - Tree vs List (Odoo 18)

### Hiện tượng
```
odoo.tools.convert.ParseError: while parsing /mnt/custom-addons/mes_mold/views/formula_formula_views.xml:8
Invalid view type: 'tree'.
You might have used an invalid starting tag in the architecture.
Allowed types are: list, form, graph, pivot, calendar, kanban, search, qweb, activity
```

### Nguyên nhân
- **Odoo 18 thay đổi**: Tag `<tree>` không còn được chấp nhận trong view definition
- Phải dùng `<list>` cho view definition
- **Lưu ý**: Inline tree trong One2many vẫn dùng `<tree>` được

### Giải pháp
**Trong view definition (record):**
```xml
<!-- SAI - Odoo 17 và trước -->
<record id="view_formula_formula_tree" model="ir.ui.view">
    <field name="arch" type="xml">
        <tree>
            <field name="name"/>
        </tree>
    </field>
</record>

<!-- ĐÚNG - Odoo 18 -->
<record id="view_formula_formula_tree" model="ir.ui.view">
    <field name="arch" type="xml">
        <list>
            <field name="name"/>
        </list>
    </field>
</record>
```

**Inline tree vẫn dùng được cả 2 cách:**
```xml
<!-- Cả 2 đều OK trong Odoo 18 -->
<field name="line_ids">
    <tree editable="bottom">...</tree>
</field>

<field name="line_ids">
    <list editable="bottom">...</list>
</field>
```

### Cách phòng tránh
- Khi upgrade lên Odoo 18, tìm tất cả `<tree>` trong view definition và đổi thành `<list>`
- Sử dụng search/replace: `<tree` → `<list` và `</tree>` → `</list>`
- Chỉ thay trong view definition, không thay trong inline tree

---

## 4. Module Load Order Issues

### Hiện tượng
- Model mới không được tạo trong database
- View báo lỗi model không tồn tại
- Upgrade module không có effect

### Nguyên nhân
- File chưa được khai báo trong `__init__.py`
- File chưa được khai báo trong `__manifest__.py` (data section)
- Thứ tự load file không đúng
- Module cache chưa được clear

### Giải pháp
1. **Kiểm tra models/__init__.py:**
```python
from . import formula_process_step
from . import formula_production_parameter
from . import formula_config_log
```

2. **Kiểm tra __manifest__.py:**
```python
'data': [
    'security/ir.model.access.csv',  # Security trước
    'views/formula_formula_views.xml',  # Views sau
]
```

3. **Restart và upgrade:**
```bash
docker restart odoo-container
# Hoặc trong Odoo: Apps → mes_mold → Upgrade
```

4. **Clear cache nếu cần:**
```bash
# Xóa __pycache__ folders
find . -type d -name __pycache__ -exec rm -rf {} +
```

### Cách phòng tránh
- Luôn thêm file mới vào `__init__.py` ngay khi tạo
- Thêm security access ngay khi tạo model mới
- Restart Odoo sau mỗi thay đổi structure

---

## 5. Domain Filter Syntax Errors

### Hiện tượng
- View không hiển thị đúng records
- Lỗi parse domain
- RecordSet filter không hoạt động

### Nguyên nhân
- Syntax domain sai
- Dùng `"` thay vì `'` trong domain
- Missing brackets

### Giải pháp
**Cú pháp đúng:**
```xml
<!-- Đơn giản -->
domain="[('category', '=', 'material')]"

<!-- Nhiều điều kiện - AND -->
domain="[('category', '=', 'material'), ('active', '=', True)]"

<!-- Nhiều điều kiện - OR -->
domain="['|', ('category', '=', 'material'), ('category', '=', 'mold')]"

<!-- Phức tạp -->
domain="['&', ('category', 'in', ['material', 'mold']), ('active', '=', True)]"
```

**Lưu ý:**
- Dùng `'` cho string trong domain, `"` cho XML attribute
- Dùng `True`/`False` cho boolean (không phải `'true'`/`'false'`)
- Operator: `=`, `!=`, `>`, `<`, `>=`, `<=`, `in`, `not in`, `like`, `ilike`

### Cách phòng tránh
- Test domain trong Python shell trước
- Sử dụng domain builder trong Odoo (Filters → Advanced)
- Copy domain từ existing views

---

## 6. Translation Issues

### Hiện tượng
- Giao diện hiển thị English thay vì Vietnamese
- Missing translations
- Translation không được apply sau khi update
- Translation được thêm vào .po file nhưng không hiển thị trên UI

### Nguyên nhân
- File .po chưa được generate/update
- **Format .po file sai - SAI FORMAT QUAN TRỌNG**
- Module chưa được upgrade sau khi thêm translation
- Cache browser chưa được clear

### ⚠️ LỖI THƯỜNG GẶP: SAI FORMAT KHI THÊM TRANSLATION THỦ CÔNG

**LỖI SAI:**
```po
#. module: quality_management
#. odoo-python
#: code:addons/quality_management/models/quality_checkpoint.py:0
msgid "Request for Approval"
msgstr "Đề nghị duyệt"

#. module: quality_management
#. odoo-python
#: code:addons/quality_management/models/quality_checkpoint.py:0
msgid "Approve"
msgstr "Duyệt"
```

**SAI Ở ĐÂU:**
1. ❌ Thiếu dòng trống giữa các entry
2. ❌ Mỗi entry đều có đầy đủ comment header (lặp lại không cần thiết)
3. ❌ Không tuân theo format của Odoo auto-generate

**FORMAT ĐÚNG:**
```po
#. module: quality_management
#. odoo-python
#: code:addons/quality_management/models/quality_checkpoint.py:0
msgid "Request for Approval"
msgstr "Đề nghị duyệt"

#. module: quality_management
#. odoo-python
#: code:addons/quality_management/models/quality_checkpoint.py:0
msgid "Approve"
msgstr "Duyệt"
```

**QUY TẮC VÀNG:**
- ✅ **LUÔN CÓ 1 DÒNG TRỐNG** giữa các entry
- ✅ Mỗi entry bắt đầu bằng comment `#.` hoặc `#:`
- ✅ `msgid` và `msgstr` phải thẳng hàng
- ✅ Dùng encoding UTF-8 without BOM
- ✅ **KHÔNG TỰ Ý THÊM** - nên export từ Odoo rồi chỉnh sửa

### Giải pháp
1. **Generate/Update .po file (KHUYẾN NGHỊ):**
```bash
# Trong Odoo UI:
Settings → Translations → Import/Export → Export Translations
# Module: chọn module cần translate
# Language: Vietnamese
# Format: PO File
```

2. **Thêm translation thủ công (CẨN THẬN):**
```po
#. module: mes_mold
#: model:ir.model.fields,field_description:mes_mold.field_formula_config_log__name
msgid "Log Name"
msgstr "Tên log"
```

3. **Import translation sau khi sửa:**
```bash
# Trong Odoo UI:
Settings → Translations → Load a Translation
# Language: Vietnamese (VN) / Tiếng Việt
# ✅ Tích: Overwrite Existing Terms
# Click: Load
```

4. **Clear cache:**
```bash
# Refresh browser: Ctrl + F5 (Windows) / Cmd + Shift + R (Mac)
# Hoặc hard refresh trong DevTools
```

### Cách phòng tránh
- ⭐ **LUÔN DÙNG Export/Import** thay vì edit thủ công
- Thêm translation ngay khi tạo field/view mới
- Sử dụng translation template từ existing modules
- Test với ngôn ngữ Vietnamese sau mỗi thay đổi
- **KIỂM TRA FORMAT** bằng cách so sánh với entry hiện có trong file .po

---

## 7. Security Access Rights

### Hiện tượng
- User không thể access model
- "You do not have access rights" error
- CRUD operations bị block

### Nguyên nhân
- Chưa định nghĩa access rights trong `ir.model.access.csv`
- Group chưa được assign cho user
- Record rules conflict

### Giải pháp
**Thêm vào ir.model.access.csv:**
```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_formula_process_step_viewer,formula.process.step.viewer,model_formula_process_step,group_formula_viewer,1,0,0,0
access_formula_process_step_editor,formula.process.step.editor,model_formula_process_step,group_formula_editor,1,1,1,1
access_formula_process_step_admin,formula.process.step.admin,model_formula_process_step,group_formula_admin,1,1,1,1
```

**Format:**
- `perm_read`: 1 = can read, 0 = cannot read
- `perm_write`: 1 = can update, 0 = cannot update
- `perm_create`: 1 = can create, 0 = cannot create
- `perm_unlink`: 1 = can delete, 0 = cannot delete

### Cách phòng tránh
- Thêm 3 access rules cho mỗi model mới (viewer, editor, admin)
- Copy template từ existing models
- Test với different user roles

---

## 7. Odoo Assets Not Updating - Cache Issue

### Hiện tượng
- Sửa code JavaScript, XML template, hoặc SCSS nhưng browser không hiển thị thay đổi
- Hard reload (Ctrl+Shift+R) vẫn không cập nhật
- Upgrade module không trigger rebuild assets
- Xóa assets từ database (Settings > Technical > Assets) vẫn không tự động tạo lại

### Nguyên nhân
- **Odoo Assets Compilation System**: Odoo compile JS/XML/SCSS thành bundles và cache trong database (ir_attachment)
- **Auto-rebuild không hoạt động**: Sau khi xóa assets, Odoo KHÔNG tự động rebuild khi restart
- **Module upgrade không đủ**: Bump version và upgrade module chỉ reload Python code, không force rebuild assets
- **Browser cache**: Ngay cả khi assets rebuild, browser vẫn cache old version

### Giải pháp

#### Giải pháp 1: Development Mode với --dev=all (KHUYẾN NGHỊ)
```yaml
# docker-compose.yml
services:
  odoo:
    command: >
      --db_host=db
      --db_port=5432
      --db_user=odoo
      --db_password=odoo
      -u module_name
      --dev=all
```

**Lợi ích của --dev=all**:
- Disable tất cả caching (Python, assets, templates)
- Auto-reload khi file thay đổi
- Assets luôn compile fresh từ source
- Không cần restart container mỗi lần sửa code

**Lưu ý**: Chỉ dùng trong development, KHÔNG dùng trong production (performance sẽ chậm)

#### Giải pháp 2: Force Rebuild Assets (Không khuyến nghị)
```bash
# 1. Xóa assets từ database
# Settings > Technical > Database Structure > Attachments
# Filter: res_model = 'ir.ui.view' và name contains 'assets'

# 2. Restart với --dev=qweb để rebuild
docker-compose restart odoo

# 3. Hoặc force với odoo-bin
docker exec odoo-container odoo --dev=all -d dbname --stop-after-init
```

### Cách phòng tránh
- **Luôn dùng --dev=all** khi development
- Thêm test marker vào template để verify compilation (ví dụ: `[TEST v17.0.X]`)
- Check browser console để confirm assets bundle đã load version mới
- Dùng incognito/private mode khi test để tránh browser cache

---

## 8. Invalid Handler - OWL Template Function Not Found

### Hiện tượng
```
OwlError: Invalid handler (expected a function, received: 'undefined')
    at Object.mainEventHandler
    at HTMLButtonElement.listener
```

### Nguyên nhân
- Template XML gọi function không tồn tại trong JavaScript component
- Function name không khớp giữa XML `t-on-click="functionName"` và JS `functionName() {}`
- Thường xảy ra khi:
  - Refactor/rename function trong JS nhưng quên update XML
  - Copy/paste template với function names khác nhau
  - Typo trong function name

### Ví dụ Lỗi
```xml
<!-- UserRequirementViewer.xml -->
<button t-on-click="createNewrequirement">Create</button>
<button t-on-click="renamerequirement">Rename</button>
<button t-on-click="deleterequirement">Delete</button>
```

```javascript
// UserRequirementViewer.js
class UserRequirementViewer extends Component {
    async createNewDocument() { ... }  // ❌ Tên khác với XML!
    async renameDocument() { ... }     // ❌ Tên khác với XML!
    async deleteDocument() { ... }     // ❌ Tên khác với XML!
}
```

### Giải pháp
```xml
<!-- Sửa lại XML để khớp với JS -->
<button t-on-click="createNewDocument">Create</button>
<button t-on-click="renameDocument">Rename</button>
<button t-on-click="deleteDocument">Delete</button>
```

### Cách phòng tránh
- **Naming convention**: Dùng camelCase consistent cho function names
- **Search toàn bộ**: Khi rename function, search và replace trong cả XML và JS
- **Check browser console**: Luôn mở console khi develop để catch lỗi sớm
- **Use TypeScript**: Nếu có thể, dùng TypeScript để type-check template bindings

---

## 9. Foreign Key Constraint Violation - Wrong Model Reference

### Hiện tượng
```
ERROR: insert or update on table "doc_issue" violates foreign key constraint "doc_issue_doc_id_fkey"
DETAIL: Key (doc_id)=(1) is not present in table "doc_file".
```

### Nguyên nhân
- Model định nghĩa Many2one field trỏ đến **SAI model**
- Thường xảy ra khi:
  - Copy model từ module khác mà không update references
  - Có nhiều models tương tự (ví dụ: `doc.file` cho Blueprint, `user.requirement` cho User Requirements)
  - Model cũ bị rename nhưng foreign key references không được update

### Ví dụ Lỗi
```python
# doc_issue.py - Model cho User Requirements
class DocIssue(models.Model):
    _name = 'doc.issue'
    
    # ❌ SAI: Trỏ đến doc.file (Blueprint model)
    doc_id = fields.Many2one('doc.file', string='Document', required=True)

# doc_comment.py - Cũng bị sai
class DocComment(models.Model):
    _name = 'doc.comment'
    
    # ❌ SAI: Trỏ đến doc.file thay vì user.requirement
    doc_id = fields.Many2one('doc.file', string='Document', required=True)
```

### Giải pháp
```python
# doc_issue.py - ĐÚNG
class DocIssue(models.Model):
    _name = 'doc.issue'
    
    # ✅ ĐÚNG: Trỏ đến user.requirement
    doc_id = fields.Many2one('user.requirement', string='Document', required=True)

# doc_comment.py - ĐÚNG
class DocComment(models.Model):
    _name = 'doc.comment'
    
    # ✅ ĐÚNG: Trỏ đến user.requirement
    doc_id = fields.Many2one('user.requirement', string='Document', required=True)
```

**Sau khi sửa PHẢI upgrade module** để Odoo tạo lại foreign key constraint:
```bash
# 1. Bump version trong __manifest__.py
"version": "17.0.6"

# 2. Restart và upgrade
docker-compose restart odoo
# Hoặc vào Apps > tìm module > Upgrade
```

### Cách phòng tránh
- **Kiểm tra model references** khi copy code từ module khác
- **Consistent naming**: Đặt tên model rõ ràng (ví dụ: `blueprint.document` vs `user.requirement`)
- **Test CRUD operations** ngay sau khi tạo model mới
- **Review related models**: Khi tạo issue/comment model, đảm bảo trỏ đúng parent model

---

## Checklist Khi Tạo Model Mới

- [ ] Tạo file model trong `models/`
- [ ] Thêm import vào `models/__init__.py`
- [ ] Thêm 3 access rules vào `security/ir.model.access.csv`
- [ ] Tạo view riêng (list, form) thay vì inline
- [ ] Dùng `<list>` thay vì `<tree>` cho view definition (Odoo 18)
- [ ] Thêm view file vào `__manifest__.py`
- [ ] Thêm translations vào `i18n/vi_VN.po`
- [ ] Test upgrade module
- [ ] Test CRUD operations với different user roles

---

## 13. Translation File Format Error - Incorrect Source Reference

### Hiện tượng
- Thêm bản dịch vào file `.po` nhưng không hiển thị trên UI
- Import translation thành công nhưng text vẫn hiện tiếng Anh
- Không có lỗi khi import/load translation

### Nguyên nhân
**SAI FORMAT KHI THÊM TRANSLATION THỦ CÔNG**

File `.po` của Odoo có cấu trúc rất nghiêm ngặt:
- Mỗi entry translation phải có **comment chỉ nguồn gốc chính xác**
- Nguồn từ **Python code** vs **XML view** có format comment KHÁC NHAU
- Nếu comment sai, Odoo sẽ KHÔNG load translation

### Ví dụ SAI:

❌ **SAI - Tất cả đều dùng odoo-python:**
```po
#. module: quality_management
#. odoo-python
#: code:addons/quality_management/models/quality_checkpoint.py:0
msgid "Request for Approval"
msgstr "Đề nghị duyệt"

#. module: quality_management
#. odoo-python
#: code:addons/quality_management/models/quality_checkpoint.py:0
msgid "Approve"
msgstr "Duyệt"
```

**VẤN ĐỀ:** String "Request for Approval" và "Approve" từ **XML view** (button label) nhưng comment lại chỉ đến **Python code** → Odoo KHÔNG nhận dạng được!

### Format ĐÚNG:

✅ **ĐÚNG - String từ XML View:**
```po
#. module: quality_management
#: model_terms:ir.ui.view,arch_db:quality_management.view_quality_checkpoint_form
msgid "Request for Approval"
msgstr "Đề nghị duyệt"

#. module: quality_management
#: model_terms:ir.ui.view,arch_db:quality_management.view_quality_checkpoint_form
msgid "Approve"
msgstr "Duyệt"
```

✅ **ĐÚNG - String từ Python Code:**
```po
#. module: quality_management
#. odoo-python
#: code:addons/quality_management/models/quality_checkpoint.py:0
msgid "Cannot update a locked record!"
msgstr "Không thể cập nhật bản ghi đã khóa!"
```

✅ **ĐÚNG - Field Label từ Model:**
```po
#. module: quality_management
#: model:ir.model.fields,field_description:quality_management.field_quality_checkpoint__name
msgid "Reference"
msgstr "Mã tham chiếu"
```

✅ **ĐÚNG - Selection Value:**
```po
#. module: quality_management
#: model:ir.model.fields.selection,name:quality_management.selection__quality_checkpoint__state__draft
msgid "Draft"
msgstr "Nháp"
```

### Phân biệt nguồn string:

| Nguồn | Comment Format | Ví dụ |
|-------|---------------|-------|
| **XML View (button, label, string)** | `model_terms:ir.ui.view,arch_db:module.view_id` | Button label, page title |
| **Python (_ function)** | `odoo-python` + `code:addons/module/file.py:0` | Error messages, UserError |
| **Field Label** | `model:ir.model.fields,field_description:...` | Field string |
| **Selection** | `model:ir.model.fields.selection,name:...` | Selection option |
| **Help Text** | `model:ir.model.fields,help:...` | Field help text |

### Cách phòng tránh:

**ĐÚNG:**
1. **KHÔNG BAO GIỜ thêm translation thủ công** trực tiếp vào file `.po`
2. **Quy trình chuẩn:**
   - Update module để code mới có string mới
   - Export translation: Settings → Translations → Export Translation
   - Điền `msgstr` vào file export được
   - Import lại: Settings → Translations → Import Translation
   
3. **Nếu BẮT BUỘC phải thêm thủ công:**
   - Copy NGUYÊN XI format của entry tương tự từ file `.po` hiện có
   - Chỉ thay `msgid` và `msgstr`, GIỮ NGUYÊN comment
   - Export translation ra để kiểm tra lại format

**SAI:**
- ❌ Tự viết comment format
- ❌ Copy comment từ entry khác loại (Python → View)
- ❌ Dùng một comment format cho tất cả strings

### Cách kiểm tra:
```bash
# Sau khi thêm translation, export lại để kiểm tra
# Settings → Translations → Export → Compare với file gốc
```

---

## Useful Commands

```bash
# Restart Odoo container
docker restart odoo-container-name

# View Odoo logs
docker logs --tail 100 odoo-container-name

# Upgrade specific module
docker exec odoo-container-name odoo -d dbname -u module_name --stop-after-init

# Clear Python cache
find . -type d -name __pycache__ -exec rm -rf {} +

# Check running containers
docker ps

# Access Odoo shell
docker exec -it odoo-container-name odoo shell -d dbname
---

## UI/Frontend - Diagram Editor: Lỗi Kéo chuột để lựa chọn nhiều khối (Multi-Select Drag)

### Hiện tượng
1. **Hình preview khu vực lựa chọn không theo đúng con trỏ chuột** - Hộp chọn bị lệch/nhảy khi kéo
2. **Đường kết nối nằm trong khu vực lựa chọn không được chọn** - Kéo khối chứa đường kết nối, đường không được selected
3. **Các khối bị sê dịch sau khi di chuyển** - Sau lần drag đầu tiên, các khối không còn thẳng hàng, khi drag lại nhiều lần sê dịch tích lũy

**File liên quan:** `custom_addons/design_documents/static/src/diagram/detailed_flow/index.html`

### Nguyên nhân chi tiết

#### Lỗi 1: Hình preview không theo con trỏ
- Khi bắt đầu marquee selection, tọa độ được lưu: `marqueeStartX = e.clientX - canvasRect.left + wrapper.scrollLeft`
- Khi di chuyển, tính toán lại từ `canvasRect.left/top` nhưng `canvasRect` là giá trị snapshot từ lần đầu
- Khi canvas scroll hoặc viewport thay đổi, `canvasRect` thay đổi nhưng code không update, dẫn đến mismatch giữa tọa độ bắt đầu và hiện tại
- Hộp preview di chuyển kỳ lạ thay vì theo chính xác con trỏ

**Fix:** Lưu trữ tọa độ **screen (clientX/Y)** thay vì canvas coordinates, sau đó tính toán canvas coordinates lại mỗi lần update từ fresh `canvasRect`

#### Lỗi 2: Connection không được chọn
- `endMarqueeSelection()` chỉ gọi `updateSelectedConnections()` mà không kiểm tra xem đường kết nối có nằm trong vùng drag hay không
- `updateSelectedConnections()` chỉ select connection nếu cả 2 endpoint đã được select (không liên quan đến vùng drag)
- Các connection không được handle trong process marquee selection

**Fix:** 
- Thay đổi logic overlap detection từ "fully contained" sang "AABB collision detection" để flexible hơn
- Trực tiếp xác định và highlight connections có cả 2 endpoint trong vùng selected
- Update visual highlight ngay trong `endMarqueeSelection()` thay vì gọi function riêng

#### Lỗi 3: Khối bị sê dịch sau drag
- Trong `updateMultiDrag()`, chỉ sử dụng integers: `el.style.left = newX + 'px'` (newX có thể là float)
- JavaScript tự động convert float thành string thì làm tròn
- Khi `endMultiDrag()` lưu: `node.x = parseInt(el.style.left)` - mất độ chính xác
- Mỗi lần drag, rounding error tích lũy 0.5-2 pixels → khối bị sê dịch dần

**Fix:**
- Sử dụng **high-precision floating-point arithmetic** xuyên suốt drag process
- Chỉ làm tròn `Math.round()` khi cập nhật DOM style
- Lưu giữ precise floating-point value trong `element.dataset.preciseX/Y`
- Khi `endMultiDrag()`, lấy lại precise value từ dataset để lưu vào data model

### Giải pháp (đã implement)

#### Thay đổi hàm `startMarqueeSelection()`
```javascript
// BEFORE
this.marqueeStartX = e.clientX - canvasRect.left + this.wrapper.scrollLeft;

// AFTER: Lưu screen coordinates
this.marqueeStartScreenX = e.clientX;
this.marqueeStartScreenY = e.clientY;
```

#### Thay đổi hàm `updateMarqueeSelection()`
```javascript
// BEFORE: Tính từ marqueeStartX (không update canvasRect)
const left = Math.min(this.marqueeStartX, currentX);

// AFTER: Tính từ screen coordinates với fresh canvasRect
const startX = (this.marqueeStartScreenX - canvasRect.left) + this.wrapper.scrollLeft;
const left = Math.min(startX, currentX);
```

#### Thay đổi hàm `endMarqueeSelection()`
```javascript
// BEFORE: Kiểm tra fully contained
if (nodeRect.left >= boxRect.left && nodeRect.right <= boxRect.right &&
    nodeRect.top >= boxRect.top && nodeRect.bottom <= boxRect.bottom)

// AFTER: AABB overlap detection (flexible)
if (!(nodeRect.right < boxRect.left || nodeRect.left > boxRect.right ||
      nodeRect.bottom < boxRect.top || nodeRect.top > boxRect.bottom))

// AFTER: Trực tiếp xử lý connections (không gọi updateSelectedConnections)
this.selectedConnIndices = [];
this.data.connections.forEach((conn, idx) => {
    if (this.selectedNodeIds.includes(conn.from) && 
        this.selectedNodeIds.includes(conn.to)) {
        this.selectedConnIndices.push(idx);
    }
});
this.svgLayer.querySelectorAll('path.multi-selected').forEach(path => {
    path.classList.remove('multi-selected');
});
this.selectedConnIndices.forEach(idx => {
    const path = this.svgLayer.querySelector(`path[data-conn-idx="${idx}"]`);
    if (path) path.classList.add('multi-selected');
});
```

#### Thay đổi hàm `startMultiDrag()`
```javascript
// Lưu với parseFloat để giữ precision
this.multiDragStartPositions[nodeId] = { 
    x: parseFloat(node.x), 
    y: parseFloat(node.y) 
};
```

#### Thay đổi hàm `updateMultiDrag()`
```javascript
// Sử dụng floating-point, lưu precise value
el.style.left = Math.round(newX) + 'px';
el.dataset.preciseX = newX;  // Lưu precise value
```

#### Thay đổi hàm `endMultiDrag()`
```javascript
// Lấy precise value từ dataset
if (el.dataset.preciseX !== undefined) {
    node.x = parseFloat(el.dataset.preciseX);
    node.y = parseFloat(el.dataset.preciseY);
    delete el.dataset.preciseX;
    delete el.dataset.preciseY;
}
```

### Kiểm thử
- ✅ Kéo chuột để chọn nhiều khối - hình preview phải theo chính xác con trỏ mà không lệch
- ✅ Các đường kết nối nối 2 khối được chọn phải được highlight
- ✅ Sau khi chọn và kéo khối đi, các khối phải giữ nguyên hàng/cột so với nhau
- ✅ Kéo lại lần 2, 3, ... các khối vẫn thẳng hàng (không sê dịch tích lũy)

---

## 22. X-Frame-Options Blocking Iframe - Static HTML Dashboard

### Hiện tượng
```
Refused to display 'https://mes-cuulongx4.rostek.space/' in a frame because it set 'X-Frame-Options' to 'deny'.
```

Dashboard HTML file được load qua iframe từ Odoo action nhưng bị chặn bởi browser security policy.

### Nguyên nhân
- File HTML static được serve trực tiếp từ `/static/` folder
- Odoo mặc định set `X-Frame-Options: DENY` cho tất cả responses
- Browser block việc load content trong iframe khi header này được set
- Static files không thể custom response headers

### Giải pháp
✅ **Tạo controller route để serve HTML file với custom headers:**

```python
# controllers/doc_statistics_controller.py
import os
from odoo import http
from odoo.http import request

class DocStatisticsController(http.Controller):
    
    @http.route('/design_documents/statistics', type='http', auth='user', methods=['GET'])
    def get_statistics_dashboard(self):
        """Serve the statistics dashboard HTML file with proper headers for iframe embedding"""
        try:
            module_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            html_path = os.path.join(module_path, 'static', 'src', 'dashboard', 'index.html')
            
            # Check if file exists
            if not os.path.exists(html_path):
                return request.make_response(
                    f"<html><body><h1>Error: File not found</h1><p>{html_path}</p></body></html>",
                    status=404
                )
            
            # Read the HTML file
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            response = request.make_response(html_content)
            response.headers['Content-Type'] = 'text/html; charset=utf-8'
            # Allow embedding in iframe from same origin
            response.headers['X-Frame-Options'] = 'SAMEORIGIN'
            # Set CSP to allow iframe embedding (thêm layer bảo mật)
            response.headers['Content-Security-Policy'] = "frame-ancestors 'self'"
            return response
        except Exception as e:
            import traceback
            error_msg = f"<html><body><h1>Error loading dashboard</h1><pre>{traceback.format_exc()}</pre></body></html>"
            return request.make_response(error_msg, status=500)
```

**Action XML sử dụng route này:**
```xml
<record id="action_statistics_dashboard" model="ir.actions.client">
    <field name="name">Thống kê Dashboard</field>
    <field name="tag">StatisticsDashboard</field>
</record>
```

**JS Component load iframe:**
```javascript
// static/src/components/StatisticsDashboard/StatisticsDashboard.js
setup() {
    this.iframeRef = useRef("dashboardIframe");
    this.state = useState({
        isLoading: true,
    });
}

get dashboardUrl() {
    return '/design_documents/statistics';  // Route từ controller
}
```

### Best Practices (Pattern từ SystemDiagramViewer)
```python
# Tạo helper method để reuse
def _serve_html_for_iframe(self, html_relative_path):
    """Helper method to serve HTML files with proper headers for iframe embedding"""
    try:
        module_path = os.path.dirname(os.path.dirname(__file__))
        html_path = os.path.join(module_path, html_relative_path)
        
        if not os.path.exists(html_path):
            return request.make_response(
                f"<html><body><h1>Error: File not found</h1><p>{html_path}</p></body></html>",
                status=404
            )
        
        with open(html_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        response = request.make_response(html_content)
        response.headers['Content-Type'] = 'text/html; charset=utf-8'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Content-Security-Policy'] = "frame-ancestors 'self'"
        return response
    except Exception as e:
        import traceback
        error_msg = f"<html><body><h1>Error loading file</h1><pre>{traceback.format_exc()}</pre></body></html>"
        return request.make_response(error_msg, status=500)

# Sử dụng helper
@http.route('/design_documents/statistics', type='http', auth='user')
def serve_statistics(self):
    return self._serve_html_for_iframe('static/src/dashboard/index.html')

@http.route('/design_documents/diagram', type='http', auth='user')
def serve_diagram(self):
    return self._serve_html_for_iframe('static/src/diagram/index.html')
```

### Key Points
- ⚠️ **KHÔNG** link trực tiếp tới static file: `/static/src/dashboard/index.html`
- ✅ **PHẢI** tạo controller route để serve file với custom headers
- ✅ Set `X-Frame-Options: SAMEORIGIN` để cho phép iframe trong cùng domain
- ✅ Set `Content-Type: text/html; charset=utf-8` để browser render đúng
- 🔄 Sau khi thêm controller, **PHẢI restart Odoo** để route được đăng ký

### Các giá trị X-Frame-Options
- `DENY` - Không cho phép load trong iframe (mặc định của Odoo)
- `SAMEORIGIN` - Chỉ cho phép iframe trong cùng domain ✅ (khuyến nghị)
- `ALLOW-FROM uri` - Cho phép từ domain cụ thể (deprecated)

---

## Useful Commands

```bash
# Restart Odoo container
docker restart odoo-container-name

# View Odoo logs
docker logs --tail 100 odoo-container-name

# Upgrade specific module
docker exec odoo-container-name odoo -d dbname -u module_name --stop-after-init

# Clear Python cache
find . -type d -name __pycache__ -exec rm -rf {} +

# Check running containers
docker ps

# Access Odoo shell
docker exec -it odoo-container-name odoo shell -d dbname
```
```

---

## Tài Liệu Tham Khảo

- [Odoo 18 Documentation](https://www.odoo.com/documentation/18.0/)
- [Odoo 18 Migration Guide](https://www.odoo.com/documentation/18.0/developer/howtos/upgrade.html)
- [Domain Filters](https://www.odoo.com/documentation/18.0/developer/reference/backend/orm.html#domains)
- [View Architecture](https://www.odoo.com/documentation/18.0/developer/reference/backend/views.html)
