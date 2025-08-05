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
  return $("#infoTag").length > 0 && $("#titleTag").length > 0 && $("#codeTag").length > 0;
}

function createTagButtons() {
  console.log('Creating tag buttons...');

  var chat_send_tool = $("#_chatSendArea ul").first();

  if (chat_send_tool.length === 0) {
    console.log('Chat send area not found, retrying...');
    setTimeout(createTagButtons, 1000);
    return;
  }

  // Check if buttons already exist to prevent duplicates
  if (isTagAdded()) {
    console.log('Tag buttons already exist, skipping creation');
    return;
  }

  // Remove any existing buttons with these IDs specifically
  $("#infoTag, #titleTag, #codeTag").remove();

  // Add the buttons
  chat_send_tool.append($("<button>", title_tag)); // Add title button tag
  chat_send_tool.append($("<button>", info_tag)); // Add info button tag
  chat_send_tool.append($("<button>", code_tag)); // Add code button tag

  console.log('Tag buttons created successfully');
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
          console.log('Tag buttons disappeared, recreating...');
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
    console.log('Info tag clicked');
    setSuggestedChatTag("info");
    setTimeout(() => $(this).removeClass('processing'), 500); // Remove processing flag after 500ms
  });

  $("body").on("click.cwPlusTagButtons", "#titleTag", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if ($(this).hasClass('processing')) return; // Prevent duplicate clicks
    $(this).addClass('processing');
    console.log('Title tag clicked');
    setSuggestedChatTag("title");
    setTimeout(() => $(this).removeClass('processing'), 500); // Remove processing flag after 500ms
  });

  $("body").on("click.cwPlusTagButtons", "#codeTag", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if ($(this).hasClass('processing')) return; // Prevent duplicate clicks
    $(this).addClass('processing');
    console.log('Code tag clicked');
    setSuggestedChatTag("code");
    setTimeout(() => $(this).removeClass('processing'), 500); // Remove processing flag after 500ms
  });

  function setSuggestedChatTag(type) {
    // Prevent rapid successive calls
    if (window.tagInsertionInProgress) {
      console.log('Tag insertion already in progress, skipping...');
      return;
    }

    window.tagInsertionInProgress = true;

    try {
      var chat_text = $("#_chatText");
      if (chat_text.length === 0) {
        console.log('Chat text area not found');
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
      console.log(`Successfully inserted ${type} tag`);
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
    console.log('Tag button monitoring already active');
    return;
  }

  console.log('Starting tag button monitoring...');
  window.tagButtonInterval = setInterval(function() {
    // Only check if buttons are missing, don't recreate unnecessarily
    if (!isTagAdded()) {
      console.log('Tag buttons missing during interval check, recreating...');
      createTagButtons();
    }
  }, 10000); // Check every 10 seconds (less frequent than before)
}

// Function to reset tag button monitoring
function resetTagButtons() {
  console.log('Resetting tag button monitoring...');

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

  console.log('Tag button monitoring reset complete');
}
