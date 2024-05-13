const apiKey = ""

async function proof({ input }) {
  const apiUrl = "https://api.openai.com/v1/chat/completions"
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  }
  const model = "gpt-4-turbo"
  const instruction = "文章の誤字、脱字、スペルミスを修正してください。"

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
  return res.json()
}

const input = `
この文章は、ところどろ間違っており、できれば習性して欲しいです。特に ChatGTP についての記述は注意したです。
`.trim()

const result = await proof({ input })
console.log(input)
console.log(result.choices.at(0).message.content)
