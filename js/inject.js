var delayTime = 3000;
var CW_PLUS_VERSION = '2.0.1';

function CWPlusInjectScript(src) {
  let script = document.createElement('script');

  script.src = chrome.runtime.getURL(src);
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

function preLoad() {
  let chat_send_tool = $("#_chatSendArea ul").first();
  chat_send_tool.append(
    $("<li>", { id: "_CWPlusPreLoad", css: {
        "display": "inline-block"
    } }).append(
        $("<span>", { id: "CWPlusPreLoad" })
    )
  );
  let chatpp_pre_load = $("#CWPlusPreLoad");
  let delay_time = delayTime / 1000;
  let pre_load_interval = setInterval(() => {
    if (--delay_time <= 0) {
        $("#_CWPlusPreLoad").remove();
        window.clearInterval(pre_load_interval);
    }
    let text = `Chartwork Plus will be loaded in about ${delay_time} second${delay_time > 1 ? "s" : ""}`;
    chatpp_pre_load.html(text);
  }, 1000);
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
