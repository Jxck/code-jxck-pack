// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode"
import { format } from "@jxck/markdown"
import translate = require("deepl")

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(`Congratulations, your extension "jxck" is now active!`)

  /**
   * Deepl
   */
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
  ;(() => {
    const disposable = vscode.commands.registerCommand("jxck.translate", async () => {
      const config = vscode.workspace.getConfiguration("jxck")
      const auth_key = config.deepl_auth_key
      const target_lang = config.deepl_target_lang

      vscode.window.showInformationMessage(`Translate to ${target_lang}`)

      const editor = vscode.window.activeTextEditor
      if (!editor) {
        return vscode.window.showWarningMessage("No active text editor found!")
      }
      const currentLine = editor.selection.active.line
      const { text } = editor.document.lineAt(currentLine)

      if (!auth_key) {
        return vscode.window.showErrorMessage("Deepl Auth Key is missing")
      }
      const result = await translate({
        text,
        auth_key,
        target_lang,
        free_api: false
      })
      console.log({ result })

      const translated = result.data.translations.map(({ text }) => text).join("\n")

      const position = new vscode.Position(currentLine, text.length)

      editor.edit((builder) => {
        builder.replace(position, `\n\n${translated}\n`)
      })
      vscode.window.showInformationMessage(text)
    })

    context.subscriptions.push(disposable)
  })()

  /**
   * Highlight
   */
  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "yellow"
  })

  decorate(vscode.window.activeTextEditor)

  vscode.window.onDidChangeActiveTextEditor((editor) => decorate(editor), null, context.subscriptions)

  vscode.workspace.onDidChangeTextDocument(() => decorate(vscode.window.activeTextEditor), null, context.subscriptions)

  vscode.workspace.onWillSaveTextDocument((event) => {
    const openEditor = vscode.window.visibleTextEditors.filter((editor) => editor.document.uri === event.document.uri)[0]
    decorate(openEditor)
  })

  function decorate(editor?: vscode.TextEditor) {
    if (editor === undefined) {
      return vscode.window.showInformationMessage(`active editor not found for highlight`)
    }
    if (editor.document.languageId !== "subtitles") {
      return vscode.window.showInformationMessage(`highlight only supported in .vtt`)
    }
    const text = editor.document.getText()
    const lines = text.split("\n")
    const decorations: vscode.DecorationOptions[] = []

    // highlight Alpha + Katakana
    const base = /[a-zA-Z\p{sc=Katakana}ー]+/gu
    lines.forEach((line, i) => {
      let result
      while ((result = base.exec(line))) {
        const from = new vscode.Position(i, result.index)
        const to = new vscode.Position(i, result.index + result[0].length)
        const range = new vscode.Range(from, to)
        const decoration = { range }
        decorations.push(decoration)
      }
    })
    ;(() => {
      const disposable = vscode.commands.registerCommand("jxck.highlight", async () => {
        vscode.window.showInformationMessage(`Highlight Enabled`)
        const editor = vscode.window.activeTextEditor
        decorate(editor)
      })

      context.subscriptions.push(disposable)
    })()
    editor.setDecorations(decorationType, decorations)
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
