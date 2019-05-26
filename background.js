(async function() {
const printerId = 'remarklater';

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
