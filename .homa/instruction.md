vscode sql-y扩展依赖一个后端服务,应用程序名叫homa, 仓库地址是https://github.com/qtopie/homa

现在我想给扩展增加这样的一个功能.

首先在插件被激活时, 会尝试去连接grpc服务, 端口是1234,参考grpcClient.ts的实现.

如果该端口不存活,则尝试用命令启动服务程序. 

步骤如下
先检查 ~/.cosmos/bin/homa 文件是否存在, 如果不存在,则尝试从github仓库https://github.com/qtopie/homa的最新release下载, 然后后台执行该应用程序