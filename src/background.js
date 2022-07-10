'use strict';
import urlJoin from 'proper-url-join';
import { getStorageItems } from './getStorageItems';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GREETINGS') {
    const message = `Hi ${
      sender.tab ? 'Con' : 'Pop'
    }, my name is Bac. I am from Background. It's great to hear from you.`;

    // Log message coming from the `request` parameter
    console.log(request.payload.message);
    // Send a response message
    sendResponse({
      message,
    });
  }
});
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

chrome.action.onClicked.addListener(async (tab) => {
  if ((await isOptionsSetup()) === false) {
    console.info('options not setup');
    chrome.tabs.create({
      url: `chrome-extension://${chrome.runtime.id}/options.html`,
    });
    return;
  }

  try {
    const { otterInstanceUrl, newBookmarkBehaviour } = await getStorageItems();
    const response = await checkUrl(tab.url);
    const { isSaved, data } = response;
    if (isSaved) {
      // bookmark already exists, visit its page on Otter
      chrome.tabs.create({
        url: urlJoin(otterInstanceUrl, 'bookmark', data.key),
      });
    } else {
      // create new bookmark
      if (newBookmarkBehaviour === 'tab') {
        chrome.tabs.create({
          url: urlJoin(otterInstanceUrl, 'new', 'bookmark', {
            query: {
              bookmarklet: 'true',
              url: tab.url,
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
              url: tab.url,
            },
          }),
          height: 800,
          width: 500,
          left: posX,
          top: posY,
          type: 'panel',
        });
      }
    }
  } catch (err) {
    console.log(`🚀 ~ chrome.action.onClicked.addListener ~ err`, err);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if ((await isOptionsSetup()) === false) {
    return;
  }

  try {
    const response = await checkUrl(details.url);
    console.log(
      `🚀 ~ chrome.webNavigation.onCompleted.addListener ~ response`,
      response
    );
    const { isSaved } = response;
    if (isSaved) {
      chrome.action.setBadgeText({
        text: '🟢',
      });
    }
  } catch (err) {
    console.log(`🚀 ~ chrome.webNavigation.onCompleted.addListener ~ err`, err);
  }
});

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
