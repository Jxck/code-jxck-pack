import * as vscode from "vscode"
import { request, RequestOptions } from "https"

export async function proofread(editor: vscode.TextEditor, auth_key: string, instruction: string) {
  const input = editor.document.getText(editor.selection)

  try {
    const result = await openid_edit(input, auth_key, instruction)
    console.log({ result })

    editor.edit((builder) => {
      builder.replace(editor.selection, result)
    })
    vscode.window.showInformationMessage(result)
  } catch (error) {
    vscode.window.showErrorMessage(`Proofread Fail: ${error}`)
  }
}

async function post(url: string, body: object, option: RequestOptions): Promise<string> {
  const { hostname, pathname } = new URL(url)
  const { method, headers } = option

  const options = {
    method,
    hostname,
    port: 443,
    path: pathname,
    headers
  }

  return new Promise((done, fail) => {
    const chunks: Array<string> = []
    const req = request(options, (res) => {
      res.on("data", (chunk) => {
        chunks.push(chunk)
      })
      res.on("end", () => {
        const json = JSON.parse(chunks.join(""))
        const text = json.choices[0].text
        done(text)
      })
    })
    req.on("error", (error) => {
      fail(error)
    })
    req.write(JSON.stringify(body))
    req.end()
  })
}

async function openid_edit(input: string, auth_key: string, instruction: string) {
  const apiUrl = "https://api.openai.com/v1/edits"
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth_key}`
  }
  const model = "text-davinci-edit-001"

  const body = {
    model,
    input,
    instruction,
    temperature: 0.2
  }

  const res = await post(apiUrl, body, {
    method: "POST",
    headers: headers
  })

  console.log(res)
  return res
}
