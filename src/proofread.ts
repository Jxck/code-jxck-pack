import * as vscode from "vscode"

export type OpenAIConfig = {
  auth_key: string
  api_url: URL
  instruction: string
  model: string
  threshold: number
  temperature: number
}

export type APIConfig = OpenAIConfig
export type APICall = (input: string, config: APIConfig) => Promise<string>

export async function proofread(apiCall: APICall, config: OpenAIConfig) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return vscode.window.showErrorMessage("No active text editor found!")
  }

  const selection = editor.selection
  const input = editor.document.getText(selection)
  console.log({ input })

  try {
    const result = await apiCall(input, config)

    // diff が大きすぎる場合は何もしない
    if (Math.abs(result.length - input.length) < config.threshold) return

    console.log({ result })
    editor.edit((builder) => builder.replace(selection, result))
    vscode.window.showInformationMessage(result)
  } catch (error) {
    vscode.window.showErrorMessage(`openAI Fail: ${error}`)
  }
}

export async function proofreadAll(apiCall: APICall, config: OpenAIConfig) {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return vscode.window.showErrorMessage("No active text editor found!")
  }

  const document = editor.document
  const text = document.getText()
  const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length))

  const ext = document.fileName.split(".").at(-1)

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
      return text.split("\n").filter((line) => line !== "" && /^\d\d:\d\d/.test(line) === false)
    }
    return text.split("\n")
  })()

  console.log(sections)

  let proofed = text
  try {
    const results = await Promise.allSettled(
      sections.map(async (section, i) => {
        console.log({ section })
        const result = await apiCall(section, config)
        if (Math.abs(section.length - result.length) > config.threshold) {
          // 変更が大きすぎる場合は無視
          return proofed
        }
        proofed = proofed.replace(section, result)
        vscode.window.showInformationMessage(`${i}: ${result}`)
        return proofed
      })
    )

    results.forEach(({ status }, i) => {
      if (status === "rejected") {
        vscode.window.showErrorMessage(`fail ${i}: ${status}`)
      }
    })

    vscode.window.showInformationMessage("done")

    return editor.edit((builder) => {
      builder.replace(fullRange, proofed)
    })
  } catch (error) {
    vscode.window.showErrorMessage(`openAI Fail: ${error}`)
  }
}

export async function openAIAPI(input: string, config: OpenAIConfig) {
  const { auth_key, api_url, instruction, model, temperature } = config
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth_key}`
  }

  const body = JSON.stringify({
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
    temperature
  })

  const res = await fetch(api_url, {
    method: "POST",
    headers,
    body
  })
  const json = await res.json()
  console.log(json)

  if (json.error) {
    throw new Error(`${json.error.code}:${json.error.message}`)
  }
  const text = json.choices[0].message.content.trim() as string
  return text
}

export async function cloudeAPI(input: string, config: OpenAIConfig) {
  const { auth_key, api_url, instruction, model, temperature } = config
  const headers = {
    "x-api-key": auth_key,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  }
  const body = JSON.stringify({
    model,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `${instruction}\n${input}`
      }
    ]
  })
  const res = await fetch(api_url, {
    method: "post",
    headers,
    body
  })
  const json = await res.json()
  console.log({ json })
  return json.content.at(0).text
}
