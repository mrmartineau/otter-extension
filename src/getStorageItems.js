export const getStorageItems = async () => {
  const { otterInstanceUrl } = await chrome.storage.sync.get(
    'otterInstanceUrl'
  );
  const { supabaseApiSecret } = await chrome.storage.sync.get(
    'supabaseApiSecret'
  );
  const { newBookmarkBehaviour } = await chrome.storage.sync.get(
    'newBookmarkBehaviour'
  );
  return {
    otterInstanceUrl,
    supabaseApiSecret,
    newBookmarkBehaviour,
  };
};
