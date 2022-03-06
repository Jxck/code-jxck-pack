// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { format } from "@jxck/markdown";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "jxck" is now active!');

  vscode.languages.registerDocumentFormattingEditProvider("markdown", {
    provideDocumentFormattingEdits(
      document: vscode.TextDocument
    ): vscode.TextEdit[] {
      console.log(`fmt::`, {document});
      const text = document.getText();
      console.log({text});
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length - 1)
      );
      console.log({fullRange});
      try {
      const formatted = format(text);
      console.log({formatted});
    } catch (err) {
      console.error(err);
    }
    const formatted = format(text);
    return [vscode.TextEdit.replace(fullRange, formatted)];
    },
  });

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('jxck.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from jxck!');
	// });

	// context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
