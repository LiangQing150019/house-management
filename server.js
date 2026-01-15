// 导入需要的模块
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

// 存储连接的客户端
const clients = {
  admin: new Set(),
  display: new Set()
};

// 从数据库获取房源状态
async function getHouseStatus() {
  try {
    const { data, error } = await supabase
      .from('house_status')
      .select('*');
    
    if (error) throw error;
    
    // 转换为对象格式
    const status = {};
    data.forEach(item => {
      status[item.room_id] = item.is_sold;
    });
    
    return status;
  } catch (error) {
    console.error('获取数据失败:', error);
    return {};
  }
}

// 更新单个房源状态
async function updateRoomStatus(roomId, isSold) {
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
    console.error('更新数据失败:', error);
    return false;
  }
}

// 初始化房源状态到数据库
async function initializeHouseStatus() {
  try {
    console.log('开始初始化数据库...');
    
    // 清空现有数据
    const { error: deleteError } = await supabase
      .from('house_status')
      .delete()
      .neq('room_id', 'test');
    
    if (deleteError) console.log('清空数据时警告:', deleteError.message);
    
    // 生成所有房源ID
    const allRooms = [];
    
    // 4号楼 1单元
    for (let floor = 18; floor >= 1; floor--) {
      const room1Id = floor === 1 ? '4-1-101' : `4-1-${floor}01`;
      const room2Id = floor === 1 ? '4-1-102' : `4-1-${floor}02`;
      allRooms.push(
        { room_id: room1Id, is_sold: false },
        { room_id: room2Id, is_sold: false }
      );
    }
    
    // 4号楼 2单元
    for (let floor = 18; floor >= 1; floor--) {
      const room1Id = floor === 1 ? '4-2-101' : `4-2-${floor}01`;
      const room2Id = floor === 1 ? '4-2-102' : `4-2-${floor}02`;
      allRooms.push(
        { room_id: room1Id, is_sold: false },
        { room_id: room2Id, is_sold: false }
      );
    }
    
    // 4号楼 3单元
    for (let floor = 18; floor >= 1; floor--) {
      const room1Id = floor === 1 ? '4-3-101' : `4-3-${floor}01`;
      const room2Id = floor === 1 ? '4-3-102' : `4-3-${floor}02`;
      allRooms.push(
        { room_id: room1Id, is_sold: false },
        { room_id: room2Id, is_sold: false }
      );
    }
    
    // 5号楼 1单元
    for (let floor = 6; floor >= 1; floor--) {
      const room1Id = floor === 1 ? '5-1-101' : `5-1-${floor}01`;
      const room2Id = floor === 1 ? '5-1-102' : `5-1-${floor}02`;
      allRooms.push(
        { room_id: room1Id, is_sold: false },
        { room_id: room2Id, is_sold: false }
      );
    }
    
    // 5号楼 2单元
    for (let floor = 6; floor >= 1; floor--) {
      const room1Id = floor === 1 ? '5-2-101' : `5-2-${floor}01`;
      const room2Id = floor === 1 ? '5-2-102' : `5-2-${floor}02`;
      allRooms.push(
        { room_id: room1Id, is_sold: false },
        { room_id: room2Id, is_sold: false }
      );
    }
    
    // 5号楼 3单元
    for (let floor = 6; floor >= 1; floor--) {
      const room1Id = floor === 1 ? '5-3-101' : `5-3-${floor}01`;
      const room2Id = floor === 1 ? '5-3-102' : `5-3-${floor}02`;
      allRooms.push(
        { room_id: room1Id, is_sold: false },
        { room_id: room2Id, is_sold: false }
      );
    }
    
    // 车位
    for (let i = 1; i <= 62; i++) {
      allRooms.push({ room_id: `车位-A${i}`, is_sold: false });
    }
    for (let i = 8; i <= 19; i++) {
      allRooms.push({ room_id: `车位-B${i}`, is_sold: false });
    }
    for (let i = 43; i <= 48; i++) {
      allRooms.push({ room_id: `车位-B${i}`, is_sold: false });
    }
    for (let i = 1; i <= 44; i++) {
      allRooms.push({ room_id: `车位-C${i}`, is_sold: false });
    }
    
    // 仓房
    for (let i = 1; i <= 10; i++) {
      allRooms.push({ room_id: `仓房-4#下Z${i}`, is_sold: false });
    }
    for (let i = 11; i <= 32; i++) {
      allRooms.push({ room_id: `仓房-5#下Z${i}`, is_sold: false });
    }
    for (let i = 33; i <= 39; i++) {
      allRooms.push({ room_id: `仓房-Z${i}`, is_sold: false });
    }
    
    // 批量插入数据
    const batchSize = 100;
    for (let i = 0; i < allRooms.length; i += batchSize) {
      const batch = allRooms.slice(i, i + batchSize);
      const { error } = await supabase
        .from('house_status')
        .insert(batch);
      
      if (error) {
        console.error('插入批次失败:', error);
        break;
      }
    }
    
    console.log(`初始化完成，共创建 ${allRooms.length} 个房间`);
    return true;
  } catch (error) {
    console.error('初始化数据库失败:', error);
    return false;
  }
}

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
          const currentStatus = await getHouseStatus();
          ws.send(JSON.stringify({
            type: 'init',
            data: currentStatus
          }));
        } else {
          clients.display.add(ws);
          console.log('展示页面已连接');
          
          const currentStatus = await getHouseStatus();
          ws.send(JSON.stringify({
            type: 'init',
            data: currentStatus
          }));
        }
      }
      
      // 处理状态更新
      if (data.type === 'update-status' && clientType === 'admin') {
        const { roomId, isSold } = data;
        console.log(`更新房间状态: ${roomId} -> ${isSold}`);
        
        // 更新数据库
        const success = await updateRoomStatus(roomId, isSold);
        
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
        
        // 1. 重置所有状态为false
        const allRooms = await getHouseStatus();
        const resetPromises = Object.keys(allRooms).map(async (roomId) => {
          return updateRoomStatus(roomId, false);
        });
        await Promise.all(resetPromises);
        
        // 2. 设置已售房源
        const updatePromises = [];
        if (soldRooms) {
          soldRooms.forEach(roomId => {
            updatePromises.push(updateRoomStatus(roomId, true));
          });
        }
        if (soldPw) {
          soldPw.forEach(pwId => {
            updatePromises.push(updateRoomStatus(pwId, true));
          });
        }
        
        await Promise.all(updatePromises);
        
        // 3. 广播全量更新
        const newStatus = await getHouseStatus();
        broadcastToDisplays({
          type: 'full-update',
          data: newStatus
        });
        
        ws.send(JSON.stringify({
          type: 'import-success'
        }));
      }
      
      // 处理重置请求
      if (data.type === 'reset-all' && clientType === 'admin') {
        console.log('收到重置请求');
        await initializeHouseStatus();
        
        const newStatus = await getHouseStatus();
        broadcastToDisplays({
          type: 'full-update',
          data: newStatus
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
    const status = await getHouseStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: '获取数据失败' });
  }
});

app.get('/api/init-db', async (req, res) => {
  try {
    await initializeHouseStatus();
    res.json({ success: true, message: '数据库初始化成功' });
  } catch (error) {
    res.status(500).json({ error: '初始化失败' });
  }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n=== 服务器已启动 ===`);
  console.log(`- 端口: ${PORT}`);
  
  // 检查数据库是否已初始化
  const status = await getHouseStatus();
  if (Object.keys(status).length === 0) {
    console.log('检测到数据库为空，正在初始化...');
    await initializeHouseStatus();
  }
  
  console.log(`- 数据库状态: 正常`);
  console.log(`- 房间数量: ${Object.keys(status).length}`);
});