'use strict'
console.log("===== background.js =====");
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.method === 'openLocalFile') {
    const localFileUrl = message.localFileUrl
    const tab = sender.tab
    openLocalFile(localFileUrl, tab)
  }
})

// Clearbit ======================================================
function clearbit(callback) {
	let clearbit_xhr = new XMLHttpRequest();
	clearbit_xhr.responseType = "document"
	clearbit_xhr.open("GET", "https://dashboard.clearbit.com/billing/info");
	clearbit_xhr.send();
	clearbit_xhr.onerror = () => console.error('error');
	clearbit_xhr.onload = () => {
		let html = clearbit_xhr.responseXML;
		let section_invoices = html.querySelector("section.invoices");
		if(!section_invoices) {
			// alert to user to login!
			callback({status: false, txt: "should login!"});
			return;
		}
		let userEmail = html.querySelector("span.user-menu-content-email").textContent;
		// get the last invoice
		let invoices = section_invoices.querySelectorAll("table tbody tr");

		if(invoices) {
			let firstLink = "https://dashboard.clearbit.com" + invoices[0].querySelector("a[title='Download PDF']").getAttribute("href");
			let period = invoices[0].querySelector("td[class='range'] a").textContent;

			let infoTxt = `clearbit__${userEmail.trim()}__${period.trim()}`;
			

			if(firstLink) {
				let blob_xhr = new XMLHttpRequest();
				blob_xhr.onerror = () => console.error('error');
				blob_xhr.open("GET", firstLink);
				blob_xhr.responseType = "blob";
				blob_xhr.send();
				blob_xhr.onload = () => {
					postToServer({info: infoTxt + ".pdf", blob: blob_xhr.response}, function(resp) {
						callback(resp);
					});
				}
			}
		}
	}
}

// Clearbit ======================================================
function getStringBetween(str, start, end) {
	const result = str.match(new RegExp(start + "(.*)" + end));
	return result[1];
}

