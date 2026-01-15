// 测试ID生成
console.log("测试房间ID生成:");

// 按照前端配置生成4号楼1单元的ID
for (let floor = 18; floor >= 1; floor--) {
  let display, id;
  
  // 生成类似前端的格式
  if (floor === 1) {
    display = "101";
    id = "4-1-101";
  } else if (floor < 10) {
    display = `${floor}01`;
    id = `4-1-${floor}01`;
  } else {
    display = `${floor}01`;
    id = `4-1-${floor}01`;
  }
  
  console.log(`楼层 ${floor}: 显示=${display}, ID=${id}`);
}

console.log("\n前端配置的示例:");
console.log("1801: 4-1-1801");
console.log("1701: 4-1-1701");
console.log("101: 4-1-101");
console.log("901: 4-1-901");