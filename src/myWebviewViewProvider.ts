import * as vscode from 'vscode';
import { client } from './daprClient';
import { getWebviewContent } from './webview';

export class MyWebviewViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'sqlYCopilotView';

  private _view?: vscode.WebviewView;

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true, // Enable JavaScript in the webview
    };

    webviewView.webview.html = getWebviewContent();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'sendMessage') {
        const userRequest = { message: message.text };
        const call = client.Chat(userRequest);

        call.on('data', (response: { content: string }) => {
          this._view?.webview.postMessage({ command: 'addResponse', text: response.content });
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

  public addMessageToWebview(message: string): void {
    this._view?.webview.postMessage({ command: 'addResponse', text: message });
  }
}