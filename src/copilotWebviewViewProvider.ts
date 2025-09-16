import * as vscode from 'vscode';
import { client } from './grpcClient';
import { getWebviewContent } from './webview';

export class SqlYCopilotWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'sqlYCopilotView';

  private _view?: vscode.WebviewView;
  private _isReady: boolean = false;
  private _readyPromise: Promise<void>;
  private _readyResolve: () => void;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this._readyResolve = () => { }; // Initialize with a no-op
    this._readyPromise = new Promise(resolve => {
      this._readyResolve = resolve;
    });
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true, // Enable JavaScript in the webview
      localResourceRoots: [
        this._extensionUri
      ]
    };

    this._view.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'webviewIsReady':
          console.log('Webview is ready!');
          this._isReady = true;
          this._readyResolve(); // Resolve the promise
          break;
      }
    });

    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri);

    // 处理来自 Webview 的消息
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'sendMessage') {
        const userRequest = { message: message.text };
        const call = client.Chat(userRequest);

        call.on('data', (response: { content: string }) => {
          this._view?.webview.postMessage({ command: 'addResponse', text: response.content, seq: 1 });
        });

        call.on('error', (error: any) => {
          console.error('Error during streaming:', error);
          this._view?.webview.postMessage({ command: 'addResponse', text: 'Error occurred during streaming.' });
        });

        call.on('end', () => {
          console.log('Streaming completed.');
        });
      }
    });
  }

  public async waitForReady() {
    if (this._isReady) {
      return;
    }
    return this._readyPromise;
  }

  // A public method to send messages to the view
  public addRequestToWebview(message: string): void {
    // Use optional chaining to safely post a message only if the view exists
    this._view?.webview.postMessage({ command: 'sendMessage', text: message, seq: 0, isUser: true });
  }

  // A public method to send messages to the view
  public addMessageToWebview(message: string): void {
    // Use optional chaining to safely post a message only if the view exists
    this._view?.webview.postMessage({ command: 'addResponse', text: message, seq: 1 });
  }

  // A public method to send messages to the view
  public endMessageToWebview(): void {
    // Use optional chaining to safely post a message only if the view exists
    this._view?.webview.postMessage({ command: 'END_OF_STREAM', seq: Number.MAX_SAFE_INTEGER });
  }
}