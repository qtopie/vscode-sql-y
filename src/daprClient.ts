const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');


const PROTO_PATH = './proto/copilot.proto'; // 替换为实际路径

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [
    path.join(__dirname, 'proto')
  ]
});

const assistantProto = grpc.loadPackageDefinition(packageDefinition).assistant;

// 创建 gRPC 客户端
export const client = new assistantProto.CopilotService('localhost:1234', grpc.credentials.createInsecure());