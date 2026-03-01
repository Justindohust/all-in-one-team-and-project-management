# Hướng dẫn Lưu Sơ đồ Hệ thống vào CSDL Remote (Odoo Backend)

## Tổng quan

File `index.html` này là một ứng dụng web Odoo cho phép vẽ và quản lý sơ đồ hệ thống. Tất cả dữ liệu khi thay đổi đều được lưu trực tiếp vào **CSDL Odoo** (database remote) thông qua JSON-RPC API.

---

## Kiến trúc dữ liệu

### 3 Models chính trong Odoo:

```
system.diagram.module      → Module (khối chính trên sơ đồ)
system.diagram.submodule   → Submodule (chức năng bên trong module)  
system.diagram.connection  → Connection (đường kết nối giữa các submodule)
```

### Mối quan hệ:
- **Module** có nhiều **Submodule** (one2many)
- **Submodule** có nhiều **Connection** (one2many - qua source_id)
- **Connection** nối Source Submodule → Target Submodule (many2one)

---

## Các API Endpoints

### 1. Lấy dữ liệu sơ đồ

**Endpoint:** `POST /design_documents/system_diagram/data`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/data', {});
```

**Backend trả về:**
```json
{
  "success": true,
  "data": {
    "modules": [...],
    "moduleData": {...},
    "connectionData": {...},
    "moduleConnections": [...]
  }
}
```

---

### 2. Tạo Module mới

**Endpoint:** `POST /design_documents/system_diagram/create_module`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/create_module', {
  name: 'Tên Module',
  code: 'module-123',
  icon: 'fas fa-cube',
  color: 'production',
  x: 100,
  y: 200
});
```

**Tham số:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| name | String | ✅ | Tên hiển thị của module |
| code | String | ✅ | Mã định danh duy nhất |
| icon | String | ❌ | Font Awesome icon class |
| color | String | ❌ | Màu sắc (production, equipment, order, quality...) |
| x | Number | ❌ | Tọa độ X trên canvas |
| y | Number | ❌ | Tọa độ Y trên canvas |

**Backend Python:**
```python
@http.route('/design_documents/system_diagram/create_module', type='json', auth='user')
def create_module(self, name, code, icon='fas fa-cube', color='production', x=100, y=100):
    module = request.env['system.diagram.module'].create({
        'name': name,
        'code': code,
        'icon': icon,
        'color': color,
        'position_x': x,
        'position_y': y,
        'width': 240,
        'text_align': 'center'
    })
    return {'success': True, 'module': {...}}
```

---

### 3. Cập nhật Module

**Endpoint:** `POST /design_documents/system_diagram/update_module`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/update_module', {
  module_code: 'module-123',
  name: 'Tên mới',
  // icon, color, description là tùy chọn
});
```

**Tham số:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| module_code | String | ✅ | Mã module cần cập nhật |
| name | String | ❌ | Tên mới |
| icon | String | ❌ | Icon mới |
| color | String | ❌ | Màu mới |
| description | String | ❌ | Mô tả mới |

**Backend Python:**
```python
@http.route('/design_documents/system_diagram/update_module', type='json', auth='user')
def update_module(self, module_code, name=None, icon=None, color=None, description=None):
    module = request.env['system.diagram.module'].search([('code', '=', module_code)], limit=1)
    update_vals = {}
    if name is not None:
        update_vals['name'] = name
    # ... các trường khác
    if update_vals:
        module.write(update_vals)
    return {'success': True}
```

---

### 4. Xóa Module

**Endpoint:** `POST /design_documents/system_diagram/delete_module`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/delete_module', {
  module_code: 'module-123'
});
```

**Backend Python:** Sử dụng `unlink()` - cascade sẽ xóa các Submodule và Connection liên quan

---

### 5. Tạo Submodule mới

