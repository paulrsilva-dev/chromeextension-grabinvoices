window.onload = function() {
  var port = chrome.extension.connect({
    name: "popup.js <-> background.js"
  });
  // initial
  port.postMessage({txt: "@LoadVendorsState"});
  port.onMessage.addListener(function(msg) {
    // console.log('popmsg: ', msg);
    switch(msg.txt) {
      case "@vendor_status":
        document.getElementById(msg.vendor).innerHTML = msg.status == true ? "<span style='color:green'>on</span>" : `<a href="${msg.activeLink}" target="_blank">active this!</a>`;
      break;
      case "@vendor_uploaded":
        console.log('vendor_uploaded:=====> ', msg);

        // var tmp = document.createElement('li'); // is a node
        // tmp.innerHTML = `${msg.vendor}: ${msg.status.status == true ? '<span style="color:green">success!</span>' : msg.status.txt}${msg.status.status == true ? '<span style="color:green">success!</span>' : msg.status.txt}`;
        // document.getElementById("uploadResult").appendChild(tmp);
        document.getElementById(msg.vendor).innerHTML = `${msg.status.status == true ? '<span style="color:green">success</span>' : '<span style="color:red">'+msg.status.txt+'</span>'}`;
      break;
    }
  });

  document.getElementById("startGrab").addEventListener("click", function() {
    initialVendorsTxt();
    port.postMessage({txt: "@StartGrab"});
  });
};

function initialVendorsTxt() {
  var vendors = document.querySelectorAll("#vendorList li .w3-right");
  for(var i =0 ; i < vendors.length; i++) {
    vendors[i].innerHTML = '<i class="fa fa-spinner fa-pulse" aria-hidden="true"></i>';
  }
}