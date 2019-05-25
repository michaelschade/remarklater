(async function() {
const remarkableUrls = {
  base: 'https://document-storage-production-dot-remarkable-production.appspot.com',
  uploadRequest: '/document-storage/json/2/upload/request',
  uploadStatus: '/document-storage/json/2/upload/update-status'
}
const remarkableConfig = await (await fetch(chrome.runtime.getURL('data/remarkable.json'))).json();

// On browser click, initiate PDF export and upload
chrome.browserAction.onClicked.addListener(function(tab) {
  async function getDOM() {
    let data = await html2pdf().from(document.body).output('datauristring');
    chrome.runtime.sendMessage({
      id: 'exportPdf',
      name: document.title,
      data: data
    });
  }

  chrome.tabs.executeScript({file: 'vendor/html2pdf.bundle.min.js'}, () => {
		chrome.tabs.executeScript({code: '(' + getDOM + ')();'});
  });
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.id == 'exportPdf') {
    // Generate upload request
    let uploadReqResp = await fetch(remarkableUrls.base + remarkableUrls.uploadRequest, {
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
    let uploadReq = await uploadReqResp.json();
    uploadReq = uploadReq[0];

    // Package up ZIP for upload endpoint
    let zip = packageAsZip(uploadReq.ID, dataURItoBlob(request.data))
    zip.generateAsync({type: "blob"}).then(async (zipBlob) => {
      let buf = await new Response(zipBlob).arrayBuffer();
      let uploadResp = await fetch(uploadReq.BlobURLPut, {
        method: 'PUT',
        body: buf,
      });

      // Mark PDF as visible
      let uploadStatusResp = await fetch(remarkableUrls.base + remarkableUrls.uploadStatus, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${remarkableConfig.userToken}`,
        },
        body: JSON.stringify([{
          'ID': uploadReq.ID,
          'Parent': '',
          'VissibleName': `${request.name}`,
          'Type': 'DocumentType',
          'Version': 1
        }])
      });
    });
  }
});

function packageAsZip(id, pdf) {
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
  return zip;
}

function dataURItoBlob(dataURI) {
	// convert base64/URLEncoded data component to raw binary data held in a string
	var byteString;
	if (dataURI.split(',')[0].indexOf('base64') >= 0)
		byteString = atob(dataURI.split(',')[1]);
	else
		byteString = unescape(dataURI.split(',')[1]);

	// separate out the mime component
	var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

	// write the bytes of the string to a typed array
	var ia = new Uint8Array(byteString.length);
	for (var i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	return new Blob([ia], {type:mimeString});
}

function uuid4 () {
	//// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	var uuid = '', ii;
	for (ii = 0; ii < 32; ii += 1) {
		switch (ii) {
			case 8:
			case 20:
				uuid += '-';
				uuid += (Math.random() * 16 | 0).toString(16);
				break;
			case 12:
				uuid += '-';
				uuid += '4';
				break;
			case 16:
				uuid += '-';
				uuid += (Math.random() * 4 | 8).toString(16);
				break;
			default:
				uuid += (Math.random() * 16 | 0).toString(16);
		}
	}
	return uuid;
};
})()