function unbounce(callback) {
	let user_xhr = new XMLHttpRequest();
	user_xhr.responseType = "document"
	user_xhr.open("GET", "https://app.unbounce.com/");
	user_xhr.send();
	user_xhr.onerror = () => console.error('error');
	user_xhr.onload = () => {
		let html = user_xhr.responseXML;
		let scriptTxt = html.querySelector("body script").textContent;
		if(scriptTxt.indexOf("current_account") < 0) {
			// alert to user to login!
			callback({status: false, txt: "should login!"});
			return;
		}
		let accountId = scriptTxt.match(/current_account': '(.*)'/)[1];
		var allScriptsDom = html.querySelectorAll("script");
		let userEmail ='';
		for(let i = 0; i < allScriptsDom.length; i++) {
			if(allScriptsDom[i].textContent.indexOf("gon.current_user_email=") > -1) {
				let txt = allScriptsDom[i].textContent;
				userEmail = getStringBetween(txt, 'current_user_email="', '";gon.current_user_name=');
				break;
			}
		}
		

		let page_xhr = new XMLHttpRequest();
		page_xhr.responseType = "document"
		page_xhr.open("GET", `https://app.unbounce.com/accounts/${accountId}/billing_info`);
		page_xhr.send();
		page_xhr.onerror = () => console.error('error');
		page_xhr.onload = () => {
			let pageHtml = page_xhr.responseXML;
			let invoicesTable = pageHtml.querySelector("div.invoices-table");
			if(invoicesTable) {
				let firstInvoice = invoicesTable.querySelectorAll("tbody tr.invoices-table-row")[0];
				let firstLink = firstInvoice.querySelector("a").getAttribute("href");
				let period = firstInvoice.querySelector("td.invoices-table-cell--narrow").textContent;
				let infoTxt = `unbounce__${userEmail.trim()}__${period.trim()}`;

				if(firstLink) {
					let blob_xhr = new XMLHttpRequest();
					blob_xhr.onerror = () => console.error('error');
					blob_xhr.open("GET", firstLink);
					blob_xhr.responseType = "blob";
					blob_xhr.send();
					blob_xhr.onload = () => {
						postToServer({info: infoTxt + ".pdf", blob: blob_xhr.response}, function(resp) {
							callback(resp);
						});
					}
				}
			}

		}

	}
}
// Amazon ======================================================
function amazon() {
	chrome.tabs.create({ active: false, url: "https://www.amazon.com/gp/your-account/order-history?orderFilter=year-2016&ref_=ppx_yo2ov_dt_b_filter_all_y2016" }, function(tab) { // https://www.amazon.com/gp/css/order-history?ref_=nav_AccountFlyout_orders
		chrome.tabs.executeScript(tab.id, {file: "html2canvas.min.js"}, function(){
			chrome.tabs.executeScript(tab.id, {file: "jspdf.js"}, function(){
				chrome.tabs.executeScript(tab.id, {code: "var chromeextension_vendor='amazon_orders';"}, function(){
					chrome.tabs.executeScript(tab.id, {file: "capture.js"});
				});
			});
		});
	});
}



// hotjar ======================================================
function hotjar(callback) {
	let user_xhr = new XMLHttpRequest();
	user_xhr.responseType = "json"
	user_xhr.open("GET", "https://insights.hotjar.com/api/v2/users/me");
	user_xhr.send();
	user_xhr.onerror = () => console.error('error');
	user_xhr.onload = () => {
		let resp = user_xhr.response;
		
		if(!(resp && resp.access_key && resp.accounts)) {
			// Alert to user to login
			callback({status: false, txt: "should login!"});
			return;
		}
		let userEmail = resp.user_email;
		let userId = resp.accounts[0].id;
		let invoicesLink = `https://insights.hotjar.com/api/v1/accounts/${userId}/invoices`;
		let invoices_xhr = new XMLHttpRequest();
		invoices_xhr.onerror = () => console.error('error');
		invoices_xhr.open("GET", invoicesLink);
		invoices_xhr.responseType = "json";
		invoices_xhr.send();
		invoices_xhr.onload = () => {
			let resp = invoices_xhr.response;
			let firstLink = `https://insights.hotjar.com/invoices/${resp[0].id}.pdf?token=${resp[0].token}`;
			let infoTxt = `hotjar__${userEmail.trim()}__${resp[0].created_epoch_time}`;
			console.log('firstLink: ', firstLink);
			let blob_xhr = new XMLHttpRequest();
			blob_xhr.open("GET", firstLink);
			blob_xhr.responseType = "blob";
			blob_xhr.send();
			blob_xhr.onload = () => {
				postToServer({info: infoTxt + ".pdf", blob: blob_xhr.response}, function(resp) {
					callback(resp);
				});
			}
			blob_xhr.onerror = () => console.error('error');
		}
	}
}

function hotJarToken() {
	chrome.cookies.getAll({domain: "insights.hotjar.com"}, function(cookies) {
		var cookieTxt = "";
		for(let i = 0; i < cookies.length; i++) {
			cookieTxt += `${cookies[i].name}=${cookies[i].value}; `;
		}
		// console.log('cookieTxt: ', cookieTxt);
		hotJarReq(cookieTxt);
		
	});
}
// hotJarToken("");
function hotJarReq(cookie) {
	let http = new XMLHttpRequest();
	http.responseType = "json";
	http.open("POST", "https://insights.hotjar.com/api/castleguard/token");
	// http.setRequestHeader('origin', "https://insights.hotjar.com");
	document.cookie = "AAAAA";
	document.origin = "https://insights.hotjar.com";
	http.send();
	http.onload = () => {
		let resp = http.response;
	}		
}

function postToServer(obj, callback) { // data = {info: "vendor__useremail__period__timestamp", blob: blob}
	var data = new FormData();
	data.append('info', obj.info);
	data.append('data', obj.blob);

	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'http:localhost:8080/api/pdf', true);
	// xhr.setRequestHeader("Content-Type", "multipart/form-data");
	xhr.onerror = () => console.error('error');
	xhr.onload = function () {
			// do something to response
			if(this.responseText == "success") {
				return callback({status: true, txt: ""});
			} else {
				return callback({status: false, txt: this.responseText});
			}
			
	};
	xhr.send(data);
}
// postBlob("ttt");
// hotjar();
// unbounce();
// clearbit();
/* chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
		console.log('111details: ', details);
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      
    }
		details.initiator = "https://insights.hotjar.com";
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]
); */

// ================================================================

/* let xhr = new XMLHttpRequest();
xhr.onload = () => {
    // let doc = xhr.responseXML;
    console.log("xhr===>", xhr);
    //todo...
		var url = window.URL || window.webkitURL;
		var link = url.createObjectURL(xhr.response);
		console.log("a====>", a);
		var a = document.createElement("a");
		a.setAttribute("download", "fffffffffffff");
		a.setAttribute("href", link);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
}
xhr.onerror = () => console.error('error');
xhr.open("GET", "https://app.unbounce.com/invoices/1859842?account_id=3678971");
xhr.responseType = "blob";
xhr.send();
 */
