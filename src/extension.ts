// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { MarkdownContentProvider } from './markdownContentProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const provider = new MarkdownContentProvider();
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(MarkdownContentProvider.scheme, provider));

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "sql-y" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('sql-y.write-sql-for-me', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const uri = vscode.Uri.parse(`${MarkdownContentProvider.scheme}:preview.md`);

			// Store the content so the provider can retrieve it.
			// contentMap.set(uri.toString(), textContent);

			// This command opens the virtual document in a new editor pane.
			const doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });

			// Now execute the built-in markdown preview command on the new document.
			await vscode.commands.executeCommand('markdown.showPreview');
		} else {
			vscode.window.showInformationMessage('No active editor found.');
		}

		vscode.window.showInformationMessage('Please teach me how???');
	});
	context.subscriptions.push(disposable);

	const rewriteDisposable = vscode.commands.registerCommand('sql-y.rewrite-sql-for-me', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const uri = vscode.Uri.parse(`${MarkdownContentProvider.scheme}:preview.md`);

			// Store the content so the provider can retrieve it.
			// contentMap.set(uri.toString(), textContent);

			// This command opens the virtual document in a new editor pane.
			const doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });

			// Now execute the built-in markdown preview command on the new document.
			await vscode.commands.executeCommand('markdown.showPreview');
		} else {
			vscode.window.showInformationMessage('No active editor found.');
		}

		vscode.window.showInformationMessage('Please teach me how???');
	});

	context.subscriptions.push(rewriteDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
