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

# PHỤ LỤC: Tích hợp Process Flow với DigiHub Backend (PostgreSQL)

## Tổng quan

Tài liệu này ghi lại các thay đổi để tích hợp Process Flow Editor với database của DigiHub MES thay vì chỉ lưu localStorage. Được thực hiện vào ngày 20/02/2026.

---

## 1. Database Migration

Tạo bảng mới `process_flow_diagrams` để lưu trữ dữ liệu sơ đồ theo project.

**File:** `backend/database/20260220000001-add-process-flow-diagrams.sql`

```sql
-- Migration: Add Process Flow Diagrams Table
-- This stores the visual process flow diagram data per project

-- =====================
-- PROCESS FLOW DIAGRAMS Table
-- =====================
CREATE TABLE IF NOT EXISTS process_flow_diagrams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
    modules_config JSONB DEFAULT '[]'::jsonb,
    module_data JSONB DEFAULT '{}'::jsonb,
    connection_data JSONB DEFAULT '{}'::jsonb,
    module_connections JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_process_flow_diagrams_project_id ON process_flow_diagrams(project_id);

-- Add comment for documentation
COMMENT ON TABLE process_flow_diagrams IS 'Stores visual process flow diagram data (modules, positions, connections) for each project';
COMMENT ON COLUMN process_flow_diagrams.modules_config IS 'Array of module configurations with position, style, submodules';
COMMENT ON COLUMN process_flow_diagrams.module_data IS 'Mapping of module ID to its data';
COMMENT ON COLUMN process_flow_diagrams.connection_data IS 'Mapping of submodule codes to connections';
COMMENT ON COLUMN process_flow_diagrams.module_connections IS 'Array of module-to-module connections';
```

**Chạy migration:**
```bash
psql -U your_username -d digihub -f backend/database/20260220000001-add-process-flow-diagrams.sql
```

---

## 2. API Routes

Tạo API endpoints để load/save diagram từ database.

**File:** `backend/routes/processFlow.js`

```javascript
/**
 * Process Flow Diagram API Routes
 * Handles saving and loading process flow diagrams for projects
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get diagram for a project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await db.query(
      `SELECT * FROM process_flow_diagrams WHERE project_id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          modulesConfig: [],
          moduleData: {},
          connectionData: {},
          moduleConnections: []
        }
      });
    }

    const diagram = result.rows[0];
    res.json({
      success: true,
      data: {
        modulesConfig: diagram.modules_config || [],
        moduleData: diagram.module_data || {},
        connectionData: diagram.connection_data || {},
        moduleConnections: diagram.module_connections || []
      }
    });
  } catch (error) {
    console.error('Get process flow diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch process flow diagram'
    });
  }
});

