// Global variables to store user-defined message templates
let connectionMessageTemplate = "Hi {name}, I noticed you work at {company}. I'd love to connect!";
let networkMessageTemplate = "Hello {name}, I see you're at {company}. I wanted to reach out about...";

// Flag to control campaign running state
let stopCampaign = false;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startCampaign") {
    stopCampaign = false; // Reset flag
    startConnectionCampaign();
  } else if (request.action === "messageNetwork") {
    stopCampaign = false; // Reset flag
    messageNetwork();
  } else if (request.action === "stopCampaign") {
    stopCampaign = true; // Set flag to stop campaign
    sendResponse({ status: "Campaign stopped" });
  } else if (request.action === "updateTemplates") {
    connectionMessageTemplate = request.connectionTemplate;
    networkMessageTemplate = request.networkTemplate;
    sendResponse({ status: "Templates updated" });
  }
});

async function startConnectionCampaign() {
  const connectionButtons = document.querySelectorAll('button[aria-label^="Invite"]');
  console.log(`Found ${connectionButtons.length} connection buttons`);
  
  for (const button of connectionButtons) {
    if (stopCampaign) {
      console.log("Campaign stopped");
      break; // Exit the loop if campaign is stopped
    }

    const name = extractName(button);
    const company = extractCompany(button);
    
    await sendConnectionRequest(button, name, company);
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  }
}

async function messageNetwork() {
  const messageButtons = document.querySelectorAll('button[aria-label^="Message"]');
  console.log(`Found ${messageButtons.length} message buttons`);
  
  for (const button of messageButtons) {
    if (stopCampaign) {
      console.log("Campaign stopped");
      break; // Exit the loop if campaign is stopped
    }

    const name = extractName(button);
    const company = extractCompany(button);
    
    await sendNetworkMessage(button, name, company);
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  }
}
function extractName(element) {
  // Start from the button and traverse up to find the container
  let container = element.closest('.entity-result__item') || 
                  element.closest('.invitation-card__info') ||
                  element.closest('.hiredivider-item') || // Added new potential container
                  element.closest('li'); // Fallback to closest list item
  
  if (!container) {
    console.log('Container not found for name extraction, using document');
    container = document;
  }
  
  // Try different selectors to find the name
  const nameSelectors = [
    '.entity-result__title-text a span[aria-hidden="true"]',
    '.entity-result__title-text a',
    '.invitation-card__title',
    '[data-control-name="actor"]',
    'span.artdeco-entity-lockup__title', // Added new potential selector
    'span.entity-result__title-text', // Added new potential selector
    'h3.actor-name' // Added new potential selector
  ];
  
  for (let selector of nameSelectors) {
    const nameElement = container.querySelector(selector);
    if (nameElement) {
      const name = nameElement.textContent.trim();
      const firstName = name.trim().split(/\s+/)[0];
      console.log('Extracted name:', firstName);
      return firstName;
    }
  }
  
  console.log('Name not found with any selector');
  return "there";
}

function extractCompany(element) {
  // Start from the button and traverse up to find the container
  let container = element.closest('.entity-result__item') || 
                  element.closest('.invitation-card__info') ||
                  element.closest('.hiredivider-item') || // Added new potential container
                  element.closest('li'); // Fallback to closest list item
  
  if (!container) {
    console.log('Container not found for company extraction, using document');
    container = document;
  }
  
  // Try different selectors to find the company
  const companySelectors = [
    
    '.entity-result__summary'
  ];
  
  for (let selector of companySelectors) {
    const companyElement = container.querySelector(selector);
    if (companyElement) {
      const company = companyElement.textContent.trim();
      const lastWord = company.split(' ').pop();  // Split by spaces and select the last word
      console.log('Extracted last word of company:', lastWord);
      return lastWord;
    }
  }
  
  console.log('Company not found with any selector');
  return "your company";
}

async function sendConnectionRequest(button, name, company) {
  try {
    logElementInfo(button);
    console.log(`Attempting to send connection request to ${name} at ${company}`);
    
    // Click the "Connect" button
    button.click();
    
    // Wait for the modal to appear
    await waitForElement('.send-invite__actions', 5000);
    
    // Check if "Add a note" button exists, if not, the note field might already be visible
    const addNoteButton = document.querySelector('button[aria-label="Add a note"]');
    if (addNoteButton) {
      addNoteButton.click();
      await waitForElement('#custom-message', 5000);
    }
    
    // Fill in the custom message
    const messageInput = document.querySelector('#custom-message');
    if (messageInput) {
      const personalizedMessage = connectionMessageTemplate
        .replace('{name}', name)
        .replace('{company}', company);
      messageInput.value = personalizedMessage;
      messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      console.log('Message input field not found');
    }
    
    // Click the "Send" button
    const sendButton = await waitForElement('button[aria-label="Send invitation"]', 5000);
    if (sendButton) {
      sendButton.click();
      console.log(`Connection request sent to ${name} at ${company}`);
    } else {
      console.log('Send button not found');
    }
  } catch (error) {
    console.error(`Failed to send connection request to ${name}:`, error);
  }
}

async function sendNetworkMessage(button, name, company) {
  try {
    logElementInfo(button);
    console.log(`Attempting to send message to ${name} at ${company}`);
    
    // Click the "Message" button
    button.click();
    await waitForElement('.msg-form__contenteditable', 5000);
    
    // Fill in the custom message
    const messageInput = await waitForElement('.msg-form__contenteditable', 5000);
    if (messageInput) {
      const personalizedMessage = networkMessageTemplate
        .replace('{name}', name)
        .replace('{company}', company);
      messageInput.textContent = personalizedMessage;
      messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Click the "Send" button
    const sendButton = await waitForElement('button[aria-label="Send"]', 5000);
    if (sendButton) {
      sendButton.click();
      console.log(`Message sent to ${name} at ${company}`);
    } else {
      console.log('Send button not found');
    }
  } catch (error) {
    console.error(`Failed to send message to ${name}:`, error);
  }
}

function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function checkElement() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        console.log(`Timeout waiting for element: ${selector}`);
        resolve(null); // Resolve with null instead of rejecting
      } else {
        setTimeout(checkElement, 100);
      }
    }

    checkElement();
  });
}

function logElementInfo(element) {
  console.log('Element:', element);
  console.log('Parent structure:', element.closest('.entity-result__item') || 
                                  element.closest('.invitation-card__info') ||
                                  element.closest('.hiredivider-item') ||
                                  element.closest('li') ||
                                  'No relevant parent found');
}

// Initialize the extension
console.log("LinkedIn Automation Extension initialized");