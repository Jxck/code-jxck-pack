const apiKey = ""

import https from "node:https"


async function post(url, option) {
  const { hostname, pathname } = new URL(url)

  const { method, headers, body } = option

  const options = {
    method,
    hostname,
    port: 443,
    path: pathname,
    headers
  }

  return new Promise((done, fail) => {
    let json = ""
    const req = https.request(options, (res) => {
      res.on("data", (chunk) => {
        json += chunk
      })
      res.on("end", () => {
        done(JSON.parse(json))
      })
    })
    req.on("error", (error) => {
      fail(error)
    })

    req.write(body)
    req.end()
  })
}

async function proof({ input }) {
  const apiUrl = "https://api.openai.com/v1/edits"
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  }
  const model = "text-davinci-edit-001"
  const instruction = "文章の誤字、脱字、スペルミスを修正してください。"

  const res = await post(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      input,
      instruction,
      temperature: 0.2
    })
  })
  return res
}

const input = `
この文章は、ところどろ間違っており、できれば習性して欲しいです。特に ChatGTP についての記述は注意したです。
`.trim()

const result = await proof({ input })
console.log(result)