// Save diagram for a project
router.post('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { modulesConfig, moduleData, connectionData, moduleConnections } = req.body;

    // Check if diagram already exists
    const existing = await db.query(
      `SELECT id FROM process_flow_diagrams WHERE project_id = $1`,
      [projectId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing
      result = await db.query(
        `UPDATE process_flow_diagrams SET
          modules_config = $1,
          module_data = $2,
          connection_data = $3,
          module_connections = $4,
          updated_at = CURRENT_TIMESTAMP
         WHERE project_id = $5
         RETURNING *`,
        [modulesConfig, moduleData, connectionData, moduleConnections, projectId]
      );
    } else {
      // Insert new
      result = await db.query(
        `INSERT INTO process_flow_diagrams (
          project_id, modules_config, module_data, connection_data, module_connections, created_by
         ) VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [projectId, modulesConfig, moduleData, connectionData, moduleConnections, req.user.id]
      );
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Process flow diagram saved successfully'
    });
  } catch (error) {
    console.error('Save process flow diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save process flow diagram'
    });
  }
});

// Delete diagram for a project
router.delete('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    await db.query(
      `DELETE FROM process_flow_diagrams WHERE project_id = $1`,
      [projectId]
    );

    res.json({
      success: true,
      message: 'Process flow diagram deleted successfully'
    });
  } catch (error) {
    console.error('Delete process flow diagram error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete process flow diagram'
    });
  }
});

module.exports = router;
```

**Đăng ký route trong server.js:**
```javascript
// Thêm vào backend/server.js
app.use('/api/process-flow', require('./routes/processFlow'));
```

---

## 3. Frontend - Process Flow Editor

Cập nhật `process-flow-editor.html` để sử dụng API thay vì chỉ localStorage.

### 3.1 Load từ API (ưu tiên) → Fallback localStorage

```javascript
// Load from API - primary source
async function loadFromAPI() {
    try {
        const token = localStorage.getItem('digihub_token');
        if (!token) {
            console.log('[ProcessFlow] No token, using localStorage');
            loadFromStorage();
            return;
        }

        const response = await fetch(`/api/process-flow/project/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
                const { modulesConfig: mc, moduleData: md, connectionData: cd, moduleConnections: mconn } = result.data;

                // Only use API data if it has content
                if (mc && (mc.length > 0 || Object.keys(md || {}).length > 0 || Object.keys(cd || {}).length > 0)) {
                    console.log('[ProcessFlow] Loaded from API');
                    modulesConfig = mc || [];
                    moduleData = md || {};
                    connectionData = cd || {};
                    window._pendingModuleConnections = mconn || [];

                    // Also save to localStorage as backup
                    saveToStorage();
                    renderModules();
                    return;
                }
            }
        }
    } catch(e) {
        console.warn('[ProcessFlow] API load failed, trying localStorage:', e.message);
    }

    // Fall back to localStorage if API fails or returns empty
    loadFromStorage();
}
```

### 3.2 Save to API (ưu tiên) → Fallback localStorage

```javascript
// Save to API - primary storage
async function saveToAPI() {
    try {
        const token = localStorage.getItem('digihub_token');
        if (!token) {
            console.log('[ProcessFlow] No token, saving to localStorage only');
            saveToStorage();
            return;
        }

        const response = await fetch(`/api/process-flow/project/${projectId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                modulesConfig,
                moduleData,
                connectionData,
                moduleConnections: window._canvas?.moduleConnections || []
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                console.log('[ProcessFlow] Saved to API');
                // Also keep localStorage as backup
                saveToStorage();
                return;
            }
        }
    } catch(e) {
        console.warn('[ProcessFlow] API save failed:', e.message);
    }

    // Fall back to localStorage
    saveToStorage();
}
```

### 3.3 Cập nhật các hàm gọi save

Cập nhật các vị trí gọi save trong InfiniteCanvas class:

| Hàm | Trước | Sau |
|-----|-------|-----|
| `autoSave()` | `saveToStorage()` | `saveToAPI()` |
| `save()` | `saveToStorage()` | `await saveToAPI()` |
| `restoreState()` | `saveToStorage()` | `saveToAPI()` |
| `handleImportFile()` | `saveToStorage()` | `saveToAPI()` |

---

## 4. Luồng dữ liệu

```
┌─────────────────────────────────────────────────────────────────┐
│                  Process Flow Editor (Frontend)                │
│                                                                  │
│  1. Init → loadFromAPI()                                        │
│        ↓                                                         │
│     API call → /api/process-flow/project/:projectId           │
│        ↓                                                         │
│     Nếu có data → Dùng data từ API                             │
│     Nếu không có  → Fallback về localStorage                   │
│                                                                  │
│  2. User thay đổi → autoSave() / save() → saveToAPI()         │
│        ↓                                                         │
│     POST /api/process-flow/project/:projectId                  │
│        ↓                                                         │
│     Nếu thành công → Lưu vào localStorage (backup)            │
│     Nếu thất bại  → Fallback về localStorage                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    JSON Request (Bearer Token)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DigiHub Backend (Express.js)                 │
│                                                                  │
│  GET /api/process-flow/project/:projectId                       │
│       ↓                                                          │
│    PostgreSQL: SELECT * FROM process_flow_diagrams              │
│       ↓                                                          │
│    Return JSON: { modulesConfig, moduleData, connectionData,    │
│                   moduleConnections }                           │
│                                                                  │
│  POST /api/process-flow/project/:projectId                      │
│       ↓                                                          │
│    Check exists → INSERT or UPDATE                              │
│       ↓                                                          │
│    PostgreSQL: INSERT/UPDATE process_flow_diagrams             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                        │
│                                                                  │
│  process_flow_diagrams:                                         │
│  - project_id (UUID, unique)                                    │
│  - modules_config (JSONB)                                      │
│  - module_data (JSONB)                                          │
│  - connection_data (JSONB)                                      │
│  - module_connections (JSONB)                                  │
│  - created_by, created_at, updated_at                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Xác thực (Authentication)

- Tất cả API endpoints yêu cầu token xác thực (Bearer token)
- Token được lấy từ `localStorage.getItem('digihub_token')`
- Middleware `auth` trong backend xử lý việc xác thực
- Nếu không có token → Fallback về localStorage

---

## 6. Chạy migration thủ công

Để database hoạt động, cần chạy migration:

```bash
# Di chuyển đến thư mục project
cd /path/to/all-in-one-team-and-project-management

# Chạy migration bằng psql
psql -U postgres -d digihub -f backend/database/20260220000001-add-process-flow-diagrams.sql

# Hoặc sử dụng Node.js init script nếu có
node backend/init.js
```

---

## 7. Tóm tắt các files đã tạo/sửa

| Loại | File | Mô tả |
|------|------|-------|
| Tạo mới | `backend/database/20260220000001-add-process-flow-diagrams.sql` | Migration tạo bảng process_flow_diagrams |
| Tạo mới | `backend/routes/processFlow.js` | API routes cho load/save/delete diagram |
| Sửa | `backend/server.js` | Thêm route `/api/process-flow` |
| Sửa | `process-flow-editor.html` | Thêm loadFromAPI(), saveToAPI(), cập nhật các hàm save |

---

## 8. Testing

Sau khi hoàn thành tích hợp:

1. **Đăng nhập** vào DigiHub MES
2. **Vào Process Flow** và chọn một project
3. **Tạo/Edit** sơ đồ (thêm modules, submodules, connections)
4. **Click Lưu** hoặc đợi auto-save
5. **Refresh trang** - sơ đồ sẽ được load từ API database
6. **Đăng nhập từ trình duyệt khác** - verify data được sync

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

