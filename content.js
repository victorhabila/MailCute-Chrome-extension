console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
  const container = document.createElement("div");
  container.style.display = "inline-flex";
  container.style.alignItems = "center";
  container.style.gap = "6px";

  const button = document.createElement("div");
  button.className = "T-I J-J5-Ji aoO v7 T-I-atl L3";
  button.style.padding = "10px 24px";
  button.style.backgroundColor = "#1a73e8";
  button.style.color = "white";
  button.style.borderRadius = "20px";
  button.style.display = "inline-flex";
  button.style.alignItems = "center";
  button.style.marginRight = "5px";
  button.style.justifyContent = "center";
  button.style.fontWeight = "500";
  button.style.cursor = "pointer";
  button.style.border = "none";
  button.style.boxShadow = "0px 1px 3px rgba(0, 0, 0, 0.2)";
  button.style.fontSize = "14px";
  button.style.minWidth = "100px";
  button.innerHTML = "MailCute AI";
  button.setAttribute("role", "button");
  button.setAttribute("data-tooltip", "Generate AI Reply");

  // Create a dropdown for tone selection
  const toneDropdown = document.createElement("select");
  toneDropdown.style.padding = "6px 10px";
  toneDropdown.style.border = "1px solid #ccc";
  toneDropdown.style.borderRadius = "4px";
  toneDropdown.style.backgroundColor = "white";
  toneDropdown.style.cursor = "pointer";
  toneDropdown.style.fontSize = "14px";
  toneDropdown.style.color = "#333";

  const tones = [
    "Professional",
    "Casual",
    "Friendly",
    "Persuasive",
    "Apologetic",
    "Sarcastic",
  ];
  tones.forEach((tone) => {
    const option = document.createElement("option");
    option.value = tone.toLowerCase();
    option.textContent = tone;
    toneDropdown.appendChild(option);
  });

  // Append the dropdown and button to the container
  container.appendChild(toneDropdown);
  container.appendChild(button);

  button.addEventListener("click", async () => {
    try {
      button.innerHTML = "Generating...";
      button.disabled = true;

      const emailContent = getEmailContent();
      const selectedTone = toneDropdown.value; // Get selected tone

      const response = await fetch("http://localhost:8080/api/email/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailContent: emailContent,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        throw new Error("API Request Failed");
      }

      const generatedReply = await response.text();
      const composeBox = document.querySelector(
        '[role="textbox"][g_editable="true"]'
      );

      if (composeBox) {
        composeBox.focus();
        document.execCommand("insertText", false, generatedReply);
      } else {
        console.error("Compose box was not found");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate reply");
    } finally {
      button.innerHTML = "MailCute AI";
      button.disabled = false;
    }
  });

  return container;
}

function getEmailContent() {
  const selectors = [
    ".h7",
    ".a3s.aiL",
    ".gmail_quote",
    '[role="presentation"]',
  ];
  for (const selector of selectors) {
    const content = document.querySelector(selector);
    if (content) {
      return content.innerText.trim();
    }
  }
  return "";
}

function findComposeToolbar() {
  const selectors = [".btC", ".aDh", '[role="toolbar"]', ".gU.Up"];
  for (const selector of selectors) {
    const toolbar = document.querySelector(selector);
    if (toolbar) {
      return toolbar;
    }
  }
  return null;
}

function injectButton() {
  const existingButton = document.querySelector(".ai-reply-button");
  if (existingButton) existingButton.remove();

  const toolbar = findComposeToolbar();
  if (!toolbar) {
    console.log("Toolbar not found");
    return;
  }

  console.log("Toolbar found, creating AI button");
  const buttonContainer = createAIButton();
  buttonContainer.classList.add("ai-reply-button");

  toolbar.insertBefore(buttonContainer, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const addedNodes = Array.from(mutation.addedNodes);
    const hasComposeElements = addedNodes.some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches('.aDh, .btC, [role="dialog"]') ||
          node.querySelector('.aDh, .btC, [role="dialog"]'))
    );

    if (hasComposeElements) {
      console.log("Compose Window Detected");
      setTimeout(injectButton, 500);
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
