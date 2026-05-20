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
let scannedBarcodeReturn = "";
let scannedBarcodeBorrow = "";

// --- Hilfsfunktionen & UI-Aktualisierung ---
function updateOverviewUI() {
	const idDisplay = document.getElementById("objectID"); //vergleicvht angezeigte id mit gespeicherter 
	const overviewIdEl = document.getElementById("objectOverviewID");
	const overviewNameEl = document.getElementById("objectOverviewName");
	const overviewTypeEl = document.getElementById("objectOverviewType");
	const overviewDateEl = document.getElementById("objectOverviewPurchaseDate");
	if (idDisplay) idDisplay.value = currentObject.id;
	if (overviewIdEl) overviewIdEl.innerHTML = "ID: " + currentObject.id;
	if (overviewNameEl) overviewNameEl.innerHTML = "Name: " + currentObject.name;
	if (overviewTypeEl) overviewTypeEl.innerHTML = "Typ: " + (currentObject.typName);
	if (overviewDateEl) overviewDateEl.innerHTML = "Anschaffungsdatum: " + currentObject.date;
}

// --- Objekterstellung & Barcode-Eingabe ---
let scannerBuffer = "";

window.addEventListener('keydown', (e) => {
	const objModal = document.getElementById('objectCreateScanBarcodeDialog');
	const borrowModal = document.getElementById('borrowScanBarcodeDialog');
	const returnModal = document.getElementById('returnScanBarcodeDialog');

	const anyOpen = (objModal && objModal.open) || (borrowModal && borrowModal.open) || (returnModal && returnModal.open);
	if (!anyOpen) return;

	if (e.key === 'Enter') {
		if (scannerBuffer.length === 0) return;

		currentObject.id = scannerBuffer;
		scannerBuffer = "";

		if (objModal && objModal.open) {
			objModal.close();
			updateOverviewUI();
			objectConfigDialog();
			return;
		}

		if (borrowModal && borrowModal.open) {
			borrowModal.close();
			borrowDialog();
			return;
		}

		if (returnModal && returnModal.open) {
			returnModal.close();
			returnDialog();
			return;
		}
	} else {
		if (e.key.length === 1) {
			scannerBuffer += e.key;
		}
	}
});

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

// --- Objekt-Konfiguration & Speichern ---

async function loadWerkzeugTypen() {
	const typeSelect = document.getElementById("objectTypeSelect");

	typeSelect.innerHTML = "";

	const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=werkzeug_typen");
	const jsonData = await answer.json();

	jsonData.data.forEach(function (typ) {
		const option = document.createElement("option");
		option.value = typ.Typ_ID;
		option.innerText = typ.Typ;
		typeSelect.appendChild(option);
	});
}

async function loadMitarbeiter() {
	const borrowerSelect = document.getElementById("borrowerIdSelect");
	
	borrowerSelect.innerHTML = ""; 

	const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=mitarbeiter");
	const jsonData = await answer.json();

	jsonData.data.forEach(function (typ) {
		const option = document.createElement("option");		
		option.value = typ.Mitarbeiter_ID; 		
		option.innerText = typ.Vorname + " " + typ.Nachname;
		borrowerSelect.appendChild(option);
	});
}

async function saveNewObject() {
	const payload = {
		barcode: currentObject.id,
		bezeichnung: currentObject.name,
		typ_id: currentObject.typId,
		anschaffungsdatum: currentObject.date,
	};

	const response = await fetch("https://mhp.hallo123wert.de/api.php?resource=werkzeuge", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload)
	});

	const result = await response.json();

	if (result.success) {
		console.log("Erfolgreich angelegt:", result.message);
		showToast("Objekt erfolgreich angelegt!");
		if (typeof showTableOnLoad === "function") showTableOnLoad();
		return true;
	} else {
		alert("Fehler beim Anlegen: " + result.error );
		return false;
	}

	return false;
}

