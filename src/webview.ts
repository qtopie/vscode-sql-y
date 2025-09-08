import { posix } from 'path';
import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {

  const viewPath = posix.join('dist', 'views');
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, viewPath, 'index.js')
  );

  const nonce = getNonce();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SQL-Y Chat</title>
    </head>
    <body>
      <div id="root">
      </div>
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
      </script>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>
  `;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}