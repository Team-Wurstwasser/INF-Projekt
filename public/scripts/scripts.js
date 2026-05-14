function zeileHinzufuegen() {

	let tabelle = document.getElementById("objektTabelle");

	let neueZeile = tabelle.insertRow();

	let zelle1 = neueZeile.insertCell(0);
	let zelle2 = neueZeile.insertCell(1);
	let zelle3 = neueZeile.insertCell(2);
	let zelle4 = neueZeile.insertCell(3);
	let zelle5 = neueZeile.insertCell(4);
	let zelle6 = neueZeile.insertCell(5);
	let zelle7 = neueZeile.insertCell(6);
	let zelle8 = neueZeile.insertCell(7);
	let zelle9 = neueZeile.insertCell(8);

	zelle1.innerHTML = 'object';
	zelle2.innerHTML = '<input type="Objekt" placeholder="Name">';
	zelle3.innerHTML = '<input type="number" placeholder="ID">';
	zelle4.innerHTML = '<input type="text" placeholder="Modell">';
	zelle5.innerHTML = '<input type="text" placeholder="Hersteller">';
	zelle6.innerHTML = '<input type="number" placeholder="Raum">';
	zelle7.innerHTML = '<input type="number" placeholder="Anzahl">';
	zelle8.innerHTML = '<input type="number" placeholder="Status">';

	zelle9.innerHTML =
		'<button onclick="dieseZeileLoeschen(this)">Löschen</button>';
}

function dieseZeileLoeschen(button) {

	let zeile = button.parentNode.parentNode;

	zeile.remove();
}

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
		barcodeCreateDialog();
	};

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