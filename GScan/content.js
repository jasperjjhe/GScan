chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "extractLinks") {
    waitForEmailBody()
      .then((emailBody) => {
        const anchors = emailBody.querySelectorAll("a[href]");
        const links = Array.from(anchors)
          .map(a => a.href)
          .filter(href => href.startsWith("http"));
        sendResponse({ links });
      })
      .catch(() => {
        sendResponse({ links: [] });
      });

    return true; // Async response
  }
});

// Wait for Gmail email body to render
function waitForEmailBody(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      // Updated selector
      const el = document.querySelector("div.nH.bkK");
      if (el) return resolve(el);
      if (Date.now() - start > timeout) return reject("Timeout: email body not found.");
      requestAnimationFrame(check);
    };

    check();
  });
}
