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

//region helper functions
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
//endregion

//region handlers
function makeImproveTextHandler(openAI) {
  return async (tab) => {
    console.log('i1')
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
}

function makeCompleteTextHandler(openAI) {
  return async (tab) => {
    console.log('c1')
    console.log('c2')
    if (!(await settingIsEnabled("textCompletion"))) return;
    console.log('c3')
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (!selectedText) return;
    const editedText = await openAI.completeText(selectedText);
    replaceSelectedText(selectedText + editedText, selection);
  }
}

function makeAskHandler(openAI) {
  return async (command, tab) => {
    console.log('a1')
    if (!(await settingIsEnabled("textAsk"))) return;
    console.log('a2')
    const selection = window.getSelection();
    const selectedText = selection.toString();
    if (!selectedText) return;
    const editedText = await openAI.completeText('In Latex, '+ selectedText);
    console.log('a3')
    replaceSelectedText(editedText, selection);
  }
}
//endregion

let currentAPIKey;

function cleanup() {
  chrome.commands.onCommand.removeListener('Improve');
  chrome.commands.onCommand.removeListener('Complete');
  chrome.commands.onCommand.removeListener('Ask');
}

function setup(apiKey) {
  if (currentAPIKey === apiKey) return;

  cleanup();
  currentAPIKey = apiKey;

  if (!currentAPIKey) return;

  console.log("GPT4Overleaf: OpenAI API key set, enabling GPT4Overleaf features.");

  const openAI = new OpenAIAPI(currentAPIKey);

  addListener('Improve', makeImproveTextHandler(openAI));
  addListener('Complete', makeCompleteTextHandler(openAI));
  addListener('Ask', makeAskHandler(openAI));
}
          
function addListener(commandName, func) {
  chrome.commands.onCommand.addListener((command) => {
    if(command!==commandName) return;
    console.log(`Command ${command} triggered`);
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      func(tabs[0]);
    });
  });
}

try {
  console.log('started gpt4overleaf');
  chrome.storage.local.get("openAIAPIKey").then(({ openAIAPIKey }) => setup(openAIAPIKey));
} catch (error) {
  console.error('GPT4Overleaf: ' + error);
}
