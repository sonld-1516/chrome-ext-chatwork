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
  const message_selectors = ['_message', '_chatMessage', 'chatMessage', 'timeline_message'];

  // Disconnect existing observer if any
  if (window.emoticonMutationObserver) {
    window.emoticonMutationObserver.disconnect();
  }

  window.emoticonMutationObserver = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type !== 'childList') return;

      let nodes = Array.from(mutation.addedNodes);

      for (let node of nodes) {
        // Skip non-element nodes
        if (node.nodeType !== 1) continue;

        const nodeClassName = node.className || '';

        // Check if node itself is a message
        const isMessageNode = message_selectors.some(selector =>
          nodeClassName.indexOf(selector) > -1
        );

        if (isMessageNode) {
          let message_node = node.getElementsByTagName("PRE");
          if (message_node.length > 0) {
            applyEmoticons(message_node[0]);
          }
        } else {
          // Also check for message nodes within this node
          message_selectors.forEach(selector => {
            const messageNodes = node.querySelectorAll ? node.querySelectorAll(`.${selector}`) : [];
            messageNodes.forEach(msgNode => {
              let preElements = msgNode.getElementsByTagName("PRE");
              if (preElements.length > 0) {
                applyEmoticons(preElements[0]);
              }
            });
          });
        }
      }
    });
  });

  // Observe the timeline container specifically, with fallback to document
  const observeTarget = document.getElementById('_timeLine') || document.documentElement;

  window.emoticonMutationObserver.observe(observeTarget, {
    childList: true,
    subtree: true,
    attributes: false, // Don't need attribute changes
    characterData: false // Don't need text changes
  });
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
    // Only apply if not already processed
    if (!message.hasAttribute('data-emoticons-applied')) {
      applyEmoticons(message);
      message.setAttribute('data-emoticons-applied', 'true');
    }
  }
}

