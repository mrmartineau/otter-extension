'use strict';
import urlJoin from 'proper-url-join';
import { getStorageItems } from './getStorageItems';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === 'GREETINGS') {
//     const message = `Hi ${
//       sender.tab ? 'Con' : 'Pop'
//     }, my name is Bac. I am from Background. It's great to hear from you.`;

//     // Log message coming from the `request` parameter
//     console.log(request.payload.message);
//     // Send a response message
//     sendResponse({
//       message,
//     });
//   }
// });

let screenWidth;
let screenHeight;
chrome.system.display.getInfo((info) => {
  screenWidth = info[0].bounds.width;
  screenHeight = info[0].bounds.height;
});

const isOptionsSetup = async () => {
  try {
    const { otterInstanceUrl, supabaseApiSecret } = await getStorageItems();
    if (!otterInstanceUrl || !supabaseApiSecret) {
      throw new Error('Missing otterInstanceUrl or supabaseApiSecret');
    }
    return true;
  } catch (err) {
    return false;
  }
};

const openBookmarkletPage = async (url) => {
  const { otterInstanceUrl, newBookmarkWindowBehaviour } =
    await getStorageItems();
  // create new bookmark
  if (newBookmarkWindowBehaviour === 'tab') {
    chrome.tabs.create({
      url: urlJoin(otterInstanceUrl, 'new', 'bookmark', {
        query: {
          bookmarklet: 'true',
          url,
        },
      }),
    });
  } else {
    const posX = (screenWidth - 730) / 2;
    const posY = (screenHeight - 800) / 2;
    chrome.windows.create({
      url: urlJoin(otterInstanceUrl, 'new', 'bookmark', {
        query: {
          bookmarklet: 'true',
          url,
        },
      }),
      height: 800,
      width: 500,
      left: posX,
      top: posY,
      type: 'panel',
    });
  }
};

const onContextClick = async (info, tab) => {
  try {
    if (info.linkUrl) {
      openBookmarkletPage(info.linkUrl);
    } else {
      openBookmarkletPage(tab.url);
    }
  } catch (err) {
    console.log(
      `🚀 ~ onContextClick ~ save ~ onCommand.addListener ~ err`,
      err
    );
  }
};

// const quickSave = async (url) => {
//   try {
//     const { otterInstanceUrl } = await getStorageItems();
//     const response = await otterFetch(
//       urlJoin(otterInstanceUrl, 'api', 'bookmark', 'new', {
//         query: {
//           url,
//         },
//       })
//     );
//     const { data } = response;
//     console.log(`🚀 ~ quickSave ~ data`, data);
//     return data;
//   } catch (err) {
//     console.log(`🚀 ~ quickSave ~ err`, err);
//   }
// };

const checkUrl = async (url) => {
  try {
    const { otterInstanceUrl } = await getStorageItems();
    const response = await otterFetch(
      urlJoin(otterInstanceUrl, 'api', 'search', {
        query: {
          searchTerm: url,
        },
      })
    );

    if (response.data.length) {
      return {
        data: response.data[0],
        isSaved: response.data[0].url === url,
      };
    } else {
      return {
        data: null,
        isSaved: false,
      };
    }
  } catch (err) {
    console.log(`🚀 ~ checkUrl ~ err`, err);
  }
};

const otterFetch = async (url) => {
  const { supabaseApiSecret } = await getStorageItems();
  return fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${supabaseApiSecret}`,
    },
  }).then((response) => {
    if (response.ok) {
      return response.json();
    } else {
      var error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  });
};

chrome.action.onClicked.addListener(async (tab) => {
  if ((await isOptionsSetup()) === false) {
    console.info('options not setup');
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    return;
  }

  try {
    const { otterInstanceUrl } = await getStorageItems();
    const response = await checkUrl(tab.url);
    const { isSaved, data } = response;
    if (isSaved) {
      // bookmark already exists, visit its page on Otter
      chrome.tabs.create({
        url: urlJoin(otterInstanceUrl, 'bookmark', data.id),
      });
    } else {
      openBookmarkletPage(tab.url);
    }
  } catch (err) {
    console.log(`🚀 ~ chrome.action.onClicked.addListener ~ err`, err);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  onContextClick(info, tab);
});

chrome.commands.onCommand.addListener((command, tab) => {
  console.log(`onCommand`, { command, tab });
  // if (command === 'quick-save') {
  //   try {
  //     quickSave(tab.url);
  //   } catch (err) {
  //     console.log(`🚀 ~ chrome.commands.onCommand.addListener ~ err`, err);
  //   }
  // }
});

/**
 * FIXME or change
 * Perhaps use [chrome.tabs.onActivated](https://developer.chrome.com/docs/extensions/reference/tabs/#event-onActivated)
 * or render something on the page instead. would need content script for that.
 * still need a reliable to to check the active tab has already been saved in Otter and
 * for the check to be run every time a new tab is opened/updated
 */
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if ((await isOptionsSetup()) === false) {
    return;
  }

  // not sure if this works so removing for now
  /* try {
    const response = await checkUrl(details.url);
    console.log(
      `🚀 ~ chrome.webNavigation.onCompleted.addListener ~ response`,
      response
    );
    const { isSaved, data } = response;
    console.log(`🚀 ~ chrome.webNavigation.onCompleted.addListener ~ data`, {
      isSaved,
      data,
    });

    if (isSaved) {
      chrome.action.setBadgeText({
        text: '🟢',
      });
    }
  } catch (err) {
    console.log(`🚀 ~ chrome.webNavigation.onCompleted.addListener ~ err`, err);
  } */
});

/**
 * Context menus
 */
// chrome.contextMenus.create({
//   title: '🦦 Quick save to Otter',
//   contexts: ['page', 'link'],
//   id: 'otter-context-quick-save',
// });

chrome.contextMenus.create({
  title: 'Save to Otter',
  contexts: ['page', 'link'],
  id: 'otter-context-save',
});
