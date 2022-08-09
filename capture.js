var capture = chrome.extension.connect({
  name: "capture.js <-> background.js"
});
console.log("captureJS===============================",chromeextension_vendor);

async function waitUntilAmazonInvoiceDomAppear(resolve) {
  var iBodyTable = null;
  if(document.querySelector('#amazon_order_specialinvoice'))
    iBodyTable = document.querySelector('#amazon_order_specialinvoice').contentWindow.document.querySelector("body table");

  if(iBodyTable) return resolve("done!");
  else {
    await new Promise(resolve => setTimeout(resolve, 200));
    waitUntilAmazonInvoiceDomAppear(resolve);
  }
}

let waitDom = new Promise((resolve, reject) => {
  waitUntilAmazonInvoiceDomAppear(resolve);
});

async function amazonCapture_pdfcapture(link, callback) {
  var iframe = document.createElement('iframe');
  // iframe.style.display = "none";
  iframe.style.height = "100%";
  iframe.style.width = "800px";

  iframe.src = "https://www.amazon.com/" + link;
  iframe.id="amazon_order_specialinvoice";

  document.body.appendChild(iframe);

  await waitDom;

  var iBody = document.querySelector('#amazon_order_specialinvoice').contentWindow.document.querySelector("body");
  if (iBody) {
    html2canvas(iBody).then((canvas) => {
      var imgData = canvas.toDataURL('image/png');              
      var doc = new jsPDF('a4');
      doc.addImage(imgData, 'PNG', 0, 0);
      var blobPDF = new Blob([doc.output('blob')], {type: 'application/pdf'});
      return callback({name: "amazon__ATVPDKIKX0DER__.pdf", blob: blobPDF});
      // canvas.toBlob(function(blob){
      //   return callback({name: "amazon__ATVPDKIKX0DER__.png",blob: blob});
      // },'image/png');
    })
  } else {
    return callback(null);
  }
}

function amazonGetInvoiceList(callback) {
  var invoicesLink = document.querySelectorAll("div.a-box.order-info div.actions.a-col-right div.a-row.yohtmlc-order-level-connections a[class='a-link-normal']");
  var linkArr = [];
  for(var i = 0; i < invoicesLink.length; i++) {
    var href = invoicesLink[i].getAttribute("href");
    if(href) {
      linkArr.push(invoicesLink[i].getAttribute("href"))
    }
  }
  callback(linkArr);
}

function ebayCapture(callback) {
  var ordersDom = document.querySelector("div.m-container-items");
  if(!ordersDom) callback({});
  
  var fileName = document.querySelector("a.m-top-nav__username").getAttribute("href").slice(25) + ".pdf"; // https://www.ebay.com/usr/evyatarshoresh
  ordersDom.style.width = "800px";
  html2canvas(ordersDom,{useCORS: true}).then((canvas) => {
    var imgData = canvas.toDataURL('image/png');              
    var doc = new jsPDF('a4');
    doc.addImage(imgData, 'PNG', 0, 0);
    doc.save("test.pdf");
    var blobPDF = new Blob([doc.output('blob')], {type: 'application/pdf'});
    return callback({name: fileName, blob: blobPDF});
  });
}

switch (chromeextension_vendor) {
  case 'amazon_orders':
    amazonGetInvoiceList(function(linkArr) {
      console.log('linkArr: ', linkArr);
      amazonCapture_pdfcapture(linkArr[0], function(obj){
        var URL = window.URL || window.webkitURL;
        var urlLink = URL.createObjectURL(obj.blob);
        capture.postMessage({txt: "@Capture_capturedImage", file:{name: obj.name, blobLink: urlLink} });
        window.close();
      })
    });
  break;
  case 'ebay_orders':
    ebayCapture(function(obj){
      var URL = window.URL || window.webkitURL;
      var urlLink = URL.createObjectURL(obj.blob);
      capture.postMessage({txt: "@Capture_capturedImage_ebay", file:{name: obj.name, blobLink: urlLink} });
      window.close();
    })
  break;
}