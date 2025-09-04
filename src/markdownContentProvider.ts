import * as vscode from 'vscode';

export class MarkdownContentProvider implements vscode.TextDocumentContentProvider {
  static scheme = 'markdown-preview';
  private contentMap: Map<string, string> = new Map();
  private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

  get onDidChange(): vscode.Event<vscode.Uri> {
    return this._onDidChange.event;
  }

  setContent(uri: vscode.Uri, content: string) {
    this.contentMap.set(uri.toString(), content);
    this._onDidChange.fire(uri); // Notify VS Code to refresh the content
  }

  provideTextDocumentContent(uri: vscode.Uri): string {
    return this.contentMap.get(uri.toString()) || 'Loading...';
  }
}