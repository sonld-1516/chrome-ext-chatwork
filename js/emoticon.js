// Emoticon
var emoticons_regex = null;
var cw_plus_emoticons = {};
var emoticons = JSON.parse(localStorage['CWPLUS_EMOTICONS_DATA']);

var sorted_emoticons = emoticons.slice().sort((a, b) => {
  if (a.priority < b.priority) {
      return 1;
  } else if (a.priority > b.priority) {
      return -1;
  }
  return a.key < b.key ? -1 : (a.key > b.key) ? 1 : 0;
});

function htmlEncode(value) {
  return $("<div/>").text(value).html();
}

function generateRegexFromString(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function prepareEmoticonsRegex() {
  let patterns = [];
  let baseEmoticons = cw_plus_emoticons.baseEmoticons;
  for (let i in baseEmoticons) {
      if (baseEmoticons[i].external) {
          patterns.push(`(${generateRegexFromString(baseEmoticons[i].tag)})`);
      }
  }
  emoticons_regex = new RegExp(patterns.join("|"), "g");
}

function parseMoreEmo(token, emoticons_regex) {
  let ret = [];
  let pos = 0;
  while (true) {
      let match = emoticons_regex.exec(token.text);
      let end_pos = match ? match.index : token.text.length;
      let text = token.text.slice(pos, end_pos);
      if (text) {
          ret.push({ text });
      }
      if (!match) {
          break;
      }
      ret.push({ emoticon: { value: match[0], tag: match[0] } });
      pos = emoticons_regex.lastIndex;
  }
  return ret.length ? ret : [token];
}

function textNodesUnder(node) {
  let all = [];
  for (node = node.firstChild; node; node = node.nextSibling) {
      if (node.nodeType == 1 && node.tagName == 'CODE') {
          continue;
      }

      // if node is #text
      if (node.nodeType == 3) {
          all.push(node);
      } else {
          all = all.concat(textNodesUnder(node));
      }
  }
  return all;
}


function applyEmoticonsByModifyingDOM() {
  window.nodes = [];
  const single_chat_elm_class_name = '_message';
  let observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      let nodes = Array.from(mutation.addedNodes);

      for (let node of nodes) {
        if (!node.className) {
            continue;
        }
        if (node.className.indexOf(single_chat_elm_class_name) > -1) {
            let message_node = node.getElementsByTagName("PRE");
            message_node.length && applyEmoticons(message_node[0]);
        }
      };
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function applyEmoticons(node) {
  const all_text_nodes = textNodesUnder(node);
  for (const text_node of all_text_nodes) {
      const text_node_content = text_node.textContent;
      let replacement = applyReplacement(text_node_content);
      let txt = document.createElement('span');
      txt.innerHTML = replacement;
      text_node.parentNode.insertBefore(txt, text_node);
      text_node.parentNode.removeChild(text_node);
      // text_node.replaceWith(txt);
  }
}

function applyReplacement(text) {
  let newContentParts = [];
  const parsedNodecontent = parseMoreEmo({ text }, emoticons_regex);

  for (const part of parsedNodecontent) {
      if (part.text) {
        newContentParts.push(htmlEncode(part.text));
      } else if (part.emoticon) {
          let emo = cw_plus_emoticons.getEmoticonWithTag(part.emoticon.tag);

          if (emo) {
              newContentParts.push(
                  `<img src="${emo.src}" alt="${emo.tag}" data-cwtag="${emo.tag}" title="${emo.title}" class="ui_emoticon CWPlus_emoticon">`
              );
          } else {
              newContentParts.push(htmlEncode(part.emoticon.tag))
          }
      }
  }

  return newContentParts.join('');
}


function addExternalEmo() {
  addEmo(emoticons);
}

function getEmoNameFromTag(tag) {
  return `CW Plus-${htmlEncode(tag)}`;
}


function addEmo(emo) {
  cw_plus_emoticons.baseEmoticons = [];
  cw_plus_emoticons.tagHash = {};

  for (let index = 0; index < emo.length; index++) {
    let encoded_text = htmlEncode(emo[index].key);
    let name = getEmoNameFromTag(emo[index].key);
    let title = `${encoded_text} - ${emo[index].data_name} - CW Plus`;
    let src = emo[index].src;
    let one_emo = {
        name,
        title,
        src,
        tag: emo[index].key,
        external: true
    };
    cw_plus_emoticons.baseEmoticons.push(one_emo);
    cw_plus_emoticons.tagHash[emo[index].key] = one_emo;
    // window.emoticon_tag_hash_list[name] = one_emo;
    // emoticons.baseEmoticons.push(one_emo);
    // emoticons.tagHash[emo[index].key] = one_emo;
  }
  cw_plus_emoticons.getEmoticonWithTag = (tag) => cw_plus_emoticons.tagHash[tag];
  cw_plus_emoticons.getAllEmoticons = () => cw_plus_emoticons.baseEmoticons;
  cw_plus_emoticons.getEmoticonWithName = (name) => cw_plus_emoticons.baseEmoticons.find((e) => e.name === name)
  // tokenizer.setEmoticons(cw_plus_emoticons.getAllEmoticons().map((emo) => emo.tag));
}

function addStyle() {
  $("<style type=\"text/css\"> .emoticonTextEnable{font-weight: bold;};</style>").appendTo("head");
  $("<style type=\"text/css\"> .chatppErrorsText{font-weight: bold; color: red;};</style>").appendTo("head");
  $("<style type=\"text/css\"> .chatInput__element{opacity: 0.8;display: inline-block;padding: 0 5px;cursor: pointer;};</style>").appendTo("head");
  $("<style type=\"text/css\"> .messageBadge{vertical-align: middle !important;};</style>").appendTo("head");
  $("<style type=\"text/css\"> .timelineLinkTrim{vertical-align: middle !important;};</style>").appendTo("head");
  $("<style type=\"text/css\"> img.ui_emoticon {vertical-align: middle !important;}</style>").appendTo("head");
  $("<style type=\"text/css\"> img.ui_emoticon:not([src^='https://assets.chatwork']) {width: auto !important;height: auto !important; vertical-align: middle;}</style>").appendTo("head");
  $("<style type=\"text/css\"> div[data-cwtag]:not([data-cwtag='']) {width: auto !important;height: auto !important; vertical-align: middle;}</style>").appendTo("head");
}

function applyEmoticonsAccessDOM() {
  let timeLine = document.getElementById('_timeLine');
  let messages = timeLine?.getElementsByTagName('PRE');

  if (!messages) return false;

  for (let message of messages) {
    applyEmoticons(message);
  }
}

function addExternalEmoList(bind_event) {
  if ($("#externalEmoticonsButton").length > 0) {
    return;
  }

  let lastButton = $('#_file, #_groupCall').last();
 
  $("<li>", {
    id: "_externalEmoticonsButton",
    class:"_showDescription chatInput__element",
    css: {
      "display": "inline-block",
      "color": "rgb(42, 71, 127)"
    },
    attr: {
      "role": "button",
      "aria-label": "View CW Plus Emoticons List"
    }
  })
  .append(
    $("<span>", { id: "externalEmoticonsButton", text:"+", css: {
      "font-size": "27px"
    }})
  ).insertAfter(lastButton);

  if (!bind_event) {
    return;
  }

  $("#_wrapper").append($("<style>").append("::-webkit-scrollbar {width:10px;height:10px} .w3-emotion {display:inline-block;text-align:center;min-width:80px;height:30px;border:1px solid #ccc;cursor:pointer;margin:0px 2px;border-radius:5px;font-size:10px;background-color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}"));

  $("#_wrapper").append(
    $("<div>", {
      id: "_externalEmoticonList",
      class: "emoticonList emoticonTooltip toolTip tooltip--white mainContetTooltip",
      css: {
        "opacity": "1",
        "z-index": "2",
        "display": "none",
        "top": "265px",
        "left": "160px",
        "role": "tooltip",
        "width": "350px"
      }
  }).append(
      $("<div>", {
        class:"_cwTTTriangle toolTipTriangle toolTipTriangleWhiteBottom",
        css: {
          "left" :"129px"
        }
      }),
      $("<ul>", {
        id:"_emoticonGalleryTab",
        css: {
          "display": "flex",
          "flex-wrap": "wrap",
          "justify-content": "center",
          "max-width": "350px",
          "height": "450px",
          "overflow": "auto"
        }
      }),
      $("<div>", {
          id: "_externalEmotionDescription",
          class:"tooltipFooter"
      }), $("<div>", {
        id: "tabEmotionBig",
        css: {
          "display": "flex",
          "overflow": "auto",
          "overflow-y": "scroll",
          "height": "42px"
        }
      })
    )
  );

  let arrayDataName = [];

  sorted_emoticons.forEach((emo) => {
    if (arrayDataName.indexOf(emo.data_name) == -1) {
        arrayDataName.push(emo.data_name);
    }
  });

  let temp = [];
  let arrayData= [];

  let hint = 'Shift" to multi-select.';
  let u = $("#_externalEmoticonList").cwToolTip({
    open: () => $("#_externalEmotionDescription")
  });

  arrayDataName.forEach((item) => {
      temp = [];
      sorted_emoticons.map((emo) => {
        let encoded_text = htmlEncode(emo.key);
        let titleapp = `${encoded_text} - ${emo.data_name} - CW Plus`;
        let img_src = emo.src;
        if (emo.data_name == item) {
          let liElement = $("<li>", {
            css: {
              "padding": "5px",
              "cursor": "pointer",
              "border": "1px solid #fff",
              "border-radius": "3px",
              "transition": "border 0.2s linear 0s"
            }
          }).append($("<img>", {
            id: "example",
            css: {
              "width": "100%",
              "max-width": "50px"
            },
            attr: {
              "src": img_src,
              "title": titleapp,
              "alt": encoded_text
            }
          }));
          temp.push(liElement);

          return liElement.prop("outerHTML");
        }
    }).join("");
    arrayData.push(temp);
  });

  $("body").off("click", "#externalEmoticonsButton").on("click", "#externalEmoticonsButton", ((e) => {
      u.open($(e.currentTarget));
      $("#_emoticonGalleryTab li").remove();
      $("#_externalEmoticonList #_emoticonGalleryTab").append(arrayData[0]);
      $("#_externalEmoticonList #tabEmotionBig button").css("background-color", "white");
      $("#tabEmotion0").css("background-color", "#eaeae8");
  }));

  arrayDataName.forEach((item, index) => {
    if ($(`#tabEmotion${index}`).length > 0) return;

    $("#_externalEmoticonList #tabEmotionBig").append($("<button>", {
        id: `tabEmotion${index}`,
        class: "w3-bar-item w3-button w3-emotion"
    }).append(item));
  });

  arrayDataName.forEach((item, index) => {
    $(`#tabEmotion${index}`).on("click", (event) => {
        event.preventDefault();
        $("#_emoticonGalleryTab li").remove();
        $("#_externalEmoticonList #_emoticonGalleryTab").append(arrayData[index]);
    });
  });

  arrayDataName.forEach((item, index) => {
      $("#_externalEmoticonList #tabEmotionBig button").on("click", (event) => {
          $("#_externalEmoticonList #tabEmotionBig button").css("background-color", "white");
          $(event.currentTarget).css("background-color", "#eaeae8");
      });

      $(`#_externalEmoticonList #tabEmotionBig #tabEmotion${index}`).hover((event) => {
          $(event.currentTarget).attr("data-toggle", "tooltip");
          $(event.currentTarget).attr("data-placement", "top");
          $(event.currentTarget).attr("title", item);
      });
  });

  $("#_externalEmoticonList").on("mouseenter", "li", (e) => {
      let a = $(e.currentTarget).find("img");
      $("#_externalEmotionDescription").text(a.attr("title"))
  }).on("mouseleave", "li", () => $("#_externalEmotionDescription").text(hint)
  ).off("click", "li").on("click", "li", function() {
      $("_chatText").focus();
      CS.view.setChatText($(this).find("img").prop("alt"), !0);
      CW.view.key.shift || u.close();
  })
}

function setEmoticonTextLabel() {
  $("#_externalEmoticonsButton").attr("aria-label", "View CW+ Emoticons");
}

function prepareChatppEmoticons() {
  addExternalEmoList(true);
  setEmoticonTextLabel();
}

function setUpEmoticon(params) {
  addExternalEmo();
  prepareEmoticonsRegex();
  prepareChatppEmoticons();
  applyEmoticonsAccessDOM();
  applyEmoticonsByModifyingDOM();
  addStyle();
}

$(document).ready(function() {
  setUpEmoticon();
});
