import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = 'path/to/dapr/proto/dapr.proto'; // 替换为实际路径

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const daprProto = grpc.loadPackageDefinition(packageDefinition).dapr;

// 创建 gRPC 客户端
const client = new daprProto.Dapr('localhost:1234', grpc.credentials.createInsecure());