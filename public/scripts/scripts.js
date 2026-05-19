// Zentrale Datenstruktur für die Erstellung
let currentObject = {
	id: "",
	name: "",
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

// Objekt Configuration Dialog
function objectConfigDialog() {
	const modal = document.getElementById("objectConfigDialog");
	const submit = document.getElementById("objectSubmitBtn");

	// Felder leeren
	document.getElementById('objectName').value = '';
	document.getElementById('objectPurchaseDate').value = '';

	modal.showModal();

	submit.onclick = () => {
		//aktielle werte 
		currentObject.name = document.getElementById('objectName').value;
		currentObject.date = document.getElementById('objectPurchaseDate').value;

		// zu overview hinzufügen
		modal.close();
		updateOverviewUI();
		createdObjectOverviewDialog();
	};
}
// Zusammenfassung des erstellten Objekts
function createdObjectOverviewDialog() {
	const modal = document.getElementById("createdObjectOverviewDialog");
	const closeBtn = document.getElementById("closeCreatedObjectOverviewBtn");

	modal.showModal();

	closeBtn.onclick = () => {
		modal.close();
	};
}


async function showTable() {
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
	// nur daten werden benötigt
	const dataArray = jsonData.data; 

	// Spaltenname aus erstem datan array holen
	const columnName = Object.keys(dataArray[0]);
	
	//kopfzeile
	columnName.forEach(generateColumn);

	// erstellt die Spalten
	function generateColumn(key) {
		const th = document.createElement('th');
		th.innerText = key;
		tableHead.appendChild(th);
	}
		
	// datennzeile
	dataArray.forEach(function(entry) {
		const tr = document.createElement('tr');
		columnName.forEach(function(key) {
			generateCell(key, entry, tr);
		});
		tableData.appendChild(tr);
	});
	
	// Erstellt die Zellen
	function generateCell(key, entry, tr) {
		const td = document.createElement('td');
		td.innerHTML = entry[key];
		tr.appendChild(td);
	}
}