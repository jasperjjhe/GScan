const input = document.getElementById('apiKey');
const status = document.getElementById('status');

// Load saved key
chrome.storage.local.get('urlscanApiKey', (data) => {
  if (data.urlscanApiKey) {
    input.value = data.urlscanApiKey;
  }
});

// Save new key
document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey = input.value.trim();
  chrome.storage.local.set({ urlscanApiKey: apiKey }, () => {
    status.textContent = "Saved!";
    setTimeout(() => (status.textContent = ""), 2000);
  });
});
