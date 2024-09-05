document.addEventListener('DOMContentLoaded', function() {
    // Load saved templates from Chrome storage
    chrome.storage.sync.get(['connectionTemplate', 'networkTemplate'], function(data) {
        if (data.connectionTemplate) {
            document.getElementById('connectionTemplate').value = data.connectionTemplate;
        }
        if (data.networkTemplate) {
            document.getElementById('networkTemplate').value = data.networkTemplate;
        }
    });

    // Update templates and save to Chrome storage
    document.getElementById('updateTemplates').addEventListener('click', function() {
        const connectionTemplate = document.getElementById('connectionTemplate').value;
        const networkTemplate = document.getElementById('networkTemplate').value;

        // Save templates in storage
        chrome.storage.sync.set({ connectionTemplate, networkTemplate }, function() {
            console.log('Templates saved');
        });

        // Send updated templates to the content script
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "updateTemplates",
                connectionTemplate: connectionTemplate,
                networkTemplate: networkTemplate
            }, function(response) {
                console.log(response.status);
            });
        });
    });

    // Start connection campaign
    document.getElementById('startCampaign').addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "startCampaign" });
        });
    });

    // Message network
    document.getElementById('messageNetwork').addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "messageNetwork" });
        });
    });

    // Stop connection campaign
    document.getElementById('stopCampaign').addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stopCampaign" }, function(response) {
                console.log(response.status);
            });
        });
    });

    // Stop messaging network campaign
    document.getElementById('stopMessaging').addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stopMessaging" }, function(response) {
                console.log(response.status);
            });
        });
    });

    // Extract persons for campaign
    document.getElementById('extractBtn').addEventListener('click', () => {
        console.log("Extracting persons");
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "startCampaign"}, (response) => {
                if (response && response.status === "Persons extracted") {
                    document.getElementById('extractionResult').textContent = `Extracted ${response.count} persons`;
                    document.getElementById('startCampaignBtn').disabled = false;
                }
            });
        });
    });

    // Start campaign button
    document.getElementById('startCampaignBtn').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "startCampaign"});
        });
    });

    // Stop campaign button
    document.getElementById('stopCampaignBtn').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {action: "stopCampaign"});
        });
    });
});