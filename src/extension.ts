import * as vscode from 'vscode';
import { SqlYCopilotWebviewViewProvider } from './copilotWebviewViewProvider';
import { client } from './grpcClient';

/**
 * A simple debounce function to limit how often an async function is called.
 * This version correctly handles promise-based functions, ensuring that only
 * the final, "stopped typing" event triggers the function call.
 * @param func The async function to debounce.
 * @param delay The delay in milliseconds.
 */
function debounce<T extends (...args: any[]) => Promise<any>>(func: T, delay: number): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>> | undefined> {
	let timeoutId: NodeJS.Timeout | undefined;
	let latestPromise: Promise<Awaited<ReturnType<T>> | undefined> | undefined;
	let latestResolve: ((value: Awaited<ReturnType<T>> | undefined) => void) | undefined;

	return function (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> {
		// Clear any existing timeout to reset the timer on every new keystroke
		clearTimeout(timeoutId);

		// If there is no pending promise, create one
		if (!latestPromise) {
			latestPromise = new Promise(resolve => {
				latestResolve = resolve;
			});
		}

		// Set a new timeout
		timeoutId = setTimeout(async () => {
			try {
				const result = await func(...args);
				if (latestResolve) {
					latestResolve(result);
				}
			} catch (error) {
				console.error('Debounced function failed:', error);
				if (latestResolve) {
					latestResolve(undefined);
				}
			} finally {
				// Clear the promise and resolve function after the debounced call is complete
				latestPromise = undefined;
				latestResolve = undefined;
			}
		}, delay);

		return latestPromise;
	};
}


function isEmptyOrWhitespace(str: string | null | undefined): boolean {
	return str === null || str === undefined || str.trim().length === 0;
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders;

	if (workspaceFolders && workspaceFolders.length > 0) {
		const firstFolder = workspaceFolders[0];
		const folderUri = firstFolder.uri;
		const folderPath = folderUri.fsPath;
		const folderName = firstFolder.name;

		console.log(`First workspace folder URI: ${folderUri}`);
		console.log(`First workspace folder path: ${folderPath}`);
		console.log(`First workspace folder name: ${folderName}`);
	} else {
		console.log('No workspace folders found.');
	}

	// Copilot WebView
	const webviewViewProvider = new SqlYCopilotWebviewViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SqlYCopilotWebviewViewProvider.viewType, webviewViewProvider)
	);

	// The function that will be debounced
	const provideInlineCompletions = async (
		document: vscode.TextDocument,
		position: vscode.Position,
	): Promise<vscode.InlineCompletionItem[] | null | undefined> => {

		const linePrefix = document.lineAt(position).text.substring(0, position.character);
		const lineSuffix = document.lineAt(position).text.substring(position.character);

		// Only proceed if the line prefix is not empty
		if (isEmptyOrWhitespace(linePrefix)) {
			return [];
		}

		// Provide a simple 'select' suggestion immediately without an API call
		if (linePrefix.trim().toLowerCase().endsWith('select')) {
			const selectAll = new vscode.InlineCompletionItem(' * FROM ');
			selectAll.range = new vscode.Range(position, position);
			return [selectAll];
		}

		const linesAbove: string[] = [];
		const linesBelow: string[] = [];

		// Get context from lines above
		for (let i = Math.max(0, position.line - 1000); i < position.line; i++) {
			const lineText = document.lineAt(i).text;
			if (isEmptyOrWhitespace(lineText)) {
				// Stop at the first empty or whitespace-only line
				break;
			}
			linesAbove.push(lineText);
		}
		// Get context from lines below
		if (!isEmptyOrWhitespace(lineSuffix)) {
			linesAbove.push(lineSuffix);
		}
		for (let i = position.line + 1; i < Math.min(document.lineCount, position.line + 1000); i++) {
			const lineText = document.lineAt(i).text;
			if (isEmptyOrWhitespace(lineText)) {
				// Stop at the first empty or whitespace-only line
				break;
			}
			linesBelow.push(lineText);
		}

		const userRequest = {
			message: linePrefix,
			frontPart: linesAbove.join("\n"),
			backPart: linesBelow.join("\n"),
			filename: document.fileName
		};

		let completionToken: string = '';

		// Use an async/await approach for the gRPC call
		try {
			const response = await new Promise<{ content: string }>((resolve, reject) => {
				client.AutoComplete(userRequest, (error: any, response: { content: string }) => {
					if (error) {
						return reject(error);
					}
					resolve(response);
				});
			});
			completionToken = response.content;
		} catch (error) {
			console.error('Error in AutoComplete:', error);
			// Return an empty array on error to prevent bad suggestions
			return [];
		}

		return completionToken === '' ? [] : [
			new vscode.InlineCompletionItem(completionToken, new vscode.Range(position, position))
		];
	};

	// Create a debounced version of the provider function with a 100ms delay
	const debouncedProvider = debounce(provideInlineCompletions, 100);

	// Register the inline completion item provider for 'sql' language.
	const codeCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
		'SQL',
		{
			provideInlineCompletionItems: (document, position) => {
				return debouncedProvider(document, position);
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

			// workaround for new message
			webviewViewProvider.addRequestToWebview('write sql for me with file @' + document.fileName);
			const call = client.Chat(userRequest);
			call.on('data', (response: { content: string }) => {
				webviewViewProvider.addMessageToWebview(response.content);
			});
			call.on('end', () => {
				webviewViewProvider.endMessageToWebview();
			});
			call.on('error', (error: any) => {
				console.error('gRPC stream error:', error);
				webviewViewProvider.addMessageToWebview(`Error: ${error.message}`);
			});
		} else {
			vscode.window.showInformationMessage('No active editor found.');
		}
	});
	context.subscriptions.push(disposable);

	// Command to open the webview view
	context.subscriptions.push(
		vscode.commands.registerCommand('sql-y.rewrite-sql-for-me', () => {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const document = editor.document;

				webviewViewProvider.addRequestToWebview('rewrite sql for me with file @' + document.fileName);
				console.log('rewrititing is not implemented yet');
				webviewViewProvider.addMessageToWebview('rewrititing is not implemented yet');
			} else {
				vscode.window.showInformationMessage('No active editor found.');
			}

		})
	);

	// Command to open the webview view
	context.subscriptions.push(
		vscode.commands.registerCommand('sql-y.openChat', () => {
			vscode.commands.executeCommand('workbench.view.extension.sqlYCopilotViewContainer');
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() { }
