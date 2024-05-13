const apiKey = ""

async function ChatGTP({ instruction, input }) {
  const apiUrl = "https://api.openai.com/v1/chat/completions"
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  }
  const model = "gpt-4-turbo"

  const res = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: input }
      ],
      temperature: 0
    })
  })
  const json = res.json()
  return json.choices.at(0).message.content
}

async function Claude({ instruction, input }) {
  const url = "https://api.anthropic.com/v1/messages"
  const headers = {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json"
  }
  const body = JSON.stringify({
    model: "claude-3-opus-20240229",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `${instruction}\n${input}`
      }
    ]
  })
  const res = await fetch(url, {
    method: "post",
    headers,
    body
  })
  const json = await res.json()
  console.log(json)
  return json.content.at(0).text
}

const instruction = "文章の誤字、脱字、スペルミスを修正してください。"

const input = `
この文章は、ところどろ間違っており、できれば習性して欲しいです。特に ChatGTP についての記述は注意したです。
`.trim()

// const result = await ChatGTP({ instruction, input })
const result = await Claude({ instruction, input })
console.log(input)
console.log(result)
