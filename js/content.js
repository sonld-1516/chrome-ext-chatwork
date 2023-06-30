// Golbal variable
var isDisplayMentionBox = false;
var actived_atmark_index = 0;
var is_navigated = false;
var is_inserted = false;
var current_index = 0;
var selected_index = 0;
var is_outbound_of_list = false;
var insert_type = '';
var insert_mode = 'normal';
var cached_enter_action = ST.data.enter_action;
var DISPLAY_NUMS = 3;
var SPECIAL_CHARS = ["\n", "!", "$", "%", "^", "&", "*", "(", ")", "-", "+", "=", "[", "]", "{", "}", ";", ":", ",", "/", "`", "'", "\""];
var MAX_PATTERN_LENGTH = 20;


function htmlEncode(value) {
  return $("<div/>").text(value).html();
}

function getMemberObject(member) {
  let h = CW.is_business && ST.data.private_nickname && !RM.isInternal() ? AC.getDefaultNickName(member) : AC.getNickName(member);

  return {
    value: member,
    avatar: CW.getAvatarPanel(member, {
      clicktip: !1,
      size: "small"
    }),
    label: `<p class="autotrim">${htmlEncode(h)}</p>`,
    aid2name: htmlEncode(h)
  }
}

function buildMemberListData(toAll = false) {
  if (!RM) return [];
  let sorted_member_list = RM.getSortedMemberList();
  let b = [];

  let sorted_members_length = sorted_member_list.length;
  for (let index = 0; index < sorted_members_length; index++) {
    let member = sorted_member_list[index];
    if (member != AC.myid) {
      b.push(getMemberObject(member));
    }
  }

  if (toAll) {
    b.push({
      value: 'toall',
      aid2name: htmlEncode('toall')
    });
  }
  return b;
}

function toAllHtml() {
  txt = `<li role="listitem" class="suggested-name tooltipList__item" data-cwui-lt-idx="0" data-cwui-lt-value="toall"><div class="toSelectorTooltip__toAllIconContainer">`;
  txt += `<svg class="toSelectorTooltip__toAllIcon" viewBox="0 0 10 10">`;
  txt += `<use fill-rule="evenodd" xlink:href="#icon_toSelectorToAll"></use>`;
  txt += `</svg></div><div><p>All Members</p>`;
  txt += `<p class="toSelectorTooltip__toAllAlert">Notify all ${RM.getSortedMemberList().length - 1} members</p>`;
  txt += `</div></li>`

  return txt;
}

function buildList(members) {
  if (members.length) {
    let txt = "<ul>";

    for (let i = 0; i < members.length; i++) {
      if (members[i].value == 'toall') txt += toAllHtml();
      else txt += `<li class="suggested-name tooltipList__item" role="listitem" data-cwui-lt-value="${members[i].value}">${members[i].avatar + members[i].label}</li>`;
    }
    txt += "</ul>";
    return txt;
  } else {
    return `<ul><li class="suggested-name tooltipList__item disabled" role="listitem" disabled>No Matching Results</li></ul>`;
  }
}

function showMentionBox(content) {
  $("#suggestion-container").html(content).show();
  $("#suggestion-container").css("visibility", "visible");
  isDisplayMentionBox = true;

  if (is_navigated) {
    $(".suggested-name").eq(selected_index).css("background-color", "#D8F0F9");
  } else {
    $(".suggested-name").first().css("background-color", "#D8F0F9");
  }

  $(".suggested-name").click((e) => {
    if ($(".suggested-name").hasClass('disabled')) {
      hideMentionBox();
      return;
    }

    if (is_inserted) {
      return;
    }
    is_inserted = true;
    let target = $(e.currentTarget);
    target.css("background-color", "#D8F0F9");
    setSuggestedChatText(getTypedText(), target.text(), target.data("cwui-lt-value"));
  });
}

function hideMentionBox(content) {
  $("#suggestion-container").html(content).hide();
  $("#suggestion-container").css("visibility", "hidden");
  clearnUp();
}

function clearnUp() {
  isDisplayMentionBox = false;
  is_navigated = false;
  current_index = 0;
  selected_index = 0;
  actived_atmark_index = -1;
  insert_mode = 'normal';
  is_inserted = false;
  $("#suggestion-container").html("");

  // restore setting to correct value
  if (cached_enter_action != ST.data.enter_action && cached_enter_action == "send") {
    ST.data.enter_action = cached_enter_action;
  }
}

// http://blog.vishalon.net/index.php/javascript-getting-and-setting-caret-position-in-textarea/
function doGetCaretPosition(ctrl) {
  let CaretPos = 0; // IE Support
  if (document.selection) {
    ctrl.focus();
    let Sel = document.selection.createRange();
    Sel.moveStart("character", -ctrl.value.length);
    CaretPos = Sel.text.length;
  }
  // Firefox support
  else if (ctrl.selectionStart || ctrl.selectionStart == "0")
    CaretPos = ctrl.selectionStart;
  return (CaretPos);
}

