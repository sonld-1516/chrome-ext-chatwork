var delayTime = 5000;
var CW_PLUS_VERSION = '3.1.0';

function CWPlusInjectScript(src) {
  let script = document.createElement('script');

  script.src = chrome.runtime.getURL(src);
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

function preLoad() {
  // Wait for chat send area to be available
  function createPreloadMessage() {
    let chat_send_tool = $("#_chatSendArea ul").first();

    // If chat send area not found, try alternative selectors
    if (chat_send_tool.length === 0) {
      chat_send_tool = $(".chatInput ul").first();
    }

    // If still not found, append to body as fallback
    if (chat_send_tool.length === 0) {
      $("body").append(
        $("<div>", {
          id: "_CWPlusPreLoad",
          css: {
            "position": "fixed",
            "bot": "10px",
            "right": "10px",
            "background": "rgb(42, 71, 127)",
            "color": "white",
            "padding": "10px",
            "border-radius": "5px",
            "z-index": "9999",
            "font-size": "14px"
          }
        }).append(
          $("<span>", { id: "CWPlusPreLoad" })
        )
      );
    } else {
      chat_send_tool.append(
        $("<li>", {
          id: "_CWPlusPreLoad",
          css: {
            "display": "inline-block",
            "color": "rgb(42, 71, 127)",
            "font-weight": "bold",
            "margin": "0 10px"
          }
        }).append(
          $("<span>", { id: "CWPlusPreLoad" })
        )
      );
    }

    let chatpp_pre_load = $("#CWPlusPreLoad");
    let delay_time = delayTime / 1000;

    // Set initial text
    let text = `Chatwork Plus will be loaded in about ${delay_time} second${delay_time > 1 ? "s" : ""}`;
    chatpp_pre_load.html(text);

    let pre_load_interval = setInterval(() => {
      if (--delay_time <= 0) {
        $("#_CWPlusPreLoad").remove();
        window.clearInterval(pre_load_interval);
        return;
      }
      let text = `Chatwork Plus will be loaded in about ${delay_time} second${delay_time > 1 ? "s" : ""}`;
      chatpp_pre_load.html(text);
    }, 1000);
  }

  // Try to create preload message, retry if chat area not ready
  if ($("#_chatSendArea").length > 0 || $(".chatInput").length > 0) {
    createPreloadMessage();
  } else {
    // Wait for DOM to be ready
    setTimeout(() => {
      createPreloadMessage();
    }, 500);
  }
}

function init() {
  let info = localStorage['CWPLUS_INFO']

  if (info === undefined) {
    info = {};
  } else {
    info = JSON.parse(info);
  }

  if (!info.force_update_version || info.force_update_version < CW_PLUS_VERSION) {
    info.force_update_version = CW_PLUS_VERSION;
    info.emoticon_status = true;
  }

  if (info.emoticon_status == false) {
    addInjectedScript();
  } else {
    getData(info);
  }
}

function addInjectedScript() {
  CWPlusInjectScript('js/lib/caretposition.js');
  CWPlusInjectScript('js/lib/fuse.min.js');
  setTimeout(() => {
    CWPlusInjectScript('js/emoticon.js');
    CWPlusInjectScript('js/insertTag.js');
  }, 200)
  CWPlusInjectScript('js/mention.js');
}

function getData(info) {
  preLoad();
  CWPlusInjectScript('js/settings/emoticons.js');
  setTimeout(() => {
    addInjectedScript();
  }, delayTime + 1000);

  info.emoticon_status = false;
  localStorage['CWPLUS_INFO'] = JSON.stringify(info);
}

init();
