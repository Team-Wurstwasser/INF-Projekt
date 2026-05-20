// Zentrale Datenstruktur für die Erstellung
let currentObject = {
	id: "",
	name: "",
	typId: "",
	statusId: "",
	date: ""
};

//barcode variable
let scannedBarcode = "";

// Hilfsfunktion zur UI-Aktualisierung
function updateOverviewUI() {
	const idDisplay = document.getElementById("objectID"); //vergleicvht angezeigte id mit gespeicherter 
	if (idDisplay) idDisplay.value = currentObject.id;

	document.getElementById("objectOverviewID").innerHTML = "ID: " + currentObject.id;
	document.getElementById("objectOverviewName").innerHTML = "Name: " + currentObject.name;
	document.getElementById("objectOverviewPurchaseDate").innerHTML = "Anschaffungsdatum: " + currentObject.date;
	
	

}

// event listener für barcode eingabe
window.addEventListener("keydown", (e) => {
	const modal = document.getElementById("objectCreateScanBarcodeDialog");

	if (modal && modal.open) {
		if (e.key === "Enter") {
			if (scannedBarcode.length > 0) {
				// Wert übertragen
				currentObject.id = scannedBarcode;
				scannedBarcode = "";

				// Dialog-Wechsel
				modal.close();
				updateOverviewUI();
				objectConfigDialog();
			}
		} else {
			// Dies hat in deinem Code gefehlt:
			// Nur Zeichen der Länge 1 hinzufügen (verhindert 'Shift', 'Control' etc.)
			if (e.key.length === 1) {
				scannedBarcode += e.key;
			}
		}
	}
});

//funktionen Dialoge

//1. Selection zwischen scan barcode und manuelle eingabe

function objectCreationMethodSelectionDialog() {
	const modal = document.getElementById("objectCreationMethodSelectionDialog");
	const scannerModeBtn = document.getElementById("scannerMode");
	const manualModeBtn = document.getElementById("manualMode");
	const closeBtn = document.getElementById("closeBtn");
	modal.showModal();

	closeBtn.onclick = () => {
		modal.close();
	};

	scannerModeBtn.onclick = () => {
		modal.close();
		objectCreateScanBarcodeDialog();
	};

	manualModeBtn.onclick = () => {
		modal.close();
		getBarcode();
	};

}

async function getBarcode() {
	
		const response = await fetch(`https://mhp.hallo123wert.de/api.php?resource=barcode`);
		const jsonData = await response.json();

		const Barcode = jsonData.barcode;

		currentObject.id = Barcode;
		updateOverviewUI();
		objectConfigDialog();
}



// Scan Option 
function objectCreateScanBarcodeDialog() {
	const modal = document.getElementById("objectCreateScanBarcodeDialog");
	const closeBtn1 = document.getElementById("closeBtn1");
	console.log("Scanned Barcode: " + scannedBarcode); // Debug-Ausgabe
	scannedBarcode = ""; // Reset barcode beim Öffnen
	modal.showModal();


	closeBtn1.onclick = () => {
		modal.close();
	};

}

// manuelle erstellung eines barcodes option
function barcodeCreateDialog() {
	const modal = document.getElementById("objectCreateBarcodeCreationDialog");
	const proceed = document.getElementById("objectManualProceed");

	document.getElementById('manualBarcodeInput').value = ''; //clear bei widereingabe
	modal.showModal();

	proceed.onclick = () => {
		// barcode ins config feld rein
		currentObject.id = document.getElementById('manualBarcodeInput').value; //erstellung eines barcodes dafür die ID

		modal.close();
		updateOverviewUI();
		objectConfigDialog();
	};
}

async function loadWerkzeugTypen() {
    const typeSelect = document.getElementById("objectTypeSelect");

    typeSelect.innerHTML = "";

    const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=werkzeug_typen");
    const jsonData = await answer.json();

	jsonData.data.forEach(function(typ) {
    	const option = document.createElement("option");
    	option.value = typ.Typ_ID; 
    	option.innerText = typ.Typ; 
    	typeSelect.appendChild(option);
	});
}

async function loadWerkzeugStatus() {
    const statusSelect = document.getElementById("objectStatusSelect");

    statusSelect.innerHTML = "";

    const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=status");
    const jsonData = await answer.json();

	jsonData.data.forEach(function(typ) {
    	const option = document.createElement("option");
    	option.value = typ.Status_ID; 
    	option.innerText = typ.Bezeichnung; 
    	statusSelect.appendChild(option);
	});
}

