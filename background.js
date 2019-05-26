(async function() {
const printerId = 'remarklater';

/* Extension startup */
function initRemarkable() {
  if (!Remarkable.isDeviceRegistered()) {
      chrome.tabs.create({url:"static/setup.html"});
  }
}
chrome.runtime.onInstalled.addListener(initRemarkable);
chrome.runtime.onStartup.addListener(initRemarkable);

/* Setup custom printers */

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

// TODO: can't use callback to indicate status because we're using an async
// function. is there a better way to thread error states through?
chrome.printerProvider.onPrintRequested.addListener(async (printJob, callback) => {
  try {
    let uploadReq = await Remarkable.uploadRequest();
    let zipBlob = await Remarkable.packageAsZip(uploadReq.ID, printJob.document)
    let docUploadReq = await Remarkable.uploadDocument(uploadReq.BlobURLPut, zipBlob);
    let uploadStatusReq = await Remarkable.updateDocument(uploadReq.ID, printJob.title);
    callback('OK');
  } catch (err) {
    console.error(`Encountered error printing`, printJob, err);
    callback('FAILED');
  }
});
})()
