import { getStorageItems } from './getStorageItems';

window.onload = function () {
  const optionsForm = document.querySelector('form');
  const errorDiv = document.querySelector('.error');
  optionsForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(optionsForm);
    for (const pair of formData.entries()) {
      console.log(`${pair[0]}, ${pair[1]}`);
    }

    chrome.storage.sync.set({
      otterInstanceUrl: formData.get('url'),
      supabaseApiSecret: formData.get('api-secret'),
      newBookmarkBehaviour: formData.get('new-bookmark-behaviour'),
    });
    chrome.action.setBadgeText({
      text: '',
    });
    errorDiv.setAttribute('hidden', true);
  });

  const urlField = document.querySelector('#url');
  chrome.storage.sync.get('otterInstanceUrl', function ({ otterInstanceUrl }) {
    urlField.value = otterInstanceUrl;
  });

  const apiSecretField = document.querySelector('#api-secret');
  chrome.storage.sync.get(
    'supabaseApiSecret',
    function ({ supabaseApiSecret }) {
      apiSecretField.value = supabaseApiSecret;
    }
  );

  getStorageItems().then(({ otterInstanceUrl, supabaseApiSecret }) => {
    console.log(`🚀 ~ supabaseApiSecret`, supabaseApiSecret);
    if (!otterInstanceUrl || !supabaseApiSecret) {
      errorDiv.removeAttribute('hidden');
    } else {
      errorDiv.setAttribute('hidden', true);
    }
  });
};
