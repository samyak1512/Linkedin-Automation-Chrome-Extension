document.addEventListener('DOMContentLoaded', function() {
    // Load saved templates
    chrome.storage.sync.get(['connectionTemplate', 'networkTemplate'], function(data) {
      if (data.connectionTemplate) {
        document.getElementById('connectionTemplate').value = data.connectionTemplate;
      }
      if (data.networkTemplate) {
        document.getElementById('networkTemplate').value = data.networkTemplate;
      }
    });
  
    // Update templates
    document.getElementById('updateTemplates').addEventListener('click', function() {
      const connectionTemplate = document.getElementById('connectionTemplate').value;
      const networkTemplate = document.getElementById('networkTemplate').value;
      
      chrome.storage.sync.set({connectionTemplate, networkTemplate}, function() {
        console.log('Templates saved');
      });
      
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
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
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "startCampaign"});
      });
    });
  
    // Message network
    document.getElementById('messageNetwork').addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "messageNetwork"});
      });
    });

    // Stop campaign
    document.getElementById('stopCampaign').addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "stopCampaign"}, function(response) {
          console.log(response.status);
        });
      });
    });
});