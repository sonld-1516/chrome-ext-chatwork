var info_tag = {
  id: "infoTag",
  class: "sc-gmgFlS CWPlus__tag-button _showDescription",
  attr: {
    "role": "button",
    "aria-label": "Add info tag"
  },
  html: "<strong>[info]</strong>"
};

var code_tag = {
  id: "codeTag",
  class: "sc-gmgFlS CWPlus__tag-button _showDescription",
  attr: {
    "role": "button",
    "aria-label": "Add code tag"
  },
  html: "<strong>[code]</strong>"
};

var title_tag = {
  id: "titleTag",
  class: "sc-gmgFlS CWPlus__tag-button _showDescription",
  attr: {
    "role": "button",
    "aria-label": "Add title tag"
  },
  html: "<strong>[title]</strong>"
}

function isTagAdded() {
  return $(".CWPlus__tag-button").length > 0;
}

$(document).ready(function() {
  var chat_send_tool = $("#_chatSendArea ul").first();

  if (!isTagAdded()) {
    chat_send_tool.append($("<button>", title_tag)); // Add title button tag
    chat_send_tool.append($("<button>", info_tag)); // Add info button tag
    chat_send_tool.append($("<button>", code_tag)); // Add code buton tag
  }

  $("#infoTag").click(function() {
    setSuggestedChatTag("info");
  });

  $("#titleTag").click(function() {
    setSuggestedChatTag("title");
  });

  $("#codeTag").click(function() {
    setSuggestedChatTag("code");
  });

  function setSuggestedChatTag(type) {
    var chat_text = $("#_chatText");
    var old = chat_text.val();
    var start_pos = chat_text[0].selectionStart;
    var end_pos = chat_text[0].selectionEnd;
    var selectedString = old.substring(start_pos, end_pos);
    var tag = "[" + type + "]" + selectedString + "[/" + type + "]";
    var content = old.substring(0, start_pos) + tag + old.substring(end_pos, old.length);
    var selectionStart = (old.substring(0, start_pos) + "[" + type + "]");
    var selectionEnd = (selectionStart + selectedString).length;

    chat_text.val(content);

    if (selectedString.length === 0) {
      chat_text[0].selectionStart = selectionEnd;
      chat_text[0].selectionEnd = selectionEnd;
    } else chat_text[0].setSelectionRange(selectionStart.length, selectionEnd);

    chat_text.focus();
  };
});
