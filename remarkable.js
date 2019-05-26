const Remarkable = {};

(async function() {
const RemarkableConfig = {
  urls: {
    base: 'https://document-storage-production-dot-remarkable-production.appspot.com',
    uploadRequest: '/document-storage/json/2/upload/request',
    uploadStatus: '/document-storage/json/2/upload/update-status',
  }
};
RemarkableConfig.secrets = await (await fetch(chrome.runtime.getURL('data/remarkable.json'))).json();

// Make a request to upload a new document
Remarkable.uploadRequest = async function() {
  let request = await fetch(RemarkableConfig.urls.base + RemarkableConfig.urls.uploadRequest, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${RemarkableConfig.secrets.userToken}`,
    },
    body: JSON.stringify([{
      'ID': uuid4(),
      'Type': 'DocumentType',
      'Version': 1
    }])
  });
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
  let request = await fetch(RemarkableConfig.urls.base + RemarkableConfig.urls.uploadStatus, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${RemarkableConfig.secrets.userToken}`,
    },
    body: JSON.stringify([{
      'ID': id,
      'Parent': parent,
      'VissibleName': name,
      'Type': 'DocumentType',
      'Version': 1
    }])
  });
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
