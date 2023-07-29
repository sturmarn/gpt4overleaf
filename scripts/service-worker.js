chrome.commands.onCommand.addListener((command) => {
  console.log(`Command "${command}" triggered`);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log(`Tab ${tabs[0].id}`);
  });
});