async function saveNewObject() {
    const payload = {
        barcode: currentObject.id,
        bezeichnung: currentObject.name,
        typ_id: currentObject.typId,
        anschaffungsdatum: currentObject.date,
        status_id: currentObject.statusId
    };

    await fetch("https://mhp.hallo123wert.de/api.php?resource=werkzeuge", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
}

// Objekt Configuration Dialog
function objectConfigDialog() {
	const modal = document.getElementById("objectConfigDialog");
	const submit = document.getElementById("objectSubmitBtn");

	// Felder leeren
	document.getElementById('objectName').value = '';
	document.getElementById('objectPurchaseDate').value = '';

	loadWerkzeugTypen();
	loadWerkzeugStatus();

	modal.showModal();

	submit.onclick = () => {
		//aktielle werte 
		currentObject.name = document.getElementById('objectName').value;
		currentObject.date = document.getElementById('objectPurchaseDate').value;
		currentObject.typId = document.getElementById('objectTypeSelect').value;
		currentObject.statusId = document.getElementById('objectStatusSelect').value;

		saveNewObject();

		// zu overview hinzufügen
		const barcodeImg = document.getElementById("barcodeimg");

    	barcodeImg.src = `https://mhp.hallo123wert.de/api.php?resource=barcode&code=${encodeURIComponent(currentObject.id)}`;

		modal.close();
		updateOverviewUI();
		createdObjectOverviewDialog();
		
	};
}

// Zusammenfassung des erstellten Objekts
function createdObjectOverviewDialog() {
	const modal = document.getElementById("createdObjectOverviewDialog");
	const closeBtn = document.getElementById("closeCreatedObjectOverviewBtn");
	const downloadBtn = document.getElementById("downloadBarcodeBtn");

	modal.showModal();

	// Download logik fur download
	downloadBtn.onclick = async () => {
		const imageUrl = document.getElementById("barcodeimg").src;
		const response = await fetch(imageUrl);
		const blob = await response.blob();

		const link = document.createElement("a");
		link.href = URL.createObjectURL(blob);
		link.download = `barcode_${currentObject.id}.png`;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	closeBtn.onclick = () => {
		modal.close();
	};
}
// zeigt tabelle an
async function showTable() {
	// wartenachricht
	const message = document.getElementById("WaitingMessage");
	message.innerHTML = "Tabelle wird geladen...";

	const select = document.getElementById("typeSelect").value;
	const tableHead = document.getElementById("headerRow");
	const tableData = document.getElementById("tableData");
	
	// Tabelle leeren
	tableHead.innerHTML = "";
	tableData.innerHTML = "";
	
	// aufrufen der API
	const answer = await fetch(`https://mhp.hallo123wert.de/api.php?resource=${select}`);
	//Antowrt für json lesbar machen
	const jsonData = await answer.json();

	// falls api fehler zurückgibt
	if (jsonData.success == false) {
		message.innerHTML = "Fehler: " + jsonData.error;
		return;
	}

	// nur daten werden benötigt
	const dataArray = jsonData.data; 

	if (dataArray && dataArray.length > 0) {
		// Spaltenname aus erstem datan array holen
		const columnName = Object.keys(dataArray[0]);
		
		message.innerHTML = "";

		// kopfzeile mit Index für den Filter
		columnName.forEach(function(key, index) {
			generateColumn(key, index);
		});

		// erstellt die Spalten inklusive Suchfeld
		function generateColumn(key, index) {
			const th = document.createElement('th');
			
			// eingeabefeld erstellen
			th.innerHTML = `${key}<br>`;
			
			// input erstellen
			const input = document.createElement('input');
			input.type = 'text';
			input.placeholder = "filtern...";
			
			// eventlistener fürs filtern
			input.addEventListener('input', filterTable);
			
			th.appendChild(input);
			tableHead.appendChild(th);
		}
			
		// datenzeile
		dataArray.forEach(function(entry) {
			const tr = document.createElement('tr');
			columnName.forEach(function(key) {
				generateCell(key, entry, tr);
			});
			tableData.appendChild(tr);
		});
		
		// erstellt zellen
		function generateCell(key, entry, tr) {
			const td = document.createElement('td');

			// prüft ob spaltenname barcode enthält
			if (key.toLowerCase() === 'barcode') {
				const barcodeValue = entry[key];
				td.innerHTML = `<a href="https://mhp.hallo123wert.de/api.php?resource=barcode&code=${encodeURIComponent(barcodeValue)}" target="_blank">${barcodeValue}</a>`;
			} else {
				td.innerHTML = entry[key];
			}

			tr.appendChild(td);
		}
	} else {
		message.innerHTML = "Keine Daten vorhanden!";
	}
}
// filtern
function filterTable() {
	const tableHead = document.getElementById("headerRow");
	const tableData = document.getElementById("tableData");
	
	// inputs von kopfzeile
	const inputs = tableHead.getElementsByTagName("input");
	// datenzeilen abfragen
	const rows = tableData.getElementsByTagName("tr");

	for (let i = 0; i < rows.length; i++) {
		//holt daten aus einer zeile
		const cells = rows[i].getElementsByTagName("td");
		let showRow = true;

		// spalte für spalte durchgehen
		for (let j = 0; j < inputs.length; j++) {
			//einagbe spechern in klein
			const filterValue = inputs[j].value.toLowerCase();
			
			if (filterValue && cells[j]) {
				//daten in zelle
				const cellText = cells[j].innerHTML;
				// macht zelltext klein und vergleicht, -1 is ungleich
				if (cellText.toLowerCase().indexOf(filterValue) == -1) {
					showRow = false;
					break;
				}
			}
		}
		// zelle anzeingen oder nicht
		if (showRow === true) {
			rows[i].style.display = "";	//zeigt zelle an, none wird entfernt fals da war
		} else {
			rows[i].style.display = "none"; //zeigt zelle nicht an
		}
	}
}
async function showTableOnLoad() {
	// wartenachricht
	const message = document.getElementById("WaitingMessage");
	message.innerHTML = "Tabelle wird geladen...";

	const tableHead = document.getElementById("headerRow");
	const tableData = document.getElementById("tableData");
	
	
	// aufrufen der API
	const answer = await fetch(`https://mhp.hallo123wert.de/api.php?resource=werkzeuge`);
	//Antowrt für json lesbar machen
	const jsonData = await answer.json();

	// falls api fehler zurückgibt
	if (jsonData.success == false) {
		message.innerHTML = "Fehler: " + jsonData.error;
		return;
	}

	// nur daten werden benötigt
	const dataArray = jsonData.data; 

	if (dataArray && dataArray.length > 0) {
		// Spaltenname aus erstem datan array holen
		const columnName = Object.keys(dataArray[0]);
		
		message.innerHTML = "";

		// kopfzeile mit Index für den Filter
		columnName.forEach(function(key, index) {
			generateColumn(key, index);
		});

		// erstellt die Spalten inklusive Suchfeld
		function generateColumn(key, index) {
			const th = document.createElement('th');
			
			// eingeabefeld erstellen
			th.innerHTML = `${key}<br>`;
			
			// input erstellen
			const input = document.createElement('input');
			input.type = 'text';
			input.placeholder = "filtern...";
			
			// eventlistener fürs filtern
			input.addEventListener('input', filterTable);
			
			th.appendChild(input);
			tableHead.appendChild(th);
		}
			
		// datenzeile
		dataArray.forEach(function(entry) {
			const tr = document.createElement('tr');
			columnName.forEach(function(key) {
				generateCell(key, entry, tr);
			});
			tableData.appendChild(tr);
		});
		
		// erstellt zellen
		function generateCell(key, entry, tr) {
			const td = document.createElement('td');

			// prüft ob spaltenname barcode enthält
			if (key.toLowerCase() === 'barcode') {
				const barcodeValue = entry[key];
				td.innerHTML = `<a href="https://mhp.hallo123wert.de/api.php?resource=barcode&code=${encodeURIComponent(barcodeValue)}" target="_blank">${barcodeValue}</a>`;
			} else {
				td.innerHTML = entry[key];
			}

			tr.appendChild(td);
		}
	} else {
		message.innerHTML = "Keine Daten vorhanden!";
	}
}

function borrowDialog() {
	const modal = document.getElementById("borrowDialog");
	const submitBtn = document.getElementById("borrowSubmitBtn");
	console.log("Ausleihe dialog"); // Debug-Ausgabe
	modal.showModal();

	submitBtn.onclick = () => {
		modal.close();
	};

}

function returnDialog() {
	const modal = document.getElementById("returnDialog");
	const submitBtn = document.getElementById("returnSubmitBtn");
	console.log("Rückgabe dialog"); // Debug-Ausgabe
	modal.showModal();

	submitBtn.onclick = () => {
		modal.close();
	};

}

function returnDialog() {
	const modal = document.getElementById("returnDialog");
	const closeBtn3 = document.getElementById("closeBtn3");
	console.log("Rückgabe dialog"); // Debug-Ausgabe
	modal.showModal();


	closeBtn3.onclick = () => {
		modal.close();
	};

}
