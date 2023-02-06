import * as vscode from "vscode"
import deepl = require("deepl")

export async function translate(editor: vscode.TextEditor, auth_key: string, target_lang: deepl.DeeplLanguages) {
  const currentLine = editor.selection.active.line
  const { text } = editor.document.lineAt(currentLine)
  const result = await deepl({
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
}
