import { format } from "@jxck/markdown"
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode"
import { decorate } from "./highlight"
import { cloudeAPI, openAIAPI, proofread, proofreadAll, type APIConfig } from "./proofread"
import { translate } from "./translate"
import { replace } from "./replace"
import deepl = require("deepl")

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(`Congratulations, your extension "jxck" is now active!`)
  console.log(process.version)
  enable_replace(context)
  enable_format(context)
  enable_translate(context)
  enable_highlight(context)
  enable_openAI(context)
  enable_cloude(context)
}

function enable_replace(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("jxck.replace", async () => {
    const editor = vscode.window.activeTextEditor
    if (!editor) {
      return console.error("No active text editor found!")
    }

    const config = vscode.workspace.getConfiguration("jxck")
    const dict = config.replace_dict as Array<string>
    if (!dict) {
      return vscode.window.showErrorMessage("Replace Dict is missing")
    }

    vscode.window.showInformationMessage(`Replacing Words....`)
    await replace(editor, { dict })
    vscode.window.showInformationMessage(`Replacing Words Done!`)
  })

  context.subscriptions.push(disposable)
}

function enable_format(context: vscode.ExtensionContext) {
  vscode.languages.registerDocumentFormattingEditProvider("markdown", {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      console.log("fmt::", { document })
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
}

function enable_translate(context: vscode.ExtensionContext) {
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

    const free_api = config.deepl_free_api as boolean
    await translate(editor, {
      auth_key,
      target_lang,
      free_api
    })
  })

  context.subscriptions.push(disposable)
}

function enable_highlight(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand("jxck.highlight", async () => {
    decorate(vscode.window.activeTextEditor)

    vscode.window.onDidChangeActiveTextEditor((editor) => decorate(editor), null, context.subscriptions)

    vscode.workspace.onDidChangeTextDocument(() => decorate(vscode.window.activeTextEditor), null, context.subscriptions)

    vscode.workspace.onWillSaveTextDocument((event) => {
      const openEditor = vscode.window.visibleTextEditors.filter((editor) => editor.document.uri === event.document.uri)[0]
      decorate(openEditor)
    })
  })

  context.subscriptions.push(disposable)
}

function enable_openAI(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("jxck")
  const auth_key = config.openai_auth_key as string
  const api_url = new URL(config.openai_api_url as string)
  const model = config.openai_model as string
  const instruction = config.prompt as string
  const threshold = config.threshold as number
  const temperature = config.temperature as number
  const apiConfig: APIConfig = {
    auth_key,
    api_url,
    instruction,
    model,
    threshold,
    temperature
  }
  console.log({ apiConfig })
  context.subscriptions.push(
    vscode.commands.registerCommand("jxck.openAI", async () => {
      if (!auth_key) {
        return vscode.window.showErrorMessage("OpenAI Auth Key is missing")
      }
      await proofread(openAIAPI, apiConfig)
    })
  )
  context.subscriptions.push(
    vscode.commands.registerCommand("jxck.openAIAll", async () => {
      if (!auth_key) {
        return vscode.window.showErrorMessage("OpenAI Auth Key is missing")
      }
      await proofreadAll(openAIAPI, apiConfig)
    })
  )
}

function enable_cloude(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("jxck")
  const auth_key = config.cloude_api_key as string
  const api_url = new URL(config.cloude_api_url as string)
  const model = config.cloude_model as string
  const instruction = config.prompt as string
  const threshold = config.threshold as number
  const temperature = config.temperature as number
  const apiConfig: APIConfig = {
    auth_key,
    api_url,
    instruction,
    model,
    threshold,
    temperature
  }
  console.log({ apiConfig })
  context.subscriptions.push(
    vscode.commands.registerCommand("jxck.cloude", async () => {
      if (!auth_key) {
        return vscode.window.showErrorMessage("Cloude API Key is missing")
      }
      await proofread(cloudeAPI, apiConfig)
    })
  )
  context.subscriptions.push(
    vscode.commands.registerCommand("jxck.cloudeAll", async () => {
      if (!auth_key) {
        return vscode.window.showErrorMessage("Cloude API Key is missing")
      }
      await proofreadAll(cloudeAPI, apiConfig)
    })
  )
}
// this method is called when your extension is deactivated
export function deactivate() {}
