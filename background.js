(async function() {
const remarkableUrls = {
  base: 'https://document-storage-production-dot-remarkable-production.appspot.com',
  uploadRequest: '/document-storage/json/2/upload/request',
  uploadStatus: '/document-storage/json/2/upload/update-status'
}
const printerId = 'remarklater';
const remarkableConfig = await (await fetch(chrome.runtime.getURL('data/remarkable.json'))).json();

chrome.printerProvider.onGetPrintersRequested.addListener((callback) => {
  callback([
    {
      id: printerId,
      name: 'Remarklater'
    },
  ]);
});

chrome.printerProvider.onGetCapabilityRequested.addListener((pid, callback) => {
  if (pid != printerId) {
    return;
  }
  callback({
    version: '1',
    printer: {
      supported_content_type: [{"content_type": "application/pdf"}],
    }
  });
});

chrome.printerProvider.onPrintRequested.addListener(async (printJob, callback) => {
  try {
    let uploadReq = await uploadRequest();
    let zipBlob = await packageZip(uploadReq.ID, printJob.document)
    let docUploadReq = await uploadDocument(uploadReq.BlobURLPut, zipBlob);
    let uploadStatusReq = await updateDocument(uploadReq.ID, printJob.title);
    callback('OK');
  } catch (err) {
    console.error(`Encountered error printing`, printJob, err);
    callback('FAILED');
  }
});

// Make a request to upload a new document
async function uploadRequest() {
  let request = await fetch(remarkableUrls.base + remarkableUrls.uploadRequest, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${remarkableConfig.userToken}`,
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

// Package PDF into a Remarkable-compatible ZIP file
async function packageZip(id, pdf) {
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

// Upload document to storage endpoint.
async function uploadDocument(endpoint, zip) {
  let buffer = await new Response(zip).arrayBuffer();
  return fetch(endpoint, {
    method: 'PUT',
    body: buffer,
  });
}

// Update document properties. Required to make document visible after uploading.
async function updateDocument(id, name, parent='') {
  let request = await fetch(remarkableUrls.base + remarkableUrls.uploadStatus, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${remarkableConfig.userToken}`,
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
})()