**Endpoint:** `POST /design_documents/system_diagram/create_submodule`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/create_submodule', {
  module_code: 'module-123',
  name: 'Danh sách máy phay',
  code: 'module-123-sub-1',
  icon: 'fas fa-industry',
  description: 'Mô tả chức năng...'
});
```

**Tham số:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| module_code | String | ✅ | Mã module cha |
| name | String | ✅ | Tên submodule |
| code | String | ✅ | Mã định danh duy nhất |
| icon | String | ❌ | Font Awesome icon |
| description | String | ❌ | Mô tả chi tiết |

---

### 6. Cập nhật Submodule

**Endpoint:** `POST /design_documents/system_diagram/update_submodule`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/update_submodule', {
  submodule_code: 'module-123-sub-1',
  name: 'Tên mới',
  // icon, description là tùy chọn
});
```

---

### 7. Xóa Submodule

**Endpoint:** `POST /design_documents/system_diagram/delete_submodule`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/delete_submodule', {
  submodule_code: 'module-123-sub-1'
});
```

---

### 8. Tạo Connection (Liên kết)

**Endpoint:** `POST /design_documents/system_diagram/create_connection`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/create_connection', {
  source_code: 'module-123-sub-1',
  target_code: 'module-456-sub-2',
  connection_type: 'data-flow',  // 'data-flow', 'reference', 'output'
  description: 'Mô tả luồng dữ liệu...'
});
```

**Tham số:**
| Tham số | Kiểu | Bắt buộc | Mô tả |
|---------|------|----------|-------|
| source_code | String | ✅ | Mã submodule nguồn |
| target_code | String | ✅ | Mã submodule đích |
| connection_type | String | ❌ | Loại liên kết |
| description | String | ❌ | Mô tả chi tiết |

---

### 9. Xóa Connection

**Endpoint:** `POST /design_documents/system_diagram/delete_connection`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/delete_connection', {
  source_code: 'module-123-sub-1',
  target_code: 'module-456-sub-2'
});
```

---

### 10. Import toàn bộ sơ đồ

**Endpoint:** `POST /design_documents/system_diagram/import_diagram`

**Frontend gọi:**
```javascript
await callOdooAPI('/design_documents/system_diagram/import_diagram', {
  modules: [...],
  moduleData: {...},
  connections: [...],
  moduleConnections: [...]
});
```

**Logic:**
1. Xóa toàn bộ dữ liệu hiện tại (`Module.search([]).unlink()`)
2. Tạo lại tất cả từ JSON được import

---

## Quy trình xử lý từ Frontend

### Khi người dùng chỉnh sửa sơ đồ:

```
[User Action] → [Update local state] → [Save to history] → [Call API] → [Save to Odoo DB]
```

### Ví dụ: Khi đổi tên Module

```javascript
// 1. Double-click vào tên module → hiện input
// 2. User nhập tên mới → blur
// 3. Cập nhật local state
module.name = newName;

// 4. Gọi API lưu vào database
const result = await callOdooAPI('/design_documents/system_diagram/update_module', {
    module_code: moduleId,
    name: newName
});

// 5. Auto-save (debounce)
this.autoSave();
```

### Ví dụ: Khi tạo Connection mới

```javascript
// 1. User chọn submodule nguồn → Click "Thêm Liên kết"
// 2. Điền form → Submit
// 3. Cập nhật local state
connectionData[sourceCode].connections.push(newConn);

// 4. Gọi API
const result = await callOdooAPI('/design_documents/system_diagram/create_connection', {
    source_code: sourceCode,
    target_code: targetCode,
    connection_type: type,
    description: desc
});

// 5. Refresh view
this.showDetailPanel(connectionData[sourceCode]);
this.drawSubmoduleConnections(sourceCode, connectionData[sourceCode]);
```

---

## Hàm callOdooAPI (Utility)

```javascript
async function callOdooAPI(endpoint, params = {}) {
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: params,
                id: Math.random()
            })
        });
        
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error.data.message || 'API Error');
        }
        return data.result;
    } catch (e) {
        console.error('[API] Call failed:', e);
        throw e;
    }
}
```

---

## Cách áp dụng cho Project khác

### Bước 1: Tạo Models trong Odoo

```python
# models/system_diagram.py
from odoo import models, fields

