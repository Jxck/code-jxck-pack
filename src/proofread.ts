import * as vscode from "vscode"
import { request, type RequestOptions } from "node:https"

type openAIConfig = {
  auth_key: string
  api_url: URL
  instruction: string
  model: string
  threshold: number
}

export async function openAI(editor: vscode.TextEditor, config: openAIConfig) {
  const selection = editor.selection
  const input = editor.document.getText(selection)

  try {
    const result = await openai_edit(input, config)

    // diff が大きすぎる場合は何もしない
    if (Math.abs(result.length - input.length) < config.threshold) return

    console.log({ result })
    editor.edit((builder) => builder.replace(selection, result))
    vscode.window.showInformationMessage(result)
  } catch (error) {
    vscode.window.showErrorMessage(`openAI Fail: ${error}`)
  }
}

export async function openAIAll(editor: vscode.TextEditor, config: openAIConfig) {
  const document = editor.document
  const text = document.getText()
  const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length))

  const ext = document.fileName.split("\.").at(-1)

  const sections = (() => {
    if (ext === "md") {
      return text
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
    }
    if (ext === "vtt") {
      return text
        .split("\n")
        .filter((line) => line !== "" && /^\d\d:\d\d/.test(line) === false)
    }
    return text.split("\n")
  })()

  console.log(sections)

  let proofed = text
  try {
    await Promise.all(
      sections.map(async (section, i) => {
        console.log({ section })
        const result = await openai_edit(section, config)
        vscode.window.showInformationMessage(`${i}: ${result}`)
        if (Math.abs(section.length - result.length) > config.threshold) {
          // 変更が大きすぎる場合は無視
          return proofed
        }
        proofed = proofed.replace(section, result)
        return proofed
      })
    )

    vscode.window.showInformationMessage("done")

    return editor.edit((builder) => {
      builder.replace(fullRange, proofed)
    })
  } catch (error) {
    vscode.window.showErrorMessage(`openAI Fail: ${error}`)
  }
}

function withResolvers<T>() {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (value: unknown) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve
    reject =  _reject
  })
  //@ts-ignore
  return { promise, resolve, reject }
}

async function post(url: URL, body: object, option: RequestOptions): Promise<string> {
  const { hostname, pathname } = url
  const { method, headers } = option

  const options = {
    method,
    hostname,
    port: 443,
    path: pathname,
    headers
  }

  const { promise, resolve, reject } = withResolvers<string>()
  const chunks: Array<Uint8Array> = []
  const req = request(options, (res) => {
    res.on("data", (chunk) => {
      chunks.push(chunk)
    })
    res.on("end", () => {
      const json = JSON.parse(Buffer.concat(chunks).toString())
      console.log(json)
      if (json.error) {
        return reject(`${json.error.code}:${json.error.message}`)
      }
      const text = json.choices[0].message.content.trim() as string
      resolve(text)
    })
  })
  req.on("error", (error) => {
    reject(error)
  })
  req.write(JSON.stringify(body))
  req.end()
  return promise
}

async function openai_edit(
  input: string,
  { auth_key, api_url, instruction, model }: { auth_key: string; api_url: URL; instruction: string; model: string }
) {
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

  const res = await post(api_url, body, {
    method: "POST",
    headers: headers
  })

  console.log(res)
  return res
}
