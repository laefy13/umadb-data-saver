chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

const umapure = "https://uma.pure-db.com";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBadgeText") {
    chrome.action.setBadgeText({
      tabId: sender.tab.id,
      text: message.text,
    });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url.startsWith(umapure)) {
    const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
    const nextState = prevState === "ON" ? "OFF" : "ON";

    await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
    });
    console.log("Clicked");

    if (nextState === "ON") {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["scripts/content.js"],
      });
      chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["styles/factor.css"],
      });
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case "clearAll":
        case "clearFactors":
        case "clearIds":
          chrome.tabs.sendMessage(
            tab.id,
            { action: message.action },
            (response) => {
              if (response && response.status) {
                sendResponse(response);
              }
            }
          );

          break;
        default:
          console.log("Unknown action:", message.action);
          break;
      }
      return true;
    });
  }
});