function setCaretPosition(ctrl, pos) {
  if (ctrl.setSelectionRange) {
    ctrl.focus();
    ctrl.setSelectionRange(pos, pos);
  } else if (ctrl.createTextRange) {
    let range = ctrl.createTextRange();
    range.collapse(true);
    range.moveEnd("character", pos);
    range.moveStart("character", pos);
    range.select();
  }
}

function getNearestAtmarkIndex() {
  let content = $("#_chatText").val();
  let atmarks = content.match(/@/ig);

  if (!atmarks) {
    return -1;
  }

  let caret_index = doGetCaretPosition($("#_chatText")[0]);
  let atmark_index = content.indexOf("@");
  let pre_atmark_index = -1;
  do {
    if (atmark_index >= caret_index) {
      break;
    }
    pre_atmark_index = atmark_index;
    atmark_index = content.indexOf("@", atmark_index + 1);
  } while (atmark_index != -1);

  return pre_atmark_index;
}

function getTypedText() {
  let content = $("#_chatText").val();
  let start_pos = getNearestAtmarkIndex();
  if (start_pos == -1) return "";
  let end_pos = doGetCaretPosition($("#_chatText")[0]);
  let txt = content.substr(start_pos, end_pos - start_pos);
  if (txt) {
    return txt;
  } else {
    return "";
  }
}

function findAtmark(params) {
  let content = $("#_chatText").val();

  // we only interested in @ symbol that: at the start of line or has a space before it
  let atmark_index = getNearestAtmarkIndex();
  if (atmark_index != 0 && (content.charAt(atmark_index - 1) != " " && content.charAt(atmark_index - 1) != "\n")) {
    return false;
  }

  if (getTypedText().length >= MAX_PATTERN_LENGTH || getTypedText().length == 0) {
    return false;
  }

  if (atmark_index != -1) {
    let spaces = getTypedText().match(/ /ig);
    // text from last @ to current caret position have more than 2 spaces
    if (spaces && spaces.length > 2) {
      return false;
    }

    // text contains special characters ?
    for (let i = 0; i < SPECIAL_CHARS.length; i++) {
      if (getTypedText().indexOf(SPECIAL_CHARS[i]) != -1) {
        return false;
      }
    }

    return true;
  } else {
    // There is no @ symbol
    return false;
  }
}

function setMentionBoxPosition() {
  let chat_text_element = $("#_chatText")[0];
  let chat_text_jquery = $("#_chatText");
  let rect = chat_text_element.getBoundingClientRect();
  let current_pos = doGetCaretPosition(chat_text_element);

  setCaretPosition(chat_text_element, actived_atmark_index + 1);
  let position = Measurement.caretPos(chat_text_jquery);
  // let position = {left: 295, top: 853};
  position.top -= rect.top;
  position.left -= rect.left;

  if (rect.width - position.left < 236) {
    position.left -= 236;
  }
  if (rect.height - position.top < 90) {
    if (position.top < 108) {
      $("#_chatTextArea").css({
        "overflow-y": "visible",
        "z-index": 2
      });
    }
    position.top -= 118;
  } else {
    position.top += parseInt(chat_text_jquery.css("font-size")) + 5;
  }
  $("#suggestion-container").parent().css({
    position: "relative"
  });

  $("#suggestion-container").css({
    top: position.top,
    left: position.left,
    position: "absolute"
  });
  setCaretPosition(chat_text_element, current_pos);
}

function filterDisplayResults(results) {
  is_outbound_of_list = false;
  if (!is_navigated) return results.slice(0, DISPLAY_NUMS);
  if (current_index < 0) current_index = 0;
  if (current_index >= results.length) current_index = results.length - 1;

  if (results.length <= DISPLAY_NUMS) {
    is_outbound_of_list = true;
    return results;
  }
  if (current_index >= results.length - DISPLAY_NUMS) {
    is_outbound_of_list = true;
    return results.slice(DISPLAY_NUMS * -1);
  } else {
    return results.slice(current_index, current_index + DISPLAY_NUMS);
  }
}

function getRawResultsAndSetType(typed_text) {
  if (insert_type != "contact") {
    if (typed_text == "me") {
      insert_type = "me";
      return [getMemberObject(AC.myid)];
    }
    insert_type = "one";
  }
  let memberData = buildMemberListData(true);
  let fuse = new Fuse(memberData, {
    keys: ['aid2name'],
    maxPatternLength: MAX_PATTERN_LENGTH
  });
  return typed_text ? fuse.search(typed_text) : memberData;
}

function getReplaceText(format_string, target_name, cwid, members) {
  if (!members) {
    return null;
  }
  let replace_text = "";
  switch (insert_type) {
    case "me":
    case "one":
    case "contact":
      replace_text = format_string.format(cwid, target_name);
      break;
    case "group":
    case "all":
      for (let i = 0; i < members.length; i++) {
        replace_text += format_string.format(members[i].value, members[i].aid2name);
      }
      break;
    case "toall":
      if (insert_mode === "to") {
        replace_text = "TO ALL >>> \n";
      } else {
        replace_text = "[toall]\n";
      }
      break;
    default:
      break;
  }
  return replace_text;
}

