import { posix } from 'path';
import * as vscode from 'vscode';

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {

  const viewPath = posix.join('dist', 'views');
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, viewPath, 'index.js')
  );

  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, viewPath, 'index.css')
  );
  const codiconsUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, viewPath, 'icon.svg')
  );

  const nonce = getNonce();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

      <link href="${styleUri}" rel="stylesheet" />
      <link href="${codiconsUri}" rel="stylesheet">
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