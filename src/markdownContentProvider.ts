import * as vscode from 'vscode';

export class MarkdownContentProvider implements vscode.TextDocumentContentProvider {
  static scheme = 'your-extension-markdown-preview';

  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this.onDidChangeEmitter.event;

  provideTextDocumentContent(uri: vscode.Uri): string {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const document = editor.document;
      const textContent = document.getText();
      return textContent;
    }

    return "N/A";
  }
}