function setSuggestedChatText(entered_text, target_name, cwid) {
  let chat_text_jquery = $('#_chatText');
  let chat_text_element = chat_text_jquery[0];
  let old = chat_text_jquery.val();
  let start_pos = doGetCaretPosition(chat_text_element) - entered_text.length;
  let replace_text = "";
  let members = buildMemberListData(true);

  if (cwid == 'toall') {
    replace_text = getReplaceText("[toall]\n", target_name, cwid, members);
  } else {
    replace_text = getReplaceText("[To:{0}] {1}\n", target_name, cwid, members)
  }

  let content = old.substring(0, start_pos) + replace_text + old.substring(start_pos + entered_text.length);
  chat_text_jquery.val(content);
  setCaretPosition(chat_text_element, start_pos + replace_text.length);
  hideMentionBox();
}

function holdCaretPosition(event_object) {
  event_object.preventDefault();
  let chat_text_jquery = $('#_chatText');
  chat_text_jquery.focus();
  let current_pos = doGetCaretPosition(chat_text_jquery[0]);

  setCaretPosition(chat_text_jquery[0], current_pos);
}

function isTriggerKeyCode(keyCode) {
  return [37, 38, 39, 40].indexOf(keyCode) == -1;
}

function setUpMention() {
  let chat_text = $("#_chatText");
  let chat_input = chat_text.parent();

  $("<div id='suggestion-container' class='toSelectorTooltip tooltipListWidth tooltip tooltip--white' role='tooltip'></div>").insertAfter(chat_input);
  hideMentionBox();

  chat_text.click(() => hideMentionBox());

  chat_text.on("keyup", function(e) {
    if (e.which == 9 || e.which == 13) {
      return;
    }
    if ((e.which == 38 || e.which == 40) && isDisplayMentionBox) {
      is_navigated = true;
      holdCaretPosition(e);
    } else {
      is_navigated = false;
    }

    if (findAtmark()) {
      if (isDisplayMentionBox && getNearestAtmarkIndex() != -1 && getNearestAtmarkIndex() != actived_atmark_index) {
        hideMentionBox();
      }

      if (!isDisplayMentionBox) {
        if (!isTriggerKeyCode(e.which)) {
          return;
        }
        if (getNearestAtmarkIndex() != -1) {
          actived_atmark_index = getNearestAtmarkIndex();
        }
        setMentionBoxPosition();
        showMentionBox(buildList(buildMemberListData(true)));
      }

      let typed_text = getTypedText();

      if (typed_text.length) {
        let raw_results = getRawResultsAndSetType(typed_text.substring(1));

        if (e.which == 38) {
          current_index -= 1;
        }
        if (e.which == 40) {
          current_index += 1;
        }

        let filtered_results = filterDisplayResults(raw_results);

        if (e.which == 38 && is_outbound_of_list) {
          selected_index -= 1;
          if (selected_index < 0) {
            selected_index = 0;
          }
        }
        if (e.which == 40 && current_index > raw_results.length - filtered_results.length) {
          selected_index += 1;

          if (selected_index >= Math.min(DISPLAY_NUMS, filtered_results.length)) {
            selected_index = Math.min(DISPLAY_NUMS, filtered_results.length) - 1;
          }
        }

        showMentionBox(buildList(filtered_results));
      }

      if (e.which == 27) {
        hideMentionBox();
        holdCaretPosition(e);
      }
    } else {
      hideMentionBox();
    }
  });

  chat_text.on("keydown", function(e) {
    if ((e.which == 38 || e.which == 40 || e.which == 9 || e.which == 13) && isDisplayMentionBox) {
      is_navigated = true;
      holdCaretPosition(e);
    } else {
      current_index = 0;
      is_navigated = false;
    }

    if (e.which == 9 || e.which == 13) {
      if ($(".suggested-name").first().length) {
        if (is_navigated) {
          $(".suggested-name").eq(selected_index).click();
        } else {
          $(".suggested-name").first().click();
        }
        // dirty hack to prevent message to be sent
        if (cached_enter_action == "send") {
          ST.data.enter_action = "br";
        }
        e.preventDefault();
      } else {
        // there's no thing after @ symbol
        hideMentionBox();
      }
    }

    if (e.which == 27) {
      hideMentionBox();
      holdCaretPosition(e);
    }
  });

  chat_text.blur(() => hideMentionBox());
}

// http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    let args = arguments;
    return this.replace(/{(\d+)}/g, (match, number) =>
      typeof args[number] != "undefined" ?
      args[number] :
      match
    );
  };
}

$(document).ready(function() {
  setUpMention();
});
