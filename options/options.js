const saveOptions = () => {
  const is_id_only = document.getElementById("is_id_only").checked;
  const is_one_page = document.getElementById("is_one_page").checked;
  const color = document.getElementById("color").value;

  chrome.storage.sync.set(
    { is_id_only: is_id_only, is_one_page: is_one_page, color: color },
    () => {
      updateStatus("Options Saved!");
    }
  );
};

const updateStatus = (message) => {
  const status = document.getElementById("status");
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 7500);
};

const restoreOptions = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      { is_id_only: false, is_one_page: false, color: "#ff0000" },
      (items) => {
        resolve(items);
      }
    );
  });
};

const updateOptions = () => {
  restoreOptions().then((items) => {
    document.getElementById("is_id_only").checked = items.is_id_only;
    document.getElementById("is_one_page").checked = items.is_one_page;
    document.getElementById("color").value = items.color;
  });
};

const trySendMessage = (message) => {
  chrome.runtime.sendMessage({ action: message }, (response) => {
    if (chrome.runtime.lastError) {
      updateStatus(
        "Error! make sure that the \nextension has access to umapure "
      );
    } else if (response && response.status) updateStatus(response.status);
  });
};

document.addEventListener("DOMContentLoaded", updateOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document
  .getElementById("clear-all")
  .addEventListener("click", () => trySendMessage("clearAll"));
document
  .getElementById("clear-factors")
  .addEventListener("click", () => trySendMessage("clearFactors"));

document
  .getElementById("clear-ids")
  .addEventListener("click", () => trySendMessage("clearIds"));
