// SVG icon generators
function createTitleIconSVG(color = 'rgb(42, 71, 127)', size = 19) {
  return `
    <svg class="cwplus-title-icon" viewBox="0 0 24 24" style="width: ${size}px; height: ${size}px; display: inline-block; vertical-align: middle; cursor: pointer; margin-bottom: 3px;">
      <line x1="5" y1="8" x2="19" y2="8" stroke="${color}" stroke-width="2.3" stroke-linecap="round"/>
      <line x1="5" y1="12" x2="15" y2="12" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="16" x2="17" y2="16" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `.trim();
}

function createInfoIconSVG(color = 'rgb(42, 71, 127)', size = 19) {
  return `
    <svg class="cwplus-info-icon" viewBox="0 0 24 24" style="width: ${size}px; height: ${size}px; display: inline-block; vertical-align: middle; cursor: pointer; margin-bottom: 3px;">
      <circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2"/>
      <circle cx="12" cy="8" r="1.5" fill="${color}"/>
      <line x1="12" y1="11" x2="12" y2="17" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `.trim();
}

function createCodeIconSVG(color = 'rgb(42, 71, 127)', size = 23) {
  return `
    <svg class="cwplus-code-icon" viewBox="0 0 24 24" style="width: ${size}px; height: ${size}px; display: inline-block; vertical-align: middle; cursor: pointer;">
      <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="${color}" stroke-width="1.8"/>
      <polyline points="8,10 10,12 8,14" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="12" y1="14" x2="16" y2="14" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `.trim();
}

var info_tag = {
  id: "infoTag",
  class: "sc-gmgFlS CWPlus__tag-button _showDescription",
  attr: {
    "role": "button",
    "aria-label": "Add info tag"
  },
  html: createInfoIconSVG()
};

var code_tag = {
  id: "codeTag",
  class: "sc-gmgFlS CWPlus__tag-button _showDescription",
  attr: {
    "role": "button",
    "aria-label": "Add code tag"
  },
  css: {
    "margin-bottom": "3px"
  },
  html: createCodeIconSVG()
};

var title_tag = {
  id: "titleTag",
  class: "sc-gmgFlS CWPlus__tag-button _showDescription",
  attr: {
    "role": "button",
    "aria-label": "Add title tag"
  },
  html: createTitleIconSVG()
}

function isTagAdded() {
  return $("#infoTag").length > 0 && $("#titleTag").length > 0 && $("#codeTag").length > 0;
}

function createTagButtons() {

  var chat_send_tool = $("#_chatSendArea ul").first();

  if (chat_send_tool.length === 0) {
    setTimeout(createTagButtons, 1000);
    return;
  }

  // Check if buttons already exist to prevent duplicates
  if (isTagAdded()) {
    return;
  }

  // Remove any existing buttons with these IDs specifically
  $("#infoTag, #titleTag, #codeTag").remove();

  // Add the buttons
  chat_send_tool.append($("<button>", title_tag)); // Add title button tag
  chat_send_tool.append($("<button>", info_tag)); // Add info button tag
  chat_send_tool.append($("<button>", code_tag)); // Add code button tag

}

$(document).ready(function() {
  // Initialize flags
  window.tagInsertionInProgress = false;

  // Create buttons initially
  createTagButtons();

  // Monitor for DOM changes that might remove our buttons
  if (!window.tagButtonObserver) {
    window.tagButtonObserver = new MutationObserver(function(mutations) {
      // Use debouncing to prevent excessive calls
      clearTimeout(window.tagButtonCheckTimeout);
      window.tagButtonCheckTimeout = setTimeout(function() {
        // Only recreate if buttons are actually missing
        if (!isTagAdded()) {
          createTagButtons();
        }
      }, 1000); // Wait 1 second before checking
    });

    // Observe the document for changes
    window.tagButtonObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  // Use event delegation to ensure events work even after DOM changes
  // Remove existing handlers first to prevent duplicates
  $("body").off("click.cwPlusTagButtons", "#infoTag, #titleTag, #codeTag");

  // Bind events with namespace to prevent conflicts
  $("body").on("click.cwPlusTagButtons", "#infoTag", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if ($(this).hasClass('processing')) return; // Prevent duplicate clicks
    $(this).addClass('processing');
    setSuggestedChatTag("info");
    setTimeout(() => $(this).removeClass('processing'), 500); // Remove processing flag after 500ms
  });

  $("body").on("click.cwPlusTagButtons", "#titleTag", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if ($(this).hasClass('processing')) return; // Prevent duplicate clicks
    $(this).addClass('processing');
    setSuggestedChatTag("title");
    setTimeout(() => $(this).removeClass('processing'), 500); // Remove processing flag after 500ms
  });

  $("body").on("click.cwPlusTagButtons", "#codeTag", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if ($(this).hasClass('processing')) return; // Prevent duplicate clicks
    $(this).addClass('processing');
    setSuggestedChatTag("code");
    setTimeout(() => $(this).removeClass('processing'), 500); // Remove processing flag after 500ms
  });

  function setSuggestedChatTag(type) {
    // Prevent rapid successive calls
    if (window.tagInsertionInProgress) {
      return;
    }

    window.tagInsertionInProgress = true;

    try {
      var chat_text = $("#_chatText");
      if (chat_text.length === 0) {
        return;
      }

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
      } else {
        chat_text[0].setSelectionRange(selectionStart.length, selectionEnd);
      }

      chat_text.focus();
    } catch (error) {
      console.error('Error inserting tag:', error);
    } finally {
      // Reset the flag after a short delay
      setTimeout(() => {
        window.tagInsertionInProgress = false;
      }, 200);
    }
  };

  // Start monitoring to ensure buttons stay visible
  ensureTagButtons();
});

// Function to ensure tag buttons are always visible
function ensureTagButtons() {
  // Prevent multiple intervals
  if (window.tagButtonInterval) {
    return;
  }

  window.tagButtonInterval = setInterval(function() {
    // Only check if buttons are missing, don't recreate unnecessarily
    if (!isTagAdded()) {
      createTagButtons();
    }
  }, 10000); // Check every 10 seconds (less frequent than before)
}

// Function to reset tag button monitoring
function resetTagButtons() {

  if (window.tagButtonInterval) {
    clearInterval(window.tagButtonInterval);
    window.tagButtonInterval = null;
  }

  if (window.tagButtonCheckTimeout) {
    clearTimeout(window.tagButtonCheckTimeout);
    window.tagButtonCheckTimeout = null;
  }

  if (window.tagButtonObserver) {
    window.tagButtonObserver.disconnect();
    window.tagButtonObserver = null;
  }

  // Reset processing flags
  window.tagInsertionInProgress = false;
  $("#infoTag, #titleTag, #codeTag").removeClass('processing');

  // Remove event handlers
  $("body").off("click.cwPlusTagButtons", "#infoTag, #titleTag, #codeTag");

}