class SystemDiagramModule(models.Model):
    _name = 'system.diagram.module'
    _description = 'System Diagram Module'
    
    name = fields.Char(required=True)
    code = fields.Char(required=True, unique=True)
    icon = fields.Char(default='fas fa-cube')
    color = fields.Char(default='production')
    position_x = fields.Integer(default=100)
    position_y = fields.Integer(default=100)
    width = fields.Integer(default=240)
    text_align = fields.Char(default='center')
    description = fields.Text()
    
    submodule_ids = fields.One2many('system.diagram.submodule', 'module_id')

class SystemDiagramSubmodule(models.Model):
    _name = 'system.diagram.submodule'
    _description = 'System Diagram Submodule'
    
    name = fields.Char(required=True)
    code = fields.Char(required=True, unique=True)
    module_id = fields.Many2one('system.diagram.module', required=True)
    icon = fields.Char(default='fas fa-circle')
    description = fields.Text()
    sequence = fields.Integer(default=10)
    
    source_connection_ids = fields.One2many('system.diagram.connection', 'source_id')
    target_connection_ids = fields.One2many('system.diagram.connection', 'target_id')

class SystemDiagramConnection(models.Model):
    _name = 'system.diagram.connection'
    _description = 'System Diagram Connection'
    
    source_id = fields.Many2one('system.diagram.submodule', required=True)
    target_id = fields.Many2one('system.diagram.submodule', required=True)
    connection_type = fields.Char(default='data-flow')
    description = fields.Text()
```

### Bước 2: Tạo Controller với các API Endpoints

```python
# controllers/system_diagram_controller.py
from odoo import http
from odoo.http import request

class SystemDiagramController(http.Controller):
    
    @http.route('/your_module/data', type='json', auth='user')
    def get_data(self):
        # Trả về tất cả dữ liệu
        modules = request.env['system.diagram.module'].search_read([])
        # ...
        return {'success': True, 'data': {...}}
    
    @http.route('/your_module/create_module', type='json', auth='user')
    def create_module(self, name, code, **kwargs):
        module = request.env['system.diagram.module'].create({
            'name': name,
            'code': code,
            **kwargs
        })
        return {'success': True, 'module': {...}}
    
    # ... các endpoint khác tương tự
```

### Bước 3: Gọi API từ Frontend

```javascript
// Sử dụng callOdooAPI tương tự như trên
// Thay đổi endpoint từ '/design_documents/system_diagram/...' 
// thành '/your_module/...'
```

---

## Lưu ý quan trọng

1. **Auth**: Tất cả API đều sử dụng `auth='user'` - yêu cầu đăng nhập Odoo
2. **JSON-RPC**: Odoo sử dụng định dạng JSON-RPC 2.0 với cấu trúc:
   ```json
   {
     "jsonrpc": "2.0",
     "method": "call",
     "params": {...},
     "id": random
   }
   ```
3. **Error Handling**: Luôn kiểm tra `result.success` trước khi xử lý tiếp
4. **Cascade Delete**: Khi xóa Module, các Submodule và Connection sẽ tự động bị xóa (nếu có cascade trong model)
5. **Local State**: Frontend vẫn giữ local state để hiển thị, nhưng mọi thay đổi đều được đồng bộ ngay vào database

---

## Tóm tắt luồng dữ liệu

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (index.html)                    │
│                                                                  │
│  User Action → Update JS Objects → callOdooAPI() → Backend     │
│       ↑                                                        │
│       └──────────────── refresh view ←────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    JSON-RPC Request
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Odoo Controller)                   │
│                                                                  │
│  /your_module/create_*  →  ORM create()  →  Database           │
│  /your_module/update_* →  ORM write()    →  Database           │
│  /your_module/delete_* →  ORM unlink()   →  Database           │
│  /your_module/data     →  search_read() →  Return JSON         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                        │
│                                                                  │
│  system.diagram.module     ←──── one2many ──── system.diagram.submodule │
│         ↓                                                                     │
│         └────────────── one2many ──────────────── system.diagram.connection │
└─────────────────────────────────────────────────────────────────┘
```

