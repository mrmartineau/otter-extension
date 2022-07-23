export const getStorageItems = async () => {
  const { otterInstanceUrl } = await chrome.storage.sync.get(
    'otterInstanceUrl'
  );
  const { supabaseApiSecret } = await chrome.storage.sync.get(
    'supabaseApiSecret'
  );
  const { newBookmarkWindowBehaviour } = await chrome.storage.sync.get(
    'newBookmarkWindowBehaviour'
  );
  return {
    otterInstanceUrl,
    supabaseApiSecret,
    newBookmarkWindowBehaviour,
  };
};
