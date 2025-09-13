// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { SqlYCopilotWebviewViewProvider } from './copilotWebviewViewProvider';
import { client } from './daprClient';

function isEmptyOrWhitespace(str: string) {
	// Check if the string is null, undefined, or an empty string after trimming whitespace
	return str === null || str === undefined || str.trim().length === 0;
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (workspaceFolders && workspaceFolders.length > 0) {
		// Access the first workspace folder (often the primary one in single-folder workspaces)
		const firstFolder = workspaceFolders[0];

		// Get the URI of the folder
		const folderUri = firstFolder.uri;

		// Get the file system path of the folder
		const folderPath = folderUri.fsPath;

		// Get the name of the folder
		const folderName = firstFolder.name;

		console.log(`First workspace folder URI: ${folderUri}`);
		console.log(`First workspace folder path: ${folderPath}`);
		console.log(`First workspace folder name: ${folderName}`);

		// Iterate through all workspace folders in a multi-root workspace
		workspaceFolders.forEach((folder, index) => {
			console.log(`Folder ${index + 1} URI: ${folder.uri}`);
			console.log(`Folder ${index + 1} path: ${folder.uri.fsPath}`);
			console.log(`Folder ${index + 1} name: ${folder.name}`);
		});
	} else {
		console.log('No workspace folders found.');
	}

	// Copilot WebView
	const webviewViewProvider = new SqlYCopilotWebviewViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SqlYCopilotWebviewViewProvider.viewType, webviewViewProvider)
	);

	// Register an inline completion item provider for 'sql' language.
	const codeCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
		'SQL',
		{
			// The provideInlineCompletionItems method is called to provide inline suggestions.
			async provideInlineCompletionItems(
				document: vscode.TextDocument,
				position: vscode.Position,
			) {

				const linesAbove: string[] = [];
				const linesBelow: string[] = [];

				for (let i = Math.max(0, position.line - 1000); i < position.line; i++) {
					const lineText = document.lineAt(i).text;
					if (isEmptyOrWhitespace(lineText)) {
						break;
					}

					linesAbove.push(lineText);
				}

				for (let i = 0; i < Math.min(document.lineCount, position.line + 1000); i++) {
					const lineText = document.lineAt(i).text;
					if (isEmptyOrWhitespace(lineText)) {
						break;
					}

					linesBelow.push(lineText);
				}

				// Get the current line text up to the cursor position.
				const linePrefix = document.lineAt(position).text.substring(0, position.character);

				// Check if the user is typing "SELECT" to provide a suggestion.
				if (linePrefix.trim().toLowerCase().endsWith('select')) {
					// Create a new InlineCompletionItem
					const selectAll = new vscode.InlineCompletionItem(
						' * FROM '
					);

					// The range defines the text that will be replaced by the suggestion.
					// In this case, we are not replacing anything, just inserting.
					selectAll.range = new vscode.Range(position, position);

					// Return the array of inline completion items.
					return [selectAll];
				}

				const userRequest = {
					message: linePrefix,
					frontPart: linesAbove.join("\n"),
					backPart: linesBelow.join("\n"),
					filename: document.fileName
				};

				let completionToken: string = '';
				client.AutoComplete(userRequest, (error: any, response: { content: string }) => {
					if (error) {
						console.error('Error:', error);
					} else {
						completionToken = response.content;
					}
				});

				return completionToken === '' ? [] : [
					new vscode.InlineCompletionItem(completionToken)
				];
			}
		}
	);
	context.subscriptions.push(codeCompletionProvider);



	// Command to send data to the webview
	const disposable = vscode.commands.registerCommand('sql-y.write-sql-for-me', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const textContent = document.getText();

			const userRequest = {
				message: textContent,
				filename: document.fileName
			};
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
