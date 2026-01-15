const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 数据存储文件
const DATA_FILE = 'data.json';

// 从文件加载数据
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('加载数据文件失败:', error);
  }
  return {};
}

// 保存数据到文件
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('数据已保存到文件');
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
}

// 房源状态
let houseStatus = loadData();

// 初始化房源状态（如果文件为空）
function initializeHouseStatus() {
  if (Object.keys(houseStatus).length > 0) {
    console.log('从文件加载了数据，房间数量:', Object.keys(houseStatus).length);
    return;
  }
  
  console.log('数据文件为空，正在初始化...');
  houseStatus = {};
  
  // 4号楼 1单元
  for (let floor = 18; floor >= 1; floor--) {
    const room1Id = floor === 1 ? '4-1-101' : `4-1-${floor}01`;
    const room2Id = floor === 1 ? '4-1-102' : `4-1-${floor}02`;
    houseStatus[room1Id] = false;
    houseStatus[room2Id] = false;
  }
  
  // 4号楼 2单元
  for (let floor = 18; floor >= 1; floor--) {
    const room1Id = floor === 1 ? '4-2-101' : `4-2-${floor}01`;
    const room2Id = floor === 1 ? '4-2-102' : `4-2-${floor}02`;
    houseStatus[room1Id] = false;
    houseStatus[room2Id] = false;
  }
  
  // 4号楼 3单元
  for (let floor = 18; floor >= 1; floor--) {
    const room1Id = floor === 1 ? '4-3-101' : `4-3-${floor}01`;
    const room2Id = floor === 1 ? '4-3-102' : `4-3-${floor}02`;
    houseStatus[room1Id] = false;
    houseStatus[room2Id] = false;
  }
  
  // 5号楼 1单元
  for (let floor = 6; floor >= 1; floor--) {
    const room1Id = floor === 1 ? '5-1-101' : `5-1-${floor}01`;
    const room2Id = floor === 1 ? '5-1-102' : `5-1-${floor}02`;
    houseStatus[room1Id] = false;
    houseStatus[room2Id] = false;
  }
  
  // 5号楼 2单元
  for (let floor = 6; floor >= 1; floor--) {
    const room1Id = floor === 1 ? '5-2-101' : `5-2-${floor}01`;
    const room2Id = floor === 1 ? '5-2-102' : `5-2-${floor}02`;
    houseStatus[room1Id] = false;
    houseStatus[room2Id] = false;
  }
  
  // 5号楼 3单元
  for (let floor = 6; floor >= 1; floor--) {
    const room1Id = floor === 1 ? '5-3-101' : `5-3-${floor}01`;
    const room2Id = floor === 1 ? '5-3-102' : `5-3-${floor}02`;
    houseStatus[room1Id] = false;
    houseStatus[room2Id] = false;
  }
  
  // 车位
  for (let i = 1; i <= 62; i++) {
    houseStatus[`车位-A${i}`] = false;
  }
  for (let i = 8; i <= 19; i++) {
    houseStatus[`车位-B${i}`] = false;
  }
  for (let i = 43; i <= 48; i++) {
    houseStatus[`车位-B${i}`] = false;
  }
  for (let i = 1; i <= 44; i++) {
    houseStatus[`车位-C${i}`] = false;
  }
  
  // 仓房
  for (let i = 1; i <= 10; i++) {
    houseStatus[`仓房-4#下Z${i}`] = false;
  }
  for (let i = 11; i <= 32; i++) {
    houseStatus[`仓房-5#下Z${i}`] = false;
  }
  for (let i = 33; i <= 39; i++) {
    houseStatus[`仓房-Z${i}`] = false;
  }
  
  saveData(houseStatus);
  console.log('初始化完成，总房间数:', Object.keys(houseStatus).length);
}

// 存储连接的客户端
const clients = {
  admin: new Set(),
  display: new Set()
};

