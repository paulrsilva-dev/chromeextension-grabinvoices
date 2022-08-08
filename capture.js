var capture = chrome.extension.connect({
  name: "capture.js <-> background.js"
});
console.log("captureJS===============================",chromeextension_vendor);

function amazonCapture(callback) {
  var captureDom = document.querySelector('#nav-xshop-container'); //  ordersContainer
  if (captureDom) { 
    html2canvas(captureDom).then((canvas) => {
      canvas.toBlob(function(blob){
        return callback({name: "amazon__ATVPDKIKX0DER__.jpg",blob: blob});
      },'image/png');
      
    })
  } else {
    return callback(null);
  }
}

switch (chromeextension_vendor) {
  case 'amazon':
    amazonCapture(function(obj) {
      var URL = window.URL || window.webkitURL;
      var urlLink = URL.createObjectURL(obj.blob);
      capture.postMessage({txt: "@Capture_capturedImage", file:{name: obj.name, blobLink: urlLink} });
      window.close();
    });

    
}