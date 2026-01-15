const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 存储房源状态
let houseStatus = {};

// 从数据库加载数据
async function loadFromDatabase() {
  try {
    const { data, error } = await supabase
      .from('house_status')
      .select('*');
    
    if (error) {
      console.log('数据库为空或错误:', error.message);
      return {};
    }
    
    const result = {};
    data.forEach(item => {
      result[item.room_id] = item.is_sold;
    });
    
    console.log(`从数据库加载了 ${data.length} 条数据`);
    return result;
  } catch (error) {
    console.error('加载数据失败:', error);
    return {};
  }
}

// 更新数据库
async function updateDatabase(roomId, isSold) {
  try {
    const { error } = await supabase
      .from('house_status')
      .upsert({ 
        room_id: roomId, 
        is_sold: isSold,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('更新数据库失败:', error);
    return false;
  }
}

// 初始化数据库
async function initializeDatabase() {
  try {
    console.log('正在初始化数据库...');
    
    // 检查是否有数据
    const { data, error } = await supabase
      .from('house_status')
      .select('room_id')
      .limit(1);
    
    if (error) {
      console.log('创建表可能不存在，需要创建');
    }
    
    if (!data || data.length === 0) {
      console.log('数据库为空，创建默认数据...');
      
      // 创建所有房源
      const allRooms = [];
      
      // 4号楼 1单元
      for (let floor = 18; floor >= 1; floor--) {
        const room1Id = floor === 1 ? '4-1-101' : `4-1-${floor}01`;
        const room2Id = floor === 1 ? '4-1-102' : `4-1-${floor}02`;
        allRooms.push({ room_id: room1Id, is_sold: false });
        allRooms.push({ room_id: room2Id, is_sold: false });
      }
      
      // 4号楼 2单元
      for (let floor = 18; floor >= 1; floor--) {
        const room1Id = floor === 1 ? '4-2-101' : `4-2-${floor}01`;
        const room2Id = floor === 1 ? '4-2-102' : `4-2-${floor}02`;
        allRooms.push({ room_id: room1Id, is_sold: false });
        allRooms.push({ room_id: room2Id, is_sold: false });
      }
      
      // 4号楼 3单元
      for (let floor = 18; floor >= 1; floor--) {
        const room1Id = floor === 1 ? '4-3-101' : `4-3-${floor}01`;
        const room2Id = floor === 1 ? '4-3-102' : `4-3-${floor}02`;
        allRooms.push({ room_id: room1Id, is_sold: false });
        allRooms.push({ room_id: room2Id, is_sold: false });
      }
      
      // 5号楼 1单元
      for (let floor = 6; floor >= 1; floor--) {
        const room1Id = floor === 1 ? '5-1-101' : `5-1-${floor}01`;
        const room2Id = floor === 1 ? '5-1-102' : `5-1-${floor}02`;
        allRooms.push({ room_id: room1Id, is_sold: false });
        allRooms.push({ room_id: room2Id, is_sold: false });
      }
      
      // 5号楼 2单元
      for (let floor = 6; floor >= 1; floor--) {
        const room1Id = floor === 1 ? '5-2-101' : `5-2-${floor}01`;
        const room2Id = floor === 1 ? '5-2-102' : `5-2-${floor}02`;
        allRooms.push({ room_id: room1Id, is_sold: false });
        allRooms.push({ room_id: room2Id, is_sold: false });
      }
      
      // 5号楼 3单元
      for (let floor = 6; floor >= 1; floor--) {
        const room1Id = floor === 1 ? '5-3-101' : `5-3-${floor}01`;
        const room2Id = floor === 1 ? '5-3-102' : `5-3-${floor}02`;
        allRooms.push({ room_id: room1Id, is_sold: false });
        allRooms.push({ room_id: room2Id, is_sold: false });
      }
      
      // 车位
      for (let i = 1; i <= 62; i++) allRooms.push({ room_id: `车位-A${i}`, is_sold: false });
      for (let i = 8; i <= 19; i++) allRooms.push({ room_id: `车位-B${i}`, is_sold: false });
      for (let i = 43; i <= 48; i++) allRooms.push({ room_id: `车位-B${i}`, is_sold: false });
      for (let i = 1; i <= 44; i++) allRooms.push({ room_id: `车位-C${i}`, is_sold: false });
      
      // 仓房
      for (let i = 1; i <= 10; i++) allRooms.push({ room_id: `仓房-4#下Z${i}`, is_sold: false });
      for (let i = 11; i <= 32; i++) allRooms.push({ room_id: `仓房-5#下Z${i}`, is_sold: false });
      for (let i = 33; i <= 39; i++) allRooms.push({ room_id: `仓房-Z${i}`, is_sold: false });
      
      // 批量插入
      for (let i = 0; i < allRooms.length; i += 100) {
        const batch = allRooms.slice(i, i + 100);
        const { error } = await supabase
          .from('house_status')
          .insert(batch);
        
        if (error) console.log(`插入批次 ${i} 失败:`, error.message);
      }
      
      console.log(`初始化完成，创建了 ${allRooms.length} 个房间`);
    } else {
      console.log('数据库中已有数据，跳过初始化');
    }
    
    return true;
  } catch (error) {
    console.error('初始化数据库失败:', error);
    return false;
  }
}

// 存储连接的客户端
const clients = {
  admin: new Set(),
  display: new Set()
};

// WebSocket连接处理
wss.on('connection', async (ws, req) => {
  console.log('新客户端连接');
  
  let clientType = 'display';
  
  ws.on('message', async (message) => {
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
        
        // 更新内存
        houseStatus[roomId] = isSold;
        
        // 更新数据库
        const success = await updateDatabase(roomId, isSold);
        
        if (success) {
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
        
        // 更新数据库重置
        const { data: allRooms } = await supabase
          .from('house_status')
          .select('room_id');
        
        if (allRooms) {
          const resetPromises = allRooms.map(room =>
            supabase.from('house_status').update({ is_sold: false }).eq('room_id', room.room_id)
          );
          await Promise.all(resetPromises);
        }
        
        // 设置已售房源
        const updatePromises = [];
        if (soldRooms) {
          soldRooms.forEach(roomId => {
            houseStatus[roomId] = true;
            updatePromises.push(updateDatabase(roomId, true));
          });
        }
        if (soldPw) {
          soldPw.forEach(pwId => {
            houseStatus[pwId] = true;
            updatePromises.push(updateDatabase(pwId, true));
          });
        }
        
        await Promise.all(updatePromises);
        
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
        
        // 重置数据库
        const { data: allRooms } = await supabase
          .from('house_status')
          .select('room_id');
        
        if (allRooms) {
          const resetPromises = allRooms.map(room =>
            supabase.from('house_status').update({ is_sold: false }).eq('room_id', room.room_id)
          );
          await Promise.all(resetPromises);
        }
        
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
app.get('/api/status', async (req, res) => {
  try {
    const status = await loadFromDatabase();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

app.get('/api/init-db', async (req, res) => {
  try {
    await initializeDatabase();
    houseStatus = await loadFromDatabase();
    res.json({ success: true, message: '数据库初始化成功' });
  } catch (error) {
    res.status(500).json({ error: '初始化失败' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n=== 中兴翡翠之光房源管理系统 ===`);
  console.log(`服务器运行在端口: ${PORT}`);
  
  // 初始化数据
  houseStatus = await loadFromDatabase();
  if (Object.keys(houseStatus).length === 0) {
    console.log('数据库为空，正在初始化...');
    await initializeDatabase();
    houseStatus = await loadFromDatabase();
  }
  
  console.log(`- 总房间数: ${Object.keys(houseStatus).length}`);
  console.log(`\n=== 访问地址 ===`);
  console.log(`- 主页面: http://localhost:${PORT}`);
  console.log(`- 管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`- 展示页面: http://localhost:${PORT}/layout.html`);
  console.log(`- 数据备份: http://localhost:${PORT}/api/status`);
});