function addExternalEmoList(bind_event) {
  // Function to create the button
  function createEmoticonButton() {
    // Remove existing button if any
    $("#_externalEmoticonsButton").remove();

    let lastButton = $('div._showDescription:has(#_file), div._showDescription:has(#_groupCall)').last();

    // Check if parent container exists
    if (lastButton.length === 0) {
      setTimeout(createEmoticonButton, 1000);
      return;
    }

    $("<li>", {
      id: "_externalEmoticonsButton",
      class:"_showDescription chatInput__element",
      css: {
        "display": "inline-block !important",
        "color": "rgb(42, 71, 127)",
        "visibility": "visible !important"
      },
      attr: {
        "role": "button",
        "aria-label": "View CW Plus Emoticons List"
      }
    })
    .append(
      $("<span>", { id: "externalEmoticonsButton", html:"😊", css: { // 🙂😊
        "font-size": "20px",
        "font-weight": "normal",
        "display": "inline-block",
        "line-height": "1"
      }})
    ).insertAfter(lastButton);
  }

  // Create button initially
  createEmoticonButton();

  // Monitor for DOM changes that might remove our button
  if (!window.emoticonButtonObserver) {
    window.emoticonButtonObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        // Check if our button still exists
        if ($("#externalEmoticonsButton").length === 0) {
          setTimeout(createEmoticonButton, 500);
        }
      });
    });

    // Observe the document for changes
    window.emoticonButtonObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (!bind_event) {
    return;
  }

  // Add styles only once
  if ($("#cw-plus-emoticon-styles").length === 0) {
    $("#_wrapper").append($("<style>", {
      id: "cw-plus-emoticon-styles"
    }).append(`
      ::-webkit-scrollbar {width:10px;height:10px}
      .w3-emotion {display:inline-block;text-align:center;min-width:80px;height:30px;border:1px solid #ccc;cursor:pointer;margin:0px 2px;border-radius:5px;font-size:10px;background-color:white;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #externalEmoticonsButton {
        display: inline-block !important;
        visibility: visible !important;
        opacity: 1 !important;
        cursor: pointer;
      }
      #_externalEmoticonList {
        position: fixed !important;
        z-index: 99999 !important;
        background: white;
        border: 1px solid #ccc;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        pointer-events: auto !important;
      }
      #_externalEmoticonList li {
        pointer-events: auto !important;
        cursor: pointer !important;
        z-index: 100000 !important;
        position: relative !important;
      }
      #_externalEmoticonList li:hover {
        border-color: #007acc !important;
        background-color: #f0f8ff !important;
        transform: scale(1.05) !important;
      }
      #_externalEmoticonList li img {
        pointer-events: auto !important;
        cursor: pointer !important;
        user-select: none !important;
      }
      #_emoticonGalleryTab {
        pointer-events: auto !important;
      }
      .tooltipFooter {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        padding: 10px !important;
        text-align: center !important;
        border-top: 1px solid #eee !important;
        background-color: #f9f9f9 !important;
        font-size: 12px !important;
        color: #666 !important;
        min-height: 20px !important;
      }
      ._cwTTTriangle.toolTipTriangleWhiteTop {
        position: absolute;
        bottom: -10px;
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid white;
        z-index: 10000;
      }
      ._cwTTTriangle.toolTipTriangleWhiteBottom {
        position: absolute;
        top: -10px;
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid white;
        z-index: 10000;
      }
    `));
  }  // Create emoticon list container only once
  if ($("#_externalEmoticonList").length === 0) {
    createTooltipContainer();
  }

  // Cache processed emoticon data
  if (!window.cwPlusEmoticonCache) {
    window.cwPlusEmoticonCache = processEmoticonData();
  }

  const { arrayDataName, arrayData } = window.cwPlusEmoticonCache;

  let hint = 'Shift" to multi-select.';

  // Simple tooltip implementation to replace cwToolTip
  let u = {
    open: function(element) {
      // Ensure tooltip container exists before using it
      if ($("#_externalEmoticonList").length === 0) {
        createTooltipContainer();
      }

      // Ensure footer exists
      ensureFooterExists();

      const tooltip = $("#_externalEmoticonList");

      if (tooltip.length === 0) {
        return;
      }

      tooltip.show();

      // Position tooltip above the clicked element
      const offset = element.offset();
      if (offset) {
        const tooltipHeight = tooltip.outerHeight() || 450; // Default height if not yet calculated
        const tooltipWidth = tooltip.outerWidth() || 350;
        const windowHeight = $(window).height();
        const windowWidth = $(window).width();
        const scrollTop = $(window).scrollTop();        // Calculate position
        let top = offset.top - tooltipHeight - 10; // Position above with 10px gap
        let left = offset.left;

        // Calculate triangle position relative to button center
        const buttonWidth = element.outerWidth();
        const triangleLeft = (tooltipWidth / 2) - 10; // Center triangle in tooltip (triangle width is 20px)

        // Adjust if tooltip goes above viewport
        if (top < scrollTop) {
          top = offset.top + element.outerHeight() + 10; // Show below instead
          // Update triangle class for bottom position
          tooltip.find('._cwTTTriangle').removeClass('toolTipTriangleWhiteTop').addClass('toolTipTriangleWhiteBottom');
          tooltip.find('._cwTTTriangle').css('left', triangleLeft + 'px');
        } else {
          // Ensure triangle is for top position
          tooltip.find('._cwTTTriangle').removeClass('toolTipTriangleWhiteBottom').addClass('toolTipTriangleWhiteTop');
          tooltip.find('._cwTTriangle').css('left', triangleLeft + 'px');
        }

        // Center tooltip relative to button
        left = offset.left + (buttonWidth / 2) - (tooltipWidth / 2);

        // Adjust if tooltip goes outside right edge
        if (left + tooltipWidth > windowWidth) {
          const oldLeft = left;
          left = windowWidth - tooltipWidth - 20;
          // Adjust triangle position when tooltip is repositioned
          const triangleOffset = triangleLeft + (oldLeft - left);
          tooltip.find('._cwTTTriangle').css('left', Math.max(10, Math.min(triangleOffset, tooltipWidth - 30)) + 'px');
        }

        // Adjust if tooltip goes outside left edge
        if (left < 10) {
          const oldLeft = left;
          left = 10;
          // Adjust triangle position when tooltip is repositioned
          const triangleOffset = triangleLeft + (oldLeft - left);
          tooltip.find('._cwTTTriangle').css('left', Math.max(10, Math.min(triangleOffset, tooltipWidth - 30)) + 'px');
        }

        tooltip.css({
          position: 'fixed',
          top: top - scrollTop,
          left: left,
          'z-index': 99999,
          'pointer-events': 'auto'
        });

        // Final adjustment: ensure triangle points to button center if possible
        const buttonCenterX = offset.left + (buttonWidth / 2);
        const tooltipLeftX = left;
        const trianglePointX = buttonCenterX - tooltipLeftX;

        // Only adjust if triangle would be within reasonable bounds
        if (trianglePointX >= 20 && trianglePointX <= tooltipWidth - 20) {
          tooltip.find('._cwTTTriangle').css('left', (trianglePointX - 10) + 'px');
        }
      }

      // Set initial description and ensure footer exists
      ensureFooterExists();
      if ($("#_externalEmotionDescription").length > 0) {
        $("#_externalEmotionDescription").text(hint);
      }
    },
    close: function() {
      $("#_externalEmoticonList").hide();
    }
  };

  // Bind event handlers every time (remove the once-only restriction)
  bindEmoticonEvents(arrayDataName, arrayData, u, hint);

  // Add click outside handler to close tooltip
  $(document).off('click.cwPlusTooltip').on('click.cwPlusTooltip', function(e) {
    if (!$(e.target).closest('#_externalEmoticonList, #externalEmoticonsButton').length) {
      u.close();
    }
  });
}

