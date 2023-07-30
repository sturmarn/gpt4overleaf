class OpenAIAPI {
  static defaultModel = 'text-davinci-003'

  constructor(apiKey) {
    this.apiKey = apiKey
  }

  query(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = `https://api.openai.com/v1/${endpoint}`

      if (!data.model) data.model = OpenAIAPI.defaultModel

      const xhr = new XMLHttpRequest()
      xhr.open('POST', url, true)
      xhr.setRequestHeader('Content-Type', 'application/json')
      xhr.setRequestHeader('Authorization', `Bearer ${this.apiKey}`)
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return
        if (xhr.status !== 200) return reject('Failed to query OpenAI API.')

        const jsonResponse = JSON.parse(xhr.responseText)

        if (!jsonResponse.choices) return reject('Failed to query OpenAI API.')

        return resolve(jsonResponse.choices)
      }

      xhr.send(JSON.stringify(data))
    })
  }

  async completeText(text) {
    const data = {
      max_tokens: 512,
      prompt: text,
      n: 1,
      temperature: 0.5
    }

    const result = await this.query('completions', data)

    return result[0].text
  }

  async improveText(text) {
    const data = {
      model: 'code-davinci-edit-001',
      input: text,
      instruction:
        'Correct any spelling mistakes, grammar mistakes, and improve the overall style of the (latex) text.',
      n: 1,
      temperature: 0.5
    }

    const result = await this.query('edits', data)

    return result[0].text
  }
}

function replaceSelectedText(replacementText, selection) {
  const sel = selection === undefined ? window.getSelection() : selection

  if (sel.rangeCount) {
    const range = sel.getRangeAt(0)
    range.deleteContents()
    range.insertNode(document.createTextNode(replacementText))
  }
}

async function settingIsEnabled(setting) {
  let result
  try {
    result = await chrome.storage.local.get(setting)
  } catch (error) {
    return false
  }
  return result[setting]
}

function commentText(text) {
  const regexPattern = /\n/g
  const replacementString = '\n%'
  let comment = text.replace(regexPattern, replacementString)
  if (!comment.startsWith('%')) {
    comment = '%' + comment
  }
  return comment
}

async function improveTextHandler(openAI) {
  if (!(await settingIsEnabled('textImprovement'))) return
  const selection = window.getSelection()
  const selectedText = selection.toString()
  if (!selectedText) return
  const editedText = await openAI.improveText(selectedText)
  const commentedText = commentText(selectedText)
  replaceSelectedText(commentedText + '\n' + editedText, selection)
}

async function completeTextHandler(openAI) {
  if (!(await settingIsEnabled('textCompletion'))) return
  const selection = window.getSelection()
  const selectedText = selection.toString()
  if (!selectedText) return
  const editedText = await openAI.completeText(selectedText)
  replaceSelectedText(selectedText + editedText, selection)
}

async function askHandler(openAI) {
  if (!(await settingIsEnabled('textAsk'))) return
  const selection = window.getSelection()
  const selectedText = selection.toString()
  if (!selectedText) return
  const editedText = await openAI.completeText('In Latex, ' + selectedText)
  replaceSelectedText(editedText, selection)
}

let currentAPIKey
let openAI = undefined

function cleanup() {
}

function setAPIKey(key) {
  if (currentAPIKey === key) return
  cleanup()
  currentAPIKey = key
  if (currentAPIKey) {
    openAI = new OpenAIAPI(currentAPIKey)
    console.log('AI4Overleaf: OpenAI API key set, enabling AI4Overleaf features.')
  } else {
    openAI = undefined
    console.log('AI4Overleaf: OpenAI API key is not set, AI4Overleaf features are disabled.')
  }
}

function handleCommand(command) {
  console.log('Handling command')
  if (command === 'Improve') {
    improveTextHandler(openAI)
  } else if (command === 'Complete') {
    completeTextHandler(openAI)
  } else if (command === 'Ask') {
    askHandler(openAI)
  }
}

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log(`Received request: ${JSON.stringify(request)}`)
    if (request.command === 'setup') {
      setAPIKey(request.apiKey)
    } else {
      if (!openAI) {
        chrome.storage.local.get('openAIAPIKey').then(({ openAIAPIKey }) => {
          setAPIKey(openAIAPIKey)
          if (openAI) {
            handleCommand(request.command)
          }
        })
      } else {
        handleCommand(request.command)
      }
    }
  }
)

