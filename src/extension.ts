// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { format } from "@jxck/markdown";
import translate = require("deepl");

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
      console.log(`fmt::`, { document });
      const text = document.getText();
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );
      try {
        const formatted = format(text);
        return [vscode.TextEdit.replace(fullRange, formatted)];
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err);
          vscode.window.showInformationMessage(err.message);
        }
        return [];
      }
    },
  });

  let disposable = vscode.commands.registerCommand(
    "jxck.translate",
    async () => {
      vscode.window.showInformationMessage("Translate En->Jp");

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return vscode.window.showWarningMessage("No active text editor found!");
      }
      const currentLine = editor.selection.active.line;
      const { text } = editor.document.lineAt(currentLine);

      const config = vscode.workspace.getConfiguration("jxck");
      const auth_key = config.deepl_auth_key;

      if (!auth_key) {
        return vscode.window.showErrorMessage("Deepl Auth Key is missing");
      }
      const result = await translate({
        free_api: false,
        text,
        target_lang: "JA",
        auth_key,
      });
      console.log({ result });

      const translated = result.data.translations
        .map(({ text }) => text)
        .join("\n");

      const position = new vscode.Position(currentLine, 0);

      editor.edit((builder) => {
        builder.replace(position, `\n${translated}\n\n`);
      });
      vscode.window.showInformationMessage(text);
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
