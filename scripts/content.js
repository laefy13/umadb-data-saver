(function () {
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

  const changeButton = (text) => {
    chrome.runtime.sendMessage({ action: "updateBadgeText", text: text });
  };

  const saveData = (storage_item_key, data) => {
    localStorage.setItem(storage_item_key, JSON.stringify(data));
  };

  const dataInit = () => {
    const is_id_only =
      document.getElementsByTagName("body")[0].getAttribute("is-id-only") ===
      "true";
    const storage_item_key = is_id_only ? "trainer_ids" : "factors";

    let raw_data = localStorage.getItem(storage_item_key);
    return [
      storage_item_key,
      raw_data ? JSON.parse(raw_data) : is_id_only ? [] : {},
    ];
  };

  const deleteMultKeys = (keys) => {
    let [storage_item_key, data] = dataInit();
    if (storage_item_key === "factors") keys.forEach((key) => delete data[key]);
    else data = data.filter((item) => !keys.includes(item));
    saveData(storage_item_key, data);

    const delete_status = document.querySelector(`.del-all`);
    if (delete_status) {
      delete_status.innerHTML = "Deleted!";
    }
  };

  const deleteKey = (key) => {
    const [storage_item_key, data] = dataInit();
    if (storage_item_key === "factors") delete data[key];
    else {
      const index = data.indexOf(key);
      if (index > -1) {
        data.splice(index, 1);
      }
    }
    saveData(storage_item_key, data);

    const delete_status = document.querySelector(`.key-${key}`);
    if (delete_status) {
      delete_status.innerHTML = "Deleted!";
    }
  };

  const generateDeleteButton = () => {
    const del_button = document.createElement("button");
    const del_svg = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    const del_path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

    del_button.setAttribute("class", "del-id-button");

    del_svg.setAttribute("class", "w-6 h-6 text-gray-800 dark:text-white");
    del_svg.setAttribute("aria-hidden", "true");
    del_svg.setAttribute("width", "24");
    del_svg.setAttribute("height", "24");
    del_svg.setAttribute("viewbox", "0 0 24 24");

    del_path.setAttribute("fill-rule", "evenodd");
    del_path.setAttribute(
      "d",
      "M8.586 2.586A2 2 0 0 1 10 2h4a2 2 0 0 1 2 2v2h3a1 1 0 1 1 0 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V8a1 1 0 0 1 0-2h3V4a2 2 0 0 1 .586-1.414ZM10 6h4V4h-4v2Zm1 4a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Zm4 0a1 1 0 1 0-2 0v8a1 1 0 1 0 2 0v-8Z"
    );
    del_path.setAttribute("clip-rule", "evenodd");

    del_svg.appendChild(del_path);
    del_button.appendChild(del_svg);

    return del_button;
  };

  const deleteCurrentPageIds = () => {
    const del_buttons = document.querySelectorAll("button[data-id]");

    if (!del_buttons) return;
    const keys = [];
    for (let i = 0; i < del_buttons.length; i++) {
      const id = del_buttons[i].getAttribute("data-id");
      keys.push(id);
    }

    deleteMultKeys(keys);
  };

  const main = () => {
    const body_el = document.getElementsByTagName("body")[0];
    const is_id_only = body_el.getAttribute("is-id-only") === "true";
    const is_one_page = body_el.getAttribute("is-one-page") === "true";
    const is_hooked = body_el.getAttribute("is-hooked") === "true";

    const css_name = "factors-added-class";
    const tbody_el = document.getElementsByTagName("tbody")[0];

    const rows = tbody_el?.getElementsByTagName("tr");
    // make sure that the nothing is done when no rows
    if (!rows) return;

    if (!is_hooked) {
      // works like a first time script run so i will put this here
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.action) {
          case "clearAll":
            localStorage.removeItem("factors");
            localStorage.removeItem("trainer_ids");
            setTimeout(() => {
              sendResponse({ status: "All cleared" });
            }, 1000);

            break;
          case "clearFactors":
            localStorage.removeItem("factors");
            setTimeout(() => {
              sendResponse({ status: "Factors cleared" });
            }, 1000);

            break;
          case "clearIds":
            localStorage.removeItem("trainer_ids");
            setTimeout(() => {
              sendResponse({ status: "Ids cleared" });
            }, 1000);

            break;
          default:
            sendResponse({ status: "watchu doing cuz" });
            break;
        }
        return true;
      });

      // hook the search button
      const success_btns = document.getElementsByClassName("btn-success");
      // the search button is currently the first element,
      // so the this should be fast
      for (let i = 0; i < success_btns.length; i++) {
        const success_btn = success_btns[i];
        if (!success_btn) break;
        if (success_btn.textContent.trim() !== "検索") continue;
        success_btn.addEventListener("click", () => changeButton("OFF"));
        body_el.setAttribute("is-hooked", "true");
        break;
      }
    }

    if (!document.querySelector(".del-all-btn")) {
      // first btn-group
      const btn_grp = document.querySelector(".btn-group");
      const del_all_btn = generateDeleteButton();
      del_all_btn.setAttribute("class", "del-all-btn");
      del_all_btn.addEventListener("click", deleteCurrentPageIds);
      btn_grp.appendChild(del_all_btn);

      const del_all_status = document.createElement("span");
      del_all_status.innerText = "Not Deleted";
      del_all_status.setAttribute("class", `del-all`);
      btn_grp.appendChild(del_all_status);
    } else {
      const delete_all_status = document.querySelector(`.del-all`);
      if (delete_all_status) {
        delete_all_status.innerHTML = "Not Deleted";
      }
    }

    if (
      rows[0].textContent.trim() === "なし" ||
      rows[0].textContent.trim().includes("Loading...")
    ) {
      window.alert("no content cuz");
      changeButton("OFF");
      return;
    }
    const rows_len = rows.length;
    let is_changed = false;
    let data = undefined;
    const storage_item_key = is_id_only ? "trainer_ids" : "factors";

    data = localStorage.getItem(storage_item_key);
    data = is_id_only
      ? data
        ? JSON.parse(data)
        : []
      : data
      ? JSON.parse(data)
      : {};

    for (let i = 0; i < rows_len; i++) {
      const row = rows[i];

      const id_el = row.getElementsByTagName("span")[0];
      if (!id_el) continue;
      const id = id_el.textContent.trim();
      if (!id) continue;
      let exists = is_id_only ? data.includes(id) : id in data;

      let factor_array = [];
      if (!is_id_only) {
        const skill_factors = row.querySelectorAll(".factor.factor4");
        const race_factors = row.querySelectorAll(".factor.factor5");
        const scenario_factors = row.querySelectorAll(".factor.factor6");

        skill_factors.forEach((factor) => {
          factor_array.push(factor.textContent.trim());
        });
        race_factors.forEach((factor) => {
          factor_array.push(factor.textContent.trim());
        });
        scenario_factors.forEach((factor) => {
          factor_array.push(factor.textContent.trim());
        });
        exists &&= JSON.stringify(factor_array) === JSON.stringify(data[id]);
      }

      const header_el = row.querySelector(".header");

      if (!header_el) continue;
      if (exists) {
        header_el.classList.add(css_name);
      } else {
        if (is_id_only) {
          data.push(id);
        } else {
          data[id] = factor_array;
        }
        is_changed = true;
        header_el.classList.remove(css_name);
      }
      let del_id_button = row.querySelector(".header .del-id-button");
      let del_status = row.querySelector(".header .del-status");

      const handleDelete = (event) => {
        const button = event.currentTarget;
        const id = button.getAttribute("data-id");

        deleteKey(id);
      };

      if (!del_id_button) {
        del_id_button = generateDeleteButton(id);
        del_id_button.addEventListener("click", handleDelete);
        header_el.appendChild(del_id_button);
        del_status = document.createElement("span");
        header_el.appendChild(del_status);
      }

      del_status.innerText = "Not Deleted";
      del_status.setAttribute("class", `del-status key-${id}`);
      del_id_button.setAttribute("data-id", id);
    }
    if (is_changed) saveData(storage_item_key, data);
    changeButton("ON");
    pageLinkAddListeners(is_one_page);
  };
  const removeClasses = () => {
    const css_name = "factors-added-class";

    const rows = document
      .getElementsByTagName("tbody")[0]
      .getElementsByTagName("tr");

    if (!rows) return;
    const rows_len = rows.length;

    for (let i = 0; i < rows_len; i++) {
      const header_el = rows[i].querySelector(".header");
      header_el.classList.remove(css_name);
      header_el.querySelector(".del-id-button")?.remove();
      header_el.querySelector(".del-status")?.remove();
      document.querySelector(".del-all")?.remove();
      document.querySelector(".del-all-btn")?.remove();
    }
  };

  const pageLinkAddListeners = (is_one_page) => {
    const page_links = document.getElementsByClassName("page-link");
    for (let i = 0; i < page_links.length; i++) {
      const page_link = page_links[i];
      if (!page_link) break;
      if (is_one_page) {
        page_link.removeEventListener("click", removeClasses);
        page_link.addEventListener("click", removeClasses);
        changeButton("OFF");
      } else {
        page_link.removeEventListener("click", main);
        page_link.addEventListener("click", main);
      }
    }
  };

  const rgbToHex = (rgb) => {
    const rgbValues = rgb.replace(/^rgb\(|\s+|\)$/g, "").split(",");
    const r = parseInt(rgbValues[0], 10);
    const g = parseInt(rgbValues[1], 10);
    const b = parseInt(rgbValues[2], 10);

    const hex =
      "#" +
      ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16)
        .slice(1)
        .toUpperCase();

    return hex;
  };

  const init = () => {
    restoreOptions().then((items) => {
      const element = document.querySelector(".factors-added-class");
      const color = items.color;
      if (element) {
        const color_css = window.getComputedStyle(
          element,
          null
        ).backgroundColor;
        const hex_color_css = rgbToHex(color_css);
        if (hex_color_css.toUpperCase() !== color.toUpperCase()) {
          const style = document.createElement("style");
          style.innerHTML = `.factors-added-class { background-color: ${items.color} !important; }`;
          document.head.appendChild(style);
        }
      } else {
        const style = document.createElement("style");
        style.innerHTML = `.factors-added-class { background-color: ${items.color} !important; }`;
        document.head.appendChild(style);
      }
      const body_el = document.getElementsByTagName("body")[0];
      body_el.setAttribute("is-id-only", items.is_id_only);
      body_el.setAttribute("is-one-page", items.is_one_page);
      main();
    });
  };

  init();
})();
