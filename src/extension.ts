// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode"
import { format } from "@jxck/markdown"
import { decorate } from "./highlight"
import { translate } from "./translate"
import deepl = require("deepl")

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(`Congratulations, your extension "jxck" is now active!`)

  enable_translate(context)
  enable_highlight(context)
}

function enable_translate(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider("markdown", {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      console.log(`fmt::`, { document })
      const text = document.getText()
      const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length))
      try {
        const formatted = format(text)
        return [vscode.TextEdit.replace(fullRange, formatted)]
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err)
          vscode.window.showInformationMessage(err.message)
        }
        return []
      }
    }
  })

  const disposable = vscode.commands.registerCommand("jxck.translate", async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return console.error("No active text editor found!")
    }

    const config = vscode.workspace.getConfiguration("jxck")
    const auth_key = config.deepl_auth_key as string
    if (!auth_key) {
      return vscode.window.showErrorMessage("Deepl Auth Key is missing")
    }

    const target_lang = config.deepl_target_lang || ("JA" as deepl.DeeplLanguages)
    vscode.window.showInformationMessage(`Translate to ${target_lang}`)

    await translate(editor, auth_key, target_lang)
  })

  context.subscriptions.push(disposable)
}

function enable_highlight(context: vscode.ExtensionContext) {
  decorate(vscode.window.activeTextEditor)

  vscode.window.onDidChangeActiveTextEditor((editor) => decorate(editor), null, context.subscriptions)

  vscode.workspace.onDidChangeTextDocument(() => decorate(vscode.window.activeTextEditor), null, context.subscriptions)

  vscode.workspace.onWillSaveTextDocument((event) => {
    const openEditor = vscode.window.visibleTextEditors.filter((editor) => editor.document.uri === event.document.uri)[0]
    decorate(openEditor)
  })

  const disposable = vscode.commands.registerCommand("jxck.highlight", async () => {
    decorate(vscode.window.activeTextEditor)
  })

  context.subscriptions.push(disposable)
}

// this method is called when your extension is deactivated
export function deactivate() {}