// Function to create tooltip container
function createTooltipContainer() {
  // Only create if it doesn't exist to prevent unnecessary DOM recreation
  if ($("#_externalEmoticonList").length > 0) {
    return;
  }
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
        class:"_cwTTTriangle toolTipTriangle toolTipTriangleWhiteTop",
        css: {
          "left": "165px", // Center position (350px / 2 - 10px = 165px)
          "bottom": "-10px",
          "top": "auto"
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
          class:"tooltipFooter",
          css: {
            "padding": "10px",
            "text-align": "center",
            "border-top": "1px solid #eee",
            "background-color": "#f9f9f9",
            "font-size": "12px",
            "color": "#666"
          }
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

  // Ensure footer is properly initialized
  ensureFooterExists();
}

// Function to ensure footer exists and is properly set up
function ensureFooterExists() {
  if ($("#_externalEmotionDescription").length === 0) {
    $("#_externalEmoticonList").append($("<div>", {
      id: "_externalEmotionDescription",
      class:"tooltipFooter",
      css: {
        "padding": "10px",
        "text-align": "center",
        "border-top": "1px solid #eee",
        "background-color": "#f9f9f9",
        "font-size": "12px",
        "color": "#666"
      }
    }));
  }
}

function bindEmoticonEvents(arrayDataName, arrayData, u, hint) {
  // Remove existing events first to prevent duplicates
  $("body").off("click", "#externalEmoticonsButton");

  // Use event delegation to ensure events work even after DOM changes
  $("body").on("click", "#externalEmoticonsButton", function(e) {
      e.preventDefault();
      e.stopPropagation();

      // Ensure tooltip container exists before using it
      if ($("#_externalEmoticonList").length === 0) {
        createTooltipContainer();
      }

      u.open($(e.currentTarget));

      // Clear existing emoticons and add new ones
      $("#_emoticonGalleryTab li").remove();

      if (arrayData && arrayData[0]) {
        // Use jQuery each for better compatibility
        $.each(arrayData[0], function(index, item) {
          $("#_externalEmoticonList #_emoticonGalleryTab").append(item);
        });
      }

      // Set tab styling
      $("#_externalEmoticonList #tabEmotionBig button").css("background-color", "white");
      $("#tabEmotion0").css("background-color", "#eaeae8");

      // Ensure events are bound after adding items
      setTimeout(() => {
        bindEmoticonItemEvents(hint, u);
      }, 100);
  });

  // Ensure tab buttons exist
  arrayDataName.forEach((item, index) => {
    if ($(`#tabEmotion${index}`).length > 0) return;

    $("#_externalEmoticonList #tabEmotionBig").append($("<button>", {
        id: `tabEmotion${index}`,
        class: "w3-bar-item w3-button w3-emotion"
    }).append(item));
  });

  // Use event delegation for tab buttons
  $("#_externalEmoticonList").off("click", "#tabEmotionBig button").on("click", "#tabEmotionBig button", function(e) {
    e.preventDefault();
    e.stopPropagation();

    // Find which tab was clicked
    const buttonId = $(this).attr('id');
    const tabIndex = buttonId.replace('tabEmotion', '');

    if (arrayData[tabIndex]) {
      $("#_emoticonGalleryTab li").remove();

      // Use jQuery each for better compatibility
      $.each(arrayData[tabIndex], function(index, item) {
        $("#_externalEmoticonList #_emoticonGalleryTab").append(item);
      });

      // Update tab styling
      $("#_externalEmoticonList #tabEmotionBig button").css("background-color", "white");
      $(this).css("background-color", "#eaeae8");

      // Rebind events after adding new items
      setTimeout(() => {
        bindEmoticonItemEvents(hint, u);
      }, 100);
    }
  });

  // Remove the old individual event handlers
  arrayDataName.forEach((item, index) => {
    $(`#tabEmotion${index}`).off("click");
  });

  // Initial binding for emoticon items
  bindEmoticonItemEvents(hint, u);
}

// Separate function to bind emoticon item events
function bindEmoticonItemEvents(hint, u) {
  // Remove any existing bindings first
  $("#_externalEmoticonList").off("mouseenter", "li");
  $("#_externalEmoticonList").off("mouseleave", "li");
  $("#_externalEmoticonList").off("click", "li");

  $("#_externalEmoticonList").on("mouseenter", "li", function(e) {
      let a = $(e.currentTarget).find("img");
      ensureFooterExists(); // Ensure footer exists before trying to update it
      if ($("#_externalEmotionDescription").length > 0) {
        $("#_externalEmotionDescription").text(a.attr("title"));
      }
  }).on("mouseleave", "li", function() {
      ensureFooterExists(); // Ensure footer exists before trying to update it
      if ($("#_externalEmotionDescription").length > 0) {
        $("#_externalEmotionDescription").text(hint);
      }
  }).on("click", "li", function(e) {
      e.preventDefault();
      e.stopPropagation();

      let img = $(this).find("img");
      let emoticon = img.prop("alt");

      // Focus and insert emoticon
      $("#_chatText").focus();

      // Use a more reliable method to insert emoticon
      if (typeof CS !== 'undefined' && CS.view && CS.view.setChatText) {
        CS.view.setChatText(emoticon, !0);
      } else {
        // Fallback method
        let chatText = $("#_chatText");
        if (chatText.length > 0) {
          let currentText = chatText.val();
          chatText.val(currentText + emoticon);
          chatText.trigger('input');
        }
      }

      // Close popup if not holding shift
      if (!CW.view.key.shift) {
        u.close();
      }
  });
}

// Helper function to process emoticon data once and cache it
function processEmoticonData() {
  let arrayDataName = [];

  // Use Set for better performance with unique values
  const uniqueDataNames = new Set();
  sorted_emoticons.forEach((emo) => {
    uniqueDataNames.add(emo.data_name);
  });
  arrayDataName = Array.from(uniqueDataNames);

  let arrayData = [];

  arrayDataName.forEach((item) => {
    let temp = [];
    sorted_emoticons.forEach((emo) => {
      if (emo.data_name === item) {
        let encoded_text = htmlEncode(emo.key);
        let titleapp = `${encoded_text} - ${emo.data_name} - CW Plus`;
        let img_src = emo.src;

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
      }
    });
    arrayData.push(temp);
  });

  return { arrayDataName, arrayData };
}

function setEmoticonTextLabel() {
  $("#_externalEmoticonsButton").attr("aria-label", "View CW+ Emoticons");
}

// Cache flag to prevent re-initialization
var chatppEmoticonsInitialized = chatppEmoticonsInitialized || false;

function prepareChatppEmoticons() {
  // Only initialize once
  if (chatppEmoticonsInitialized) {
    return;
  }

  addExternalEmoList(true);
  setEmoticonTextLabel();
  chatppEmoticonsInitialized = true;
}

function setUpEmoticon(params) {
  addExternalEmo();
  prepareEmoticonsRegex();
  prepareChatppEmoticons();
  applyEmoticonsAccessDOM();
  applyEmoticonsByModifyingDOM();
  addStyle();

  // Monitor chat submissions to catch user's own messages
  monitorChatSubmission();

  // Set up periodic check to ensure MutationObserver is active
  if (window.cwPlusObserverCheck) {
    clearInterval(window.cwPlusObserverCheck);
  }

  window.cwPlusObserverCheck = setInterval(() => {
    ensureMutationObserverActive();
  }, 10000); // Check every 10 seconds

  // Also check when window regains focus
  window.addEventListener('focus', () => {
    setTimeout(() => {
      ensureMutationObserverActive();
      // Force apply to any unprocessed messages
      applyEmoticonsAccessDOM();
    }, 1000);
  });
}

$(document).ready(function() {
  setUpEmoticon();
});

// Function to reset cache when emoticons data changes
function resetEmoticonCache() {
  window.cwPlusEmoticonCache = null;
  window.cwPlusEventsBound = false;
  chatppEmoticonsInitialized = false;

  // Clean up intervals and observers
  if (window.cwPlusObserverCheck) {
    clearInterval(window.cwPlusObserverCheck);
    window.cwPlusObserverCheck = null;
  }

  if (window.emoticonMutationObserver) {
    window.emoticonMutationObserver.disconnect();
    window.emoticonMutationObserver = null;
  }

  // Clear all emoticon processing markers
  document.querySelectorAll('[data-emoticons-applied]').forEach(el => {
    el.removeAttribute('data-emoticons-applied');
  });
}

// Function to ensure MutationObserver is always working
function ensureMutationObserverActive() {
  // Check if observer is still connected
  if (!window.emoticonMutationObserver) {
    applyEmoticonsByModifyingDOM();
    return;
  }

  // Test if observer is working by checking if it's connected
  try {
    const timeline = document.getElementById('_timeLine');
    if (timeline && !document.contains(timeline)) {
      applyEmoticonsByModifyingDOM();
    }
  } catch (error) {
    applyEmoticonsByModifyingDOM();
  }
}

// Monitor for chat text submissions to catch user's own messages
function monitorChatSubmission() {
  const chatText = document.getElementById('_chatText');
  const sendButton = document.querySelector('[data-tips="Send message"]');

  if (chatText) {
    // Monitor for Enter key press
    chatText.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        setTimeout(() => {
          // Force apply emoticons to any new messages
          const timeline = document.getElementById('_timeLine');
          if (timeline) {
            const messages = timeline.getElementsByTagName('PRE');
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && !lastMessage.hasAttribute('data-emoticons-applied')) {
              applyEmoticons(lastMessage);
              lastMessage.setAttribute('data-emoticons-applied', 'true');
            }
          }
        }, 500); // Wait for message to be added to DOM
      }
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', function() {
      setTimeout(() => {
        const timeline = document.getElementById('_timeLine');
        if (timeline) {
          const messages = timeline.getElementsByTagName('PRE');
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && !lastMessage.hasAttribute('data-emoticons-applied')) {
            applyEmoticons(lastMessage);
            lastMessage.setAttribute('data-emoticons-applied', 'true');
          }
        }
      }, 500);
    });
  }
}
