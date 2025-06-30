chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "scanURL") {
    chrome.storage.local.get("urlscanApiKey", async (data) => {
      const apiKey = data.urlscanApiKey;
      const url = message.url;

      try {
        const scanRes = await fetch("https://urlscan.io/api/v1/scan/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-Key": apiKey
          },
          body: JSON.stringify({ url, visibility: "public" })
        });

        const scanData = await scanRes.json();
        const uuid = scanData.uuid;
        const resultUrl = scanData.result;

        // Wait a few seconds for verdict
        await new Promise(r => setTimeout(r, 7000));

        const verdictRes = await fetch(`https://urlscan.io/api/v1/result/${uuid}/`);
        const verdictData = await verdictRes.json();

        const v = verdictData.verdicts?.overall;
        const verdict = v?.malicious ? "malicious" : "clean";
        const categories = v?.categories || [];

        sendResponse({ resultUrl, verdict, categories });

      } catch (err) {
        console.error("Error in background scan:", err);
        sendResponse({ error: err.message });
      }
    });

    return true; // Keep message channel open for async sendResponse
  }
});
