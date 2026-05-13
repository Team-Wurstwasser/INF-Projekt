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

//barcode variable
let scannedBarcode = "";

// event listener für barcode eingabe
window.addEventListener("keydown", (e) => {
	const modal = document.getElementById("objectCreateDialog");

	
	if (modal && modal.open) {
		if (e.key === "Enter") {
			if (scannedBarcode.length > 0) {
				// Wert übertragen
				document.getElementById("objectID").value = scannedBarcode;
				scannedBarcode = "";

				// Dialog-Wechsel
				modal.close();
				objectConfigDialog();
			}
		}
	}
});

function objectCreateDialog() {
	const modal = document.getElementById("objectCreateDialog");
	const closeBtn = document.getElementById("closeBtn");
	const manualBtn = document.getElementById("manualBarcodeBtn");

	scannedBarcode = ""; // Reset barcode beim Öffnen
	modal.showModal();

	
	closeBtn.onclick = () => { 
		modal.close(); 
	};

	manualBtn.onclick = () => {
		modal.close();
		manualBarcodeDialog();
	};
}

//manuelle eingabe des barcodes / erstellung eines neues 
function manualBarcodeDialog() {
	const modal = document.getElementById("objectCreateDialogManualBarcode");
	const proceed = document.getElementById("objectManualProceed");

	document.getElementById('manualBarcodeInput').value = ''; //clear bei widereingabe
	modal.showModal();

	proceed.onclick = () => {
		// barcode ins config feld rein
		const barcodeID = document.getElementById('manualBarcodeInput').value; //erstellung eines barcodes dafür die ID
		document.getElementById("objectID").value = barcodeID;

		modal.close();
		objectConfigDialog();
	};
}

//letztes fenster Objekt config
function objectConfigDialog() {
	const modal = document.getElementById("objectConfigDialog");
	const submit = document.getElementById("objectSubmitBtn");

	// Felder leeren
	document.getElementById('objectName').value = '';
	document.getElementById('objectPurchaseDate').value = '';

	modal.showModal();

	submit.onclick = () => {
		modal.close();
	};
}