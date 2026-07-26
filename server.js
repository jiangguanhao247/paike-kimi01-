const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// 确保数据库目录存在
const dbDir = path.join(__dirname, 'db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

const dbPath = path.join(dbDir, 'schedule.db');
const db = new sqlite3.Database(dbPath);

// 初始化表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS schedule_data (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    data TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 插入默认空数据（如果不存在）
  db.run(`INSERT OR IGNORE INTO schedule_data (id, data) VALUES (1, '{}')`);
});

// 获取数据
app.get('/api/data', (req, res) => {
  db.get('SELECT data FROM schedule_data WHERE id = 1', (err, row) => {
    if (err) {
      console.error('读取失败:', err);
      return res.status(500).json({ error: '读取失败' });
    }
    if (!row) {
      db.run('INSERT INTO schedule_data (id, data) VALUES (1, ?)', ['{}']);
      return res.json({});
    }
    try {
      const data = JSON.parse(row.data);
      res.json(data);
    } catch (e) {
      res.json({});
    }
  });
});

// 保存数据
app.post('/api/data', (req, res) => {
  const data = req.body;
  const jsonStr = JSON.stringify(data);
  db.run(
    'UPDATE schedule_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [jsonStr],
    function(err) {
      if (err) {
        console.error('保存失败:', err);
        return res.status(500).json({ error: '保存失败' });
      }
      res.json({ success: true, message: '保存成功' });
    }
  );
});

// 导出数据（下载JSON文件）
app.get('/api/export', (req, res) => {
  db.get('SELECT data FROM schedule_data WHERE id = 1', (err, row) => {
    if (err || !row) {
      return res.status(500).json({ error: '导出失败' });
    }
    const filename = `排课数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(row.data);
  });
});

// 导入数据
app.post('/api/import', (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: '数据格式不正确' });
  }
  const jsonStr = JSON.stringify(data);
  db.run(
    'UPDATE schedule_data SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [jsonStr],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '导入失败' });
      }
      res.json({ success: true, message: '导入成功' });
    }
  );
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`====================================`);
  console.log(`  智能排课系统 - 数据库版`);
  console.log(`  服务器运行在 http://localhost:${PORT}`);
  console.log(`====================================`);
  console.log(`  请通过以下地址访问系统：`);
  console.log(`  http://localhost:${PORT}/pages/base-data.html`);
  console.log(`====================================`);
});