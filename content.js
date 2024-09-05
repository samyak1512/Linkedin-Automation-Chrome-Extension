// Global variables to store user-defined message templates
let connectionMessageTemplate = "Hi {name}, I noticed you work at {company}. I'd love to connect!";
let networkMessageTemplate = "Hello {name}, I see you're at {company}. I wanted to reach out about...";

// Flag to control campaign running state
let stopCampaign = false;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startCampaign") {
    stopCampaign = false; // Reset flag
    extractPersonsForCampaign().then(persons => {
      sendResponse({ status: "Persons extracted", count: persons.length });
      startConnectionCampaign();
    });
    return true; // Indicates that the response is sent asynchronously
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

// New function to extract all persons for the connection campaign
async function extractPersonsForCampaign() {
  const persons = [];
  const connectionButtons = document.querySelectorAll('button[aria-label^="Invite"]');
  console.log(`Found ${connectionButtons.length} potential connections`);

  for (const button of connectionButtons) {
    const name = extractName(button);
    const company = extractCompany(button);
    persons.push({ name, company, button });
  }

  return persons;
}

// Modified startConnectionCampaign function
async function startConnectionCampaign() {
  const persons = await extractPersonsForCampaign();
  console.log(`Extracted ${persons.length} persons for the campaign`);

  for (const person of persons) {
    if (stopCampaign) {
      console.log("Campaign stopped");
      break;
    }

    await sendConnectionRequest(person.button, person.name, person.company);
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
  }
}

// Start sending messages to network
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

// Extract name from the element
function extractName(element) {
  let container = element.closest('.entity-result__item') || 
                  element.closest('.invitation-card__info') ||
                  element.closest('.hiredivider-item') || 
                  element.closest('li'); 
  
  if (!container) {
    container = document;
  }
  
  const nameSelectors = [
    '.entity-result__title-text a span[aria-hidden="true"]',
    '.entity-result__title-text a',
    '.invitation-card__title',
    '[data-control-name="actor"]',
    'span.artdeco-entity-lockup__title', 
    'span.entity-result__title-text',
    'h3.actor-name'
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
  
  return "there";
}

// Extract company from the element
function extractCompany(element) {
  let container = element.closest('.entity-result__item') || 
                  element.closest('.invitation-card__info') ||
                  element.closest('.hiredivider-item') || 
                  element.closest('li');
  
  if (!container) {
    container = document;
  }
  
  const companySelectors = [
    '.entity-result__summary'
  ];
  
  for (let selector of companySelectors) {
    const companyElement = container.querySelector(selector);
    if (companyElement) {
      const company = companyElement.textContent.trim();
      const lastWord = company.split(' ').pop();
      return lastWord;
    }
  }
  
  return "your company";
}

// Send a connection request
async function sendConnectionRequest(button, name, company) {
  try {
    logElementInfo(button);
    console.log(`Attempting to send connection request to ${name} at ${company}`);
    
    button.click();
    
    await waitForElement('.send-invite__actions', 5000);
    
    const addNoteButton = document.querySelector('button[aria-label="Add a note"]');
    if (addNoteButton) {
      addNoteButton.click();
      await waitForElement('#custom-message', 5000);
    }
    
    const messageInput = document.querySelector('#custom-message');
    if (messageInput) {
      const personalizedMessage = connectionMessageTemplate
        .replace('{name}', name)
        .replace('{company}', company);
      messageInput.value = personalizedMessage;
      messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    const sendButton = await waitForElement('button[aria-label="Send invitation"]', 5000);
    if (sendButton) {
      sendButton.click();
      console.log(`Connection request sent to ${name} at ${company}`);
    }
  } catch (error) {
    console.error(`Failed to send connection request to ${name}:`, error);
  }
}

// Send a network message
async function sendNetworkMessage(button, name, company) {
  try {
    logElementInfo(button);
    console.log(`Attempting to send message to ${name} at ${company}`);
    
    button.click();
    await waitForElement('.msg-form__contenteditable', 5000);
    
    const messageInput = await waitForElement('.msg-form__contenteditable', 5000);
    if (messageInput) {
      const personalizedMessage = networkMessageTemplate
        .replace('{name}', name)
        .replace('{company}', company);
      messageInput.textContent = personalizedMessage;
      messageInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    const sendButton = await waitForElement('button[aria-label="Send"]', 5000);
    if (sendButton) {
      sendButton.click();
      console.log(`Message sent to ${name} at ${company}`);
    }
  } catch (error) {
    console.error(`Failed to send message to ${name}:`, error);
  }
}

// Wait for an element to appear
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function checkElement() {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        console.log(`Timeout waiting for element: ${selector}`);
        resolve(null); 
      } else {
        setTimeout(checkElement, 100);
      }
    }

    checkElement();
  });
}

// Log information about the element
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