// WebSocket连接处理
wss.on('connection', (ws, req) => {
  console.log('新客户端连接');
  
  let clientType = 'display';
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // 客户端注册
      if (data.type === 'register') {
        clientType = data.clientType;
        if (clientType === 'admin') {
          clients.admin.add(ws);
          console.log('管理员页面已连接');
          
          // 发送当前所有状态
          ws.send(JSON.stringify({
            type: 'init',
            data: houseStatus
          }));
        } else {
          clients.display.add(ws);
          console.log('展示页面已连接');
          
          ws.send(JSON.stringify({
            type: 'init',
            data: houseStatus
          }));
        }
      }
      
      // 处理状态更新
      if (data.type === 'update-status' && clientType === 'admin') {
        const { roomId, isSold } = data;
        console.log(`更新房间状态: ${roomId} -> ${isSold}`);
        
        // 更新状态
        if (houseStatus.hasOwnProperty(roomId)) {
          houseStatus[roomId] = isSold;
          
          // 保存到文件
          saveData(houseStatus);
          
          // 广播给所有展示页面
          broadcastToDisplays({
            type: 'status-update',
            roomId,
            isSold
          });
          
          // 确认给管理员
          ws.send(JSON.stringify({
            type: 'update-success',
            roomId,
            isSold
          }));
        }
      }
      
      // 处理批量导入
      if (data.type === 'batch-import' && clientType === 'admin') {
        const { soldRooms, soldPw } = data;
        console.log('处理批量导入');
        
        // 重置所有状态为false
        Object.keys(houseStatus).forEach(key => {
          houseStatus[key] = false;
        });
        
        // 设置已售房源
        if (soldRooms) {
          soldRooms.forEach(roomId => {
            if (houseStatus.hasOwnProperty(roomId)) {
              houseStatus[roomId] = true;
            }
          });
        }
        
        // 设置车位/仓房
        if (soldPw) {
          soldPw.forEach(pwId => {
            if (houseStatus.hasOwnProperty(pwId)) {
              houseStatus[pwId] = true;
            }
          });
        }
        
        // 保存到文件
        saveData(houseStatus);
        
        // 广播全量更新
        broadcastToDisplays({
          type: 'full-update',
          data: houseStatus
        });
        
        ws.send(JSON.stringify({
          type: 'import-success'
        }));
      }
      
      // 处理重置请求
      if (data.type === 'reset-all' && clientType === 'admin') {
        console.log('收到重置请求');
        
        Object.keys(houseStatus).forEach(key => {
          houseStatus[key] = false;
        });
        
        saveData(houseStatus);
        
        broadcastToDisplays({
          type: 'full-update',
          data: houseStatus
        });
        
        ws.send(JSON.stringify({
          type: 'reset-success'
        }));
      }
      
    } catch (error) {
      console.error('处理消息错误:', error);
    }
  });
  
  ws.on('close', () => {
    if (clientType === 'admin') {
      clients.admin.delete(ws);
      console.log('管理员页面断开连接');
    } else {
      clients.display.delete(ws);
      console.log('展示页面断开连接');
    }
  });
});

// 广播给所有展示页面
function broadcastToDisplays(message) {
  const messageStr = JSON.stringify(message);
  clients.display.forEach(client => {
    if (client.readyState === 1) {
      client.send(messageStr);
    }
  });
}

// HTTP接口
app.get('/api/status', (req, res) => {
  res.json(houseStatus);
});

app.get('/api/init', (req, res) => {
  initializeHouseStatus();
  res.json({ success: true, message: '初始化完成' });
});

app.get('/api/backup', (req, res) => {
  const data = JSON.stringify(houseStatus, null, 2);
  res.setHeader('Content-Disposition', 'attachment; filename="house-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.post('/api/restore', express.json(), (req, res) => {
  try {
    const newData = req.body;
    // 验证数据格式
    if (typeof newData === 'object' && newData !== null) {
      houseStatus = newData;
      saveData(houseStatus);
      
      // 广播更新
      broadcastToDisplays({
        type: 'full-update',
        data: houseStatus
      });
      
      res.json({ success: true, message: '数据恢复成功' });
    } else {
      res.status(400).json({ error: '无效的数据格式' });
    }
  } catch (error) {
    res.status(500).json({ error: '恢复失败' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=== 服务器已启动 ===`);
  console.log(`- 端口: ${PORT}`);
  
  // 初始化数据
  initializeHouseStatus();
  
  console.log(`- 总房间数: ${Object.keys(houseStatus).length}`);
  console.log(`- 数据文件: ${DATA_FILE}`);
  console.log(`\n=== 访问地址 ===`);
  console.log(`- 主页面: http://localhost:${PORT}`);
  console.log(`- 管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`- 展示页面: http://localhost:${PORT}/layout.html`);
  console.log(`- 数据备份: http://localhost:${PORT}/api/backup`);
});