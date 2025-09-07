// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MyWebviewViewProvider } from './myWebviewViewProvider';
import { client } from './daprClient';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Register the webview view provider
	const webviewViewProvider = new MyWebviewViewProvider();

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(MyWebviewViewProvider.viewType, webviewViewProvider)
	);

	// Command to send data to the webview
	const disposable = vscode.commands.registerCommand('sql-y.write-sql-for-me', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const textContent = document.getText();

			const userRequest = { message: textContent };
			const call = client.Chat(userRequest);

			call.on('data', (response: { content: string }) => {
				// 确保 Webview View 打开并发送消息
				webviewViewProvider.addMessageToWebview(response.content);
			});
		} else {
			vscode.window.showInformationMessage('No active editor found.');
		}
	});
	context.subscriptions.push(disposable);


	// Command to open the webview view
	context.subscriptions.push(
		vscode.commands.registerCommand('sql-y.openChat', () => {
			vscode.commands.executeCommand('workbench.view.extension.sqlYCopilotViewContainer'); // Focus the view container
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
