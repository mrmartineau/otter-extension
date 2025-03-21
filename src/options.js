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
      newBookmarkWindowBehaviour: formData.get('new-bookmark-window-behaviour'),
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

  getStorageItems().then(({ otterInstanceUrl }) => {
    if (!otterInstanceUrl) {
      errorDiv.removeAttribute('hidden');
    } else {
      errorDiv.setAttribute('hidden', true);
    }
  });
};
