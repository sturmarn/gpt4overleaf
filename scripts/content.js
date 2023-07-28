class OpenAIAPI {
  static defaultModel = "text-davinci-003";

  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  query(endpoint, data) {
    return new Promise((resolve, reject) => {
      const url = `https://api.openai.com/v1/${endpoint}`;

      if (!data.model) data.model = OpenAIAPI.defaultModel;

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Authorization", `Bearer ${this.apiKey}`);
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status !== 200) return reject("Failed to query OpenAI API.");

        const jsonResponse = JSON.parse(xhr.responseText);

        if (!jsonResponse.choices) return reject("Failed to query OpenAI API.");

        return resolve(jsonResponse.choices);
      };

      xhr.send(JSON.stringify(data));
    });
  }

  async completeText(text) {
    const data = {
      max_tokens: 512,
      prompt: text,
      n: 1,
      temperature: 0.5,
    };

    const result = await this.query("completions", data);

    return result[0].text;
  }

  async improveText(text) {
    const data = {
      model: "code-davinci-edit-001",
      input: text,
      instruction:
        "Correct any spelling mistakes, grammar mistakes, and improve the overall style of the (latex) text.",
      n: 1,
      temperature: 0.5,
    };

    const result = await this.query("edits", data);

    return result[0].text;
  }
}

function replaceSelectedText(replacementText, selection) {
  const sel = selection === undefined ? window.getSelection() : selection;

  if (sel.rangeCount) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(replacementText));
  }
}

async function settingIsEnabled(setting) {
  let result;
  try {
    result = await chrome.storage.local.get(setting);
  } catch (error) {
    return false;
  }

  console.log(result);

  return result[setting];
}

function commentText(text) {
  const regexPattern = /\n/g;
  const replacementString = "\n%";
  let comment = text.replace(regexPattern, replacementString);
  if (!comment.startsWith("%")) {
    comment = '%' + comment;
  }
  return comment;
}

function makeImproveTextHandler(openAI) {
  const handler = async (command, tab) => {
    console.log('i1')
    if(command !== 'Improve') return;
    if (!(await settingIsEnabled("textImprovement"))) return;
    console.log('i2')
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (!selectedText) return;

    console.log('i3')
    const editedText = await openAI.improveText(selectedText);
    const commentedText = commentText(selectedText);
    replaceSelectedText(commentedText + "\n" + editedText, selection);
  };

  chrome.commands.onCommand.addListener(handler);  
  const removeEventHandler = () => chrome.commands.onCommand.removeListener(handler);
  return removeEventHandler;
}

function makeCompleteTextHandler(openAI) {
  const handler = async (command, tab) => {
      console.log('c1')
      if(command !== "Complete") return;
    console.log('c2')
      if (!(await settingIsEnabled("textCompletion"))) return;
    console.log('c3')
      const selection = window.getSelection();
      const selectedText = selection.toString();
      if (!selectedText) return;
      const editedText = await openAI.completeText(selectedText);
      replaceSelectedText(selectedText + editedText, selection);
  }
  chrome.commands.onCommand.addListener(handler);  
  const removeEventHandler = () => chrome.commands.onCommand.removeListener(handler);
  return removeEventHandler;
}

function makeAskHandler(openAI) {
  const handler = async (command, tab) => {
    console.log('a1')
    if(command !== "Ask") return;
    if (!(await settingIsEnabled("textAsk"))) return;
    console.log('a2')
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (!selectedText) return;
    const editedText = await openAI.completeText('In Latex, '+ selectedText);
    console.log('a3')
    replaceSelectedText(editedText, selection);
  }
  chrome.commands.onCommand.addListener(handler);  
  const removeEventHandler = () => chrome.commands.onCommand.removeListener(handler);
  return removeEventHandler;
}

let currentAPIKey;
let cleanupHandlers = [];

function cleanup() {
  cleanupHandlers.forEach((handler) => handler());
  cleanupHandlers = [];
}

function setup(apiKey) {
  if (currentAPIKey === apiKey) return;

  cleanup();
  currentAPIKey = apiKey;

  if (!currentAPIKey) return;

  console.log("GPT4Overleaf: OpenAI API key set, enabling GPT4Overleaf features.");

  const openAI = new OpenAIAPI(currentAPIKey);

  cleanupHandlers.push(makeImproveTextHandler(openAI));
  cleanupHandlers.push(makeCompleteTextHandler(openAI));
  cleanupHandlers.push(makeAskHandler(openAI));
}

setInterval(async () => {
  try {
    await chrome.storage.local.get("openAIAPIKey").then(({ openAIAPIKey }) => setup(openAIAPIKey));
  } catch (error) {
    cleanup();
  }
}, 1000);
