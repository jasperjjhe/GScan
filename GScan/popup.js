const scanBtn = document.getElementById("scanBtn");
const resultList = document.getElementById("resultList");

scanBtn.addEventListener("click", async () => {
  resultList.innerHTML = "Scanning…";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Check if on Gmail page
  if (!tab || !tab.url || !tab.url.includes("mail.google.com")) {
    resultList.innerHTML = "<li>Please open an email in Gmail to scan links.</li>";
    return;
  }

  // Get API key before continuing
  const { urlscanApiKey } = await new Promise(resolve => {
    chrome.storage.local.get("urlscanApiKey", resolve);
  });

  if (!urlscanApiKey) {
    resultList.innerHTML = `
      <li style="color:red;">
        API key not found. Please go to extension settings and enter your urlscan.io API key.
      </li>
    `;
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "extractLinks" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Content script error:", chrome.runtime.lastError.message);
      resultList.innerHTML = "<li>Unable to scan. Please make sure you have an email open in Gmail and try again.</li>";
      return;
    }

    resultList.innerHTML = "";

    if (!response || !response.links || response.links.length === 0) {
      resultList.innerHTML = "<li>No links found in this email.</li>";
      return;
    }

    let cleanCount = 0;
    let maliciousCount = 0;
    let errorCount = 0;
    let completed = 0;

    const total = response.links.length;

    for (const url of response.links) {
      const li = document.createElement("li");
      li.innerHTML = `Scanning <code>${url}</code>...`;
      resultList.appendChild(li);

      chrome.runtime.sendMessage({ type: "scanURL", url }, (res) => {
        completed++;

        if (!res || res.error) {
          li.innerHTML = `<span style="color:red;">Error scanning <code>${url}</code>: ${res?.error || 'Unknown error'}</span>`;
          errorCount++;
        } else {
          const { resultUrl, verdict, categories } = res;

          if (verdict === "malicious") {
            li.innerHTML = `STOP! <a href="${resultUrl}" target="_blank">${url}</a> — flagged as <strong>${categories.join(", ")}</strong>`;
            maliciousCount++;
          } else {
            li.innerHTML = `PASS! <a href="${resultUrl}" target="_blank">${url}</a> — no threats found`;
            cleanCount++;
          }
        }

        // Show summary when all links are done
        if (completed === total) {
          const summary = document.createElement("li");
          summary.style.marginTop = "10px";
          summary.innerHTML = `
            <strong>Scan complete:</strong><br>
            Malicious: ${maliciousCount}<br>
            Clean: ${cleanCount}<br>
            Errors: ${errorCount}
          `;
          resultList.appendChild(summary);
        }
      });
    }
  });
});
