const Remarkable = {};

(async function() {

let baseAuthUrl = 'https://my.remarkable.com/token/json/2';
let baseDocsUrl = 'https://document-storage-production-dot-remarkable-production.appspot.com';

const Config = {
  urls: {
    uploadRequest: `${baseDocsUrl}/document-storage/json/2/upload/request`,
    uploadStatus: `${baseDocsUrl}/document-storage/json/2/upload/update-status`,
    newDevice: `${baseAuthUrl}/device/new`,
    refreshToken: `${baseAuthUrl}/user/new`,
  }
};
const Auth = await chrome.storage.local.get(['deviceToken'])

Remarkable.isDeviceRegistered = function() {
  return !!Auth.deviceToken;
}

// Register device using code at https://my.remarkable.com/generator-device
Remarkable.registerDevice = async function(code) {
  if (Remarkable.isDeviceRegistered()) {
    throw new Error("Device already registered")
  }
  let request = await fetch(Config.urls.newDevice, {
    method: 'POST',
    body: JSON.stringify({
      'code': code,
      'deviceDesc': 'desktop-linux',
      'deviceId': uuid4()
    })
  });
  if (!request.ok) {
    throw new Error(await request.text());
  }
  let token = await request.text();
  chrome.storage.local.set({
    'deviceToken': token
  })
  Auth.deviceToken = deviceToken;
}

// Refresh the Bearer token before using.
// Should probably cache this, but let's just refresh it every use for now
async function bearerToken() {
  if (!Remarkable.isDeviceRegistered()) {
    throw new Error("Must register device first. Call `Remarkable.registerDevice` with a one-time code from https://my.remarkable.com/generator-device to get started.");
  }
  let request = await fetch(Config.urls.refreshToken, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Auth.deviceToken}`,
    }
  });
  if (!request.ok) {
    throw new Error(await request.text());
  }
  return request.text();
}

// Make a request to upload a new document
Remarkable.uploadRequest = async function() {
  let request = await fetch(Config.urls.uploadRequest, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${await bearerToken()}`,
    },
    body: JSON.stringify([{
      'ID': uuid4(),
      'Type': 'DocumentType',
      'Version': 1
    }])
  });
  if (!request.ok) {
    throw new Error(await request.text());
  }
  let payload = await request.json();
  return payload[0];
}

// Upload document to storage endpoint.
Remarkable.uploadDocument = async function(endpoint, zip) {
  let buffer = await new Response(zip).arrayBuffer();
  return fetch(endpoint, {
    method: 'PUT',
    body: buffer,
  });
}

// Update document properties. Required to make document visible after uploading.
Remarkable.updateDocument = async function(id, name, parent='') {
  let request = await fetch(Config.urls.uploadStatus, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${await bearerToken()}`,
    },
    body: JSON.stringify([{
      'ID': id,
      'Parent': parent,
      'VissibleName': name,
      'Type': 'DocumentType',
      'Version': 1
    }])
  });
  if (!request.ok) {
    throw new Error(await request.text());
  }
  let payload = await request.json();
  return payload[0];
}

// Package PDF into a Remarkable-compatible ZIP file
Remarkable.packageAsZip = async function(id, pdf) {
  var zip = new JSZip();
  zip.file(`${id}.content`, `
    {
        "extraMetadata": {},
        "fileType": "pdf",
        "lastOpenedPage": 0,
        "lineHeight": -1,
        "margins": 180,
        "textScale": 1,
        "transform": {}
    }
  `);
  zip.file(`${id}.pagedata`, '');
  zip.file(`${id}.pdf`, pdf);
  return zip.generateAsync({type: "blob"});
}
})();
