import * as vscode from "vscode"

export async function replace(editor: vscode.TextEditor, { dict }: { dict: Array<string> }) {
  if (editor === undefined) {
    // return console.error("active editor not found for highlight")
    return
  }

  const document = editor.document
  const firstLine = document.lineAt(0)
  const lastLine = document.lineAt(document.lineCount - 1)
  const selection = new vscode.Selection(firstLine.range.start, lastLine.range.end)
  const text = document.getText(selection)

  const replacedText = dict.reduce((text, [from, to]) => {
    return text.replaceAll(from, to)
  }, text)

  editor.edit((editBuilder) => {
    editBuilder.replace(selection, replacedText)
  })
}