// Objekt Configuration Dialog
function objectConfigDialog() {
	const modal = document.getElementById("objectConfigDialog");
	const submit = document.getElementById("objectSubmitBtn");
	// Felder leeren
	const objectNameEl = document.getElementById('objectName');
	const purchaseDateEl = document.getElementById('objectPurchaseDate');
	const typeSelect = document.getElementById('objectTypeSelect');
	objectNameEl.value = '';
	purchaseDateEl.value = '';

	loadWerkzeugTypen();

	function validateObjectForm() {
		const nameSet = objectNameEl.value && objectNameEl.value.trim().length > 0;
		const barcodeSet = currentObject.id && currentObject.id.length > 0;
		submit.disabled = !(nameSet && barcodeSet);
	}

	objectNameEl.addEventListener('input', validateObjectForm);
	validateObjectForm(); // initiale Validierung

	modal.showModal();

	submit.onclick = async () => {
		// aktuelle Werte übernehmen
		currentObject.name = objectNameEl.value;
		currentObject.date = purchaseDateEl.value;
		currentObject.typId = typeSelect.value;
		currentObject.typName = typeSelect.options[typeSelect.selectedIndex].text;

		modal.close();

		const saveSucceeded = await saveNewObject();
		if (!saveSucceeded) {
			return;
		}

		// zu overview hinzufügen
		const barcodeImg = document.getElementById("barcodeimg");
		barcodeImg.src = `https://mhp.hallo123wert.de/api.php?resource=barcode&code=${encodeURIComponent(currentObject.id)}`;

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

// --- Tabellen-Anzeige & Daten-Abruf ---

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
		columnName.forEach(function (key, index) {
			generateColumn(key, index);
		});

		// erstellt die Spalten inklusive Suchfeld
		// erstellt die Spalten inklusive Suchfeld und Sortierfunktion
		function generateColumn(key, index) {
			const th = document.createElement('th');

			// Container für Text und Sortier-Pfeil erstellen
			const headerDiv = document.createElement('div');
			headerDiv.style.cursor = 'pointer'; // Zeigt beim Drüberfahren eine Hand (Klickbar)
			headerDiv.style.display = 'flex';
			headerDiv.style.justifyContent = 'space-between';
			headerDiv.style.alignItems = 'center';
			headerDiv.title = "Klicken zum Sortieren";

			// Der eigentliche Spaltenname
			const textSpan = document.createElement('span');
			textSpan.innerHTML = key;

			// Das Sortier-Icon (Standard: ↕)
			const sortIcon = document.createElement('span');
			sortIcon.innerHTML = ' ↕'; 
			sortIcon.className = 'sort-icon';

			// Elemente zusammenfügen
			headerDiv.appendChild(textSpan);
			headerDiv.appendChild(sortIcon);

			// Klick-Event für die Sortierung hinzufügen
			headerDiv.onclick = () => sortTable(index, th);

			th.appendChild(headerDiv);
			th.appendChild(document.createElement('br'));

			// input erstellen fürs Filtern (bleibt wie vorher)
			const input = document.createElement('input');
			input.type = 'text';
			input.placeholder = "filtern...";
			input.addEventListener('input', filterTable);

			th.appendChild(input);
			tableHead.appendChild(th);
		}

		// datennzeile
		dataArray.forEach(function (entry) {
			const tr = document.createElement('tr');
			columnName.forEach(function (key) {
				generateCell(key, entry, tr);
			});
			tableData.appendChild(tr);
		});

		// Erstellt die Zellen
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
// --- Tabellen Sortierfunktion ---
function sortTable(columnIndex, thElement) {
	const tableData = document.getElementById("tableData");
	// Holt alle Tabellenzeilen und wandelt sie in ein Array um
	const rows = Array.from(tableData.getElementsByTagName("tr"));

	// Überprüfen, ob wir gerade aufsteigend (asc) oder absteigend (desc) sortieren sollen
	let isAscending = thElement.getAttribute("data-sort") !== "asc";

	// Alle Icons in der Kopfzeile wieder auf Standard (↕) zurücksetzen
	const allThs = document.getElementById("headerRow").getElementsByTagName("th");
	for (let th of allThs) {
		th.removeAttribute("data-sort");
		const icon = th.querySelector('.sort-icon');
		if (icon) icon.innerHTML = ' ↕';
	}

	// Neue Sortierrichtung speichern und das passende Icon anzeigen (↓ oder ↑)
	thElement.setAttribute("data-sort", isAscending ? "asc" : "desc");
	const currentIcon = thElement.querySelector('.sort-icon');
	currentIcon.innerHTML = isAscending ? ' ↑' : ' ↓';

	// Zeilen sortieren
	rows.sort((rowA, rowB) => {
		// Den Text aus den jeweiligen Spalten auslesen
		const cellA = rowA.getElementsByTagName("td")[columnIndex].innerText.trim();
		const cellB = rowB.getElementsByTagName("td")[columnIndex].innerText.trim();

		// Versuchen, die Werte als Zahlen zu interpretieren (wichtig für IDs oder Ausleihdauer)
		const numA = parseFloat(cellA);
		const numB = parseFloat(cellB);

		// Wenn beides gültige Zahlen sind, numerisch sortieren (1, 2, 10 statt 1, 10, 2)
		if (!isNaN(numA) && !isNaN(numB)) {
			return isAscending ? numA - numB : numB - numA;
		}

		// Ansonsten alphabetisch (Text) sortieren
		return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
	});

	// Die sortierten Zeilen wieder in die Tabelle einhängen (das verschiebt sie im HTML)
	rows.forEach(row => tableData.appendChild(row));
}
async function showTableOnLoad() {
	const typeSelect = document.getElementById("typeSelect");
	//setzt kategorie auf werkzeuge
	typeSelect.value = "werkzeuge";

	await showTable();
}

// --- Ausleihe (Borrow) ---
function borrowDialog() {
	const modal = document.getElementById("borrowDialog");
	const submitBtn = document.getElementById("borrowSubmitBtn");
	console.log("Ausleihe dialog"); // Debug-Ausgabe
	document.getElementById("borrowBarcode").value = currentObject.id;
	document.getElementById("borrowDuration").value = "";

 	loadMitarbeiter();

	const durationInput = document.getElementById("borrowDuration");
	const borrowerSelect = document.getElementById("borrowerIdSelect");

	function validateBorrowForm() {
		const duration = parseInt(durationInput.value) || 0;
		const borrower = parseInt(borrowerSelect.value) || 0;
		const barcodeSet = currentObject.id && currentObject.id.length > 0;
		submitBtn.disabled = !(barcodeSet && duration > 0 && borrower > 0);
	}

	durationInput.addEventListener('input', validateBorrowForm);
	borrowerSelect.addEventListener('change', validateBorrowForm);
	validateBorrowForm(); // initiale Validierung

	modal.showModal();

	submitBtn.onclick = () => {
		console.log("submit btn clicked"); // Debug-Ausgabe
		transmitBorrowData();
		modal.close();

	};
}

function borrowScanDialog() {
	const modal = document.getElementById("borrowScanBarcodeDialog");
	const closeBtn = document.getElementById("closeBorrowScanBtn");
	scannedBarcodeBorrow = "";
	modal.showModal();

	closeBtn.onclick = () => {
		modal.close();
	};
}

// --- Daten an Server senden ---
async function transmitBorrowData() {
	console.log("Ausleihe des Objekts mit ID: " + currentObject.id + " für Dauer: " + document.getElementById("borrowDuration").value + " Tage und Rückgabedatum: " + document.getElementById("borrowDuration").value);
	const borrowDuration = document.getElementById("borrowDuration").value;
	const mitarbeiterId = document.getElementById("borrowerIdSelect").value;
	console.log("Barcode: " + currentObject.id + ", Dauer: " + borrowDuration + ", Mitarbeiter: " + mitarbeiterId); // Debug-Ausgabe

	const payload = {
		barcode: currentObject.id,
		ausleihdauer: borrowDuration,
		mitarbeiter_id: mitarbeiterId,
	};

	const response = await fetch("https://mhp.hallo123wert.de/api.php?resource=ausleihen", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload)
	});

	//überpfrungslogik für popup

	const result = await response.json();

	if (result.success) {
		console.log("Erfolgreich ausgeliehen:", result.message);
		showToast("Objekt erfolgreich ausgeliehen!");
		if (typeof showTableOnLoad === "function") showTableOnLoad();
	} else {
		alert("Fehler beim Ausleihen: " + result.error + "\nMöglicherweise ist das Objekt mit der Barcodenummer :\n" + currentObject.id + " \nnicht exestent , bereits ausgeliehen oder es waren nicht alle Daten korrekt eingegeben.");
	}
}

