import * as vscode from "vscode"

export function decorate(editor?: vscode.TextEditor) {
  if (editor === undefined) {
    return vscode.window.showInformationMessage("active editor not found for highlight")
  }
  if (editor.document.languageId !== "subtitles") {
    return vscode.window.showInformationMessage("highlight only supported in .vtt")
  }
  vscode.window.showInformationMessage("Highlight Enabled")

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

  const decorationType = vscode.window.createTextEditorDecorationType({
    backgroundColor: "yellow"
  })
  editor.setDecorations(decorationType, decorations)
}
