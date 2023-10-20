import * as vscode from "vscode"
import { request, RequestOptions } from "https"

export async function proofread(editor: vscode.TextEditor, config: { auth_key: string; instruction: string; model: string }) {
  const selection = editor.selection
  const input = editor.document.getText(selection)

  try {
    const result = await openid_edit(input, config)
    console.log({ result })

    editor.edit((builder) => builder.replace(selection, result))
    vscode.window.showInformationMessage(result)
  } catch (error) {
    vscode.window.showErrorMessage(`Proofread Fail: ${error}`)
  }
}

export async function proofreadAll(editor: vscode.TextEditor, config: { auth_key: string; instruction: string; model: string }) {
  const document = editor.document
  const text = document.getText()
  const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length))

  const sections = text
    .split("\n")
    .reduce(
      (acc: Array<Array<string>>, curr) => {
        if (curr.startsWith("#")) {
          acc.unshift([curr])
          return acc
        }
        acc.at(0)?.push(curr)
        return acc
      },
      [[]]
    )
    .reverse()
    .map((section) => section.join("\n"))

  let proofed = text
  try {
    await Promise.all(
      sections.map(async (section, i) => {
        console.log({ section })
        const result = await openid_edit(section, config)
        vscode.window.showInformationMessage(`${i}: ${result}`)
        proofed = proofed.replace(section, result)
        return proofed
      })
    )

    vscode.window.showInformationMessage(`done`)

    return editor.edit((builder) => {
      builder.replace(fullRange, proofed)
    })
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
    const chunks: Array<Uint8Array> = []
    const req = request(options, (res) => {
      res.on("data", (chunk) => {
        chunks.push(chunk)
      })
      res.on("end", () => {
        const json = JSON.parse(Buffer.concat(chunks).toString())
        console.log(json)
        if (json.error) {
          return fail(`${json.error.code}:${json.error.message}`)
        }
        const text = json.choices[0].text.trim()
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

async function openid_edit(input: string, { auth_key, instruction, model }: { auth_key: string; instruction: string; model: string }) {
  const apiUrl = "https://api.openai.com/v1/chat/completions"
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth_key}`
  }

  const body = {
    model,
    messages: [
      {
        role: "system",
        content: instruction
      },
      {
        role: "user",
        content: input
      }
    ],
    temperature: 0.2
  }

  const res = await post(apiUrl, body, {
    method: "POST",
    headers: headers
  })

  console.log(res)
  return res
}