// --- Rückgabe (Return) ---

function returnDialog() {
	const modal = document.getElementById("returnDialog");
	const returnSubmitBtn = document.getElementById("returnSubmitBtn");
	console.log("Rückgabe dialog"); // Debug-Ausgabe
	document.getElementById("returnBarcode").value = currentObject.id;
	document.getElementById("returnCondition").value = "";
	const submitBtn = document.getElementById("returnSubmitBtn");

	function validateReturnForm() {
		const cond = document.getElementById('returnCondition').value || '';
		const barcodeSet = currentObject.id && currentObject.id.length > 0;
		submitBtn.disabled = !(barcodeSet && cond.trim().length > 0);
	}

	document.getElementById('returnCondition').addEventListener('input', validateReturnForm);
	validateReturnForm(); // initiale Validierung

	modal.showModal();


	returnSubmitBtn.onclick = () => {
		returnObject();
		modal.close();
	};
}

function returnScanDialog() {
	const modal = document.getElementById("returnScanBarcodeDialog");
	const closeBtn = document.getElementById("closeReturnScanBtn");
	scannedBarcodeReturn = "";
	modal.showModal();

	closeBtn.onclick = () => {
		modal.close();
	};
}

async function returnObject() {
	console.log("Rückgabe des Objekts mit ID: " + currentObject.id + " und Zustand: " + document.getElementById("returnCondition").value);

	const payload = {
		barcode: currentObject.id,
		zustand: document.getElementById("returnCondition").value
	};

	const response = await fetch("https://mhp.hallo123wert.de/api.php?resource=abgeben", {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload)
	});
	//überpfrungslogik für popup
	const result = await response.json();

	if (result.success) {
		console.log("Objekt erfolgreich zurückgegeben:", result.message);
		showToast("Objekt erfolgreich zurückgegeben!");
		if (typeof showTableOnLoad === "function") showTableOnLoad();
	} else {
		alert("Fehler bei der Rückgabe: " + result.error + "\nMöglicherweise ist das Objekt mit der Barcodenummer :\n" + currentObject.id + " \nnicht exestent oder es waren nicht alle Daten korrekt eingegeben.");
	}
}

//allgemeine popup funktioen für das erfolgreich durchführen einer aktion 
function showToast(message) {
	const toast = document.getElementById("toast");
	toast.textContent = message;
	toast.classList.add("show");

	// Nach 3 Sekunden verschwindet das Popup automatisch wieder
	setTimeout(() => {
		toast.classList.remove("show");
	}, 3000);
}

function showCreateWorkerDialog() {
	const modal = document.getElementById("createWorkerDialog");
	const closeBtn = document.getElementById("closeBtnWorker");
	modal.showModal();

	closeBtn.onclick = () => {
		modal.close();
	};
}
// --- Bilder Toggle Funktion ---
function toggleImages() {
    const gallery = document.getElementById("imageGallery");
    const btn = document.getElementById("toggleImagesBtn");
    
    // Schaltet die 'show'-Klasse an oder aus
    gallery.classList.toggle("show");
    
    // Ändert den Text des Buttons je nach Zustand
    if (gallery.classList.contains("show")) {
        btn.innerText = "Certifikate ausblenden";
    } else {
        btn.innerText = "Certifikate anzeigen";
    }
}