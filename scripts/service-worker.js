async function sendMessage(message) {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (!tab || tab.url?.startsWith('chrome://')) return undefined
  const response = await chrome.tabs.sendMessage(tab.id, message)
  // do something with response here, not outside the function
  console.log(response)
}

function cleanup() {
  sendMessage({ command: setup })
}

function setup(apiKey) {
  addListener('Improve')
  addListener('Complete')
  addListener('Ask')
  if (!apiKey) {
    cleanup()
  } else {
    console.log('GPT4Overleaf: OpenAI API key set, enabling GPT4Overleaf features.')
    sendMessage({ command: setup, apiKey: apiKey })
  }
}

function addListener(commandName) {
  chrome.commands.onCommand.addListener((command) => {
    if (command !== commandName) return
    console.log(`Command ${command} triggered`)
    sendMessage({ command: command })
  })
}

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
  if (!tab || tab.url?.startsWith('chrome://')) return undefined
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['scripts/content.js']
  }).then(() => console.log('script injected'))
})()

try {
  chrome.storage.local.get('openAIAPIKey').then(({ openAIAPIKey }) => setup(openAIAPIKey))
} catch (error) {
  console.error('GPT4Overleaf: ' + error)
}