function clearbit_status(callback) {
	let http = new XMLHttpRequest();
	http.responseType = "text"
	http.open("GET", "https://dashboard.clearbit.com/account/user.js");
	http.send();
	http.onerror = () => console.error('error');
	http.onload = () => {
		let resTxt = http.response;
		if(resTxt.indexOf("email") < 0) {
			return callback(false);
		} else {
			return callback(true);
		}
	}
}

function unbounce_status(callback) {
	let http = new XMLHttpRequest();
	http.responseType = "document"
	http.open("GET", "https://app.unbounce.com/");
	http.send();
	http.onerror = () => console.error('error');
	http.onload = () => {
		let html = http.responseXML;
		let scriptTxt = html.querySelector("body script").textContent;
		if(scriptTxt.indexOf("current_account") < 0) {
			// alert to user to login!
			return callback(false);
		} else {
			return callback(true);
		}
	}
}

function hotjar_status(callback) {
	let http = new XMLHttpRequest();
	http.responseType = "json"
	http.open("GET", "https://insights.hotjar.com/api/v2/users/me");
	http.send();
	http.onerror = () => console.error('error');
	http.onload = () => {
		let resp = http.response;
		if(!(resp && resp.access_key && resp.accounts)) {
			return callback(false);
		} else {
			return callback(true);
		}
	}
}

function amazon_status(callback) {
	let http = new XMLHttpRequest();
	http.responseType = "document"
	http.open("GET", "https://www.amazon.com/gp/css/order-history?ref_=nav_AccountFlyout_orders");
	http.send();
	http.onerror = () => console.error('error');
	http.onload = () => {
		let html = http.responseXML;
		if(html.querySelector("title").textContent == "Your Orders") {
			return callback(true);
		} else {
			return callback(false);
		}
	}
}


function checkVendorsStatus(callback) {
	clearbit_status(function(status) {
		callback({txt: "@vendor_status", vendor: "clearbit", status: status, activeLink: "https://dashboard.clearbit.com"});
	});
	unbounce_status(function(status) {
		callback({txt: "@vendor_status", vendor: "unbounce", status: status, activeLink: "https://app.unbounce.com/"});
	});
	hotjar_status(function(status) {
		callback({txt: "@vendor_status", vendor: "hotjar", status: status, activeLink: "https://insights.hotjar.com"});
	});
	amazon_status(function(status) {
		callback({txt: "@vendor_status", vendor: "amazon", status: status, activeLink: "https://www.amazon.com/gp/css/order-history?ref_=nav_AccountFlyout_orders"});
	});
}

function grabVendors(callback) {
	clearbit(function(resp) {
		callback({txt: "@vendor_uploaded", vendor: "clearbit", status: resp, activeLink: "https://dashboard.clearbit.com"});
	});
	unbounce(function(resp) {
		callback({txt: "@vendor_uploaded", vendor: "unbounce", status: resp, activeLink: "https://app.unbounce.com/"});
	});
	hotjar(function(resp) {
		callback({txt: "@vendor_uploaded", vendor: "hotjar", status: resp, activeLink: "https://insights.hotjar.com"});
	});
}
// Action with popup =====================================
let popupPort, capturePort;
chrome.extension.onConnect.addListener(function(port) {

	if(port.name == 'popup.js <-> background.js') {
		popupPort = port;
	} else if(port.name == 'capture.js <-> background.js') {
		capturePort = port;
	}

	port.onMessage.addListener(function(msg) {
		console.log('msg: ', msg);
		switch(msg.txt) {
			case "@LoadVendorsState":
				checkVendorsStatus(function(event) {
					popupPort.postMessage(event);
				});
			break;
			case "@StartGrab":
				// grabVendors(function(event) {
				// 	popupPort.postMessage(event);
				// });
				// specials which can't be access content from background. like amazon.com
				amazon();
			break;
			case "@Capture_capturedImage":
				amazonToServer(msg.file, function(event) {
					popupPort.postMessage(event);
				});
			break;
		}
			 
	});
})


function amazonToServer(file, callback) {
	if(!file.blobLink) {
		callback({txt: "@vendor_uploaded", vendor: "amazon", status: {status: false, txt: "should login!"}, activeLink: "https://www.amazon.com/gp/css/order-history?ref_=nav_AccountFlyout_orders"});
	}
	let http = new XMLHttpRequest();
	http.responseType = "blob";
	http.open("GET", file.blobLink);
	http.send();
	http.onerror = () => console.error('error');
	http.onload = () => {
		postToServer({info: file.name, blob: http.response}, function(resp) {
			callback({txt: "@vendor_uploaded", vendor: "amazon", status: resp, activeLink: "https://www.amazon.com/gp/css/order-history?ref_=nav_AccountFlyout_orders"});
		});
	}
}
