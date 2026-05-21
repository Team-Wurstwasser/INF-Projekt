// Zentrale Datenstruktur für die Erstellung
let currentObject = {
	id: "",
	name: "",
	typId: "",
	statusId: "",
	date: ""
};

let currentAusleihe = null;

// --- Hilfsfunktionen & UI-Aktualisierung ---
function updateOverviewUI() {
	const idDisplay = document.getElementById("objectID"); //vergleicvht angezeigte id mit gespeicherter 
	const overviewId = document.getElementById("objectOverviewID");
	const overviewName = document.getElementById("objectOverviewName");
	const overviewType = document.getElementById("objectOverviewType");
	const overviewDate = document.getElementById("objectOverviewPurchaseDate");
	if (idDisplay) idDisplay.value = currentObject.id;
	if (overviewId) overviewId.innerHTML = "ID: " + currentObject.id;
	if (overviewName) overviewName.innerHTML = "Name: " + currentObject.name;
	if (overviewType) overviewType.innerHTML = "Typ: " + (currentObject.typName);
	if (overviewDate) overviewDate.innerHTML = "Anschaffungsdatum: " + currentObject.date;
}

function getBarcodeFromEntry(entry) {
	for (const k in entry) {
		if (k.toLowerCase().includes('barcode')) return entry[k];
	}
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
	console.log("Scanned Barcode: " + currentObject.id); // Debug-Ausgabe
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

async function loadAbteilungen() {
	const abteilungenSelect = document.getElementById("workerDepartmentSelect");
	
	abteilungenSelect.innerHTML = ""; 

	const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=abteilungen");
	const jsonData = await answer.json();

	jsonData.data.forEach(function (typ) {
		const option = document.createElement("option");
		option.value = typ.Abteilung_ID; 		
		option.innerText = typ.Name;
		abteilungenSelect.appendChild(option);
	});
}
// lädt alle typen
async function loadWerkzeugTypenInto(selectElement) {
	selectElement.innerHTML = "";
	const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=werkzeug_typen");
	const jsonData = await answer.json();
	jsonData.data.forEach(function (typ) {
		const option = document.createElement("option");
		option.value = typ.Typ_ID;
		option.innerText = typ.Typ;
		selectElement.appendChild(option);
	});
}

async function loadAbteilungenInto(selectElement) {
	selectElement.innerHTML = "";

	const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=abteilungen");
	const jsonData = await answer.json();

	jsonData.data.forEach(function (typ) {
		const option = document.createElement("option");
		option.value = typ.Abteilung_ID;
		option.innerText = typ.Name;
		selectElement.appendChild(option);
	});
}

// holt alle aktuellen status ab
async function loadStatus(selectElement) {
	selectElement.innerHTML = "";
	const answer = await fetch("https://mhp.hallo123wert.de/api.php?resource=status");
	const jsonData = await answer.json();
	jsonData.data.forEach(function (status) {
		const option = document.createElement("option");
		option.value = status.Status_ID;
		option.innerText = status.Bezeichnung;
		selectElement.appendChild(option);
	});
}

async function openAddTypeDialog() {
	let dialog = document.getElementById('addTypeDialog');

	// wartet auf userinput
	return new Promise((resolve) => {
		const input = dialog.querySelector("input#newTypeName");
		const saveBtn = dialog.querySelector("button#saveTypeBtn");
		const cancelBtn = dialog.querySelector("button#cancelAddTypeBtn");

		// cancel button
		input.value = '';
		if (cancelBtn) cancelBtn.onclick = () => {
			dialog.close();
			resolve(false);
		};

		// save button
		if (saveBtn) saveBtn.onclick = async () => {
			const typeName = input.value.trim();
			if (!typeName) {
				alert('Bitte einen Typ eingeben.');
				return;
			}
			// sendet typ an api
			const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=werkzeug_typen', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ art: typeName })
			});
			// schaut ob geklappt hat
			const result = await response.json();
			if (result.success) {
				if (typeof showToast === 'function') showToast('Typ hinzugefügt');
				dialog.close();
				resolve(true);
			} else {
				alert('Typ konnte nicht hinzugefügt werden: ' + (result.error || 'Unbekannter Fehler'));
			}
		};
		dialog.showModal();
	});
}

function openDeleteObjectDialog(entry) {
	const barcode = getBarcodeFromEntry(entry);
	let dialog = document.getElementById('deleteObjectDialog');

	const deleteBarcodeSpan = dialog.querySelector('#deleteBarcode');
	const deleteNameSpan = dialog.querySelector('#deleteName');
	const confirmBtn = dialog.querySelector('#confirmDeleteBtn');
	const cancelBtn = dialog.querySelector('#cancelDeleteBtn');

	deleteBarcodeSpan.textContent = barcode;
	deleteNameSpan.textContent = entry.Bezeichnung || '';

	cancelBtn.onclick = () => dialog.close();
	confirmBtn.onclick = async () => {
		// löscht objekt anhand barcode
		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=werkzeuge', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ barcode: barcode })
		});
		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Objekt gelöscht');
			dialog.close();
			showTable();
		} else {
			alert('Löschen fehlgeschlagen: ' + (result.error || 'Unbekannter Fehler'));
		}
	};

	dialog.showModal();
}

async function openEditWerkzeugDialog(entry) {
	let dialog = document.getElementById('editWerkzeugDialog');

	const barcodeSpan = dialog.querySelector('#editBarcode');
	const bezeichnungInput = dialog.querySelector('#editBezeichnung');
	const typeSelect = dialog.querySelector('#editTypeSelect');
	const statusSelect = dialog.querySelector('#editStatusSelect');
	const purchaseDateInput = dialog.querySelector('#editPurchaseDate');
	const saveBtn = dialog.querySelector('#saveEditBtn');
	const cancelBtn = dialog.querySelector('#cancelEditBtn');

	barcodeSpan.textContent = entry.Barcode;
	bezeichnungInput.value = entry.Bezeichnung;
	purchaseDateInput.value = entry.Anschaffungsdatum;

	//fragt aktuelle typen und statuse ab für alle optionen
	await loadWerkzeugTypenInto(typeSelect);
	await loadStatus(statusSelect);

	const addStatusBtn = document.getElementById('addStatusBtn');
	addStatusBtn.title = 'Neuen Status hinzufügen';
	addStatusBtn.onclick = async () => {
		await openAddStatusDialog();
		await loadStatus(statusSelect);
	};

	// set current selections if present
	typeSelect.value = entry.Typ_ID || '';
	statusSelect.value = entry.Status_ID || '';

	const validateForm = () => {
		const bezeichnungSet = bezeichnungInput.value && bezeichnungInput.value.trim().length > 0;
		if (saveBtn) saveBtn.disabled = !(bezeichnungSet);
	};

	bezeichnungInput.oninput = validateForm;
	typeSelect.onchange = validateForm;
	validateForm();

	cancelBtn.onclick = () => dialog.close();
	saveBtn.onclick = async () => {
		const payload = {
			barcode: entry.Barcode,
			bezeichnung: bezeichnungInput.value.trim(),
			typ_id: parseInt(typeSelect.value) || 0,
			status_id: parseInt(statusSelect.value) || 0,
			anschaffungsdatum: purchaseDateInput.value
		};
		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=werkzeuge', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Objekt aktualisiert');
			dialog.close();
			showTable();
		} else {
			alert('Aktualisierung fehlgeschlagen: ' + (result.error || 'Unbekannter Fehler'));
		}
	};

	dialog.showModal();
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
	const cancelBtn = document.getElementById("cancelObjectConfigBtn");
	// Felder leeren
	const objectName = document.getElementById('objectName');
	const purchaseDate = document.getElementById('objectPurchaseDate');
	const typeSelect = document.getElementById('objectTypeSelect');
	objectName.value = '';
	purchaseDate.value = '';

	loadWerkzeugTypen();

	const addTypeBtn = document.getElementById('addObjectTypeBtn');
	addTypeBtn.title = 'Neuen Typ hinzufügen';
	addTypeBtn.onclick = async () => {
		await openAddTypeDialog();
		await loadWerkzeugTypen();
	}

	function validateObjectForm() {
		const nameSet = objectName.value && objectName.value.trim().length > 0;
		const barcodeSet = currentObject.id && currentObject.id.length > 0;
		submit.disabled = !(nameSet && barcodeSet);
	}

	objectName.addEventListener('input', validateObjectForm);
	validateObjectForm(); // initiale Validierung

	modal.showModal();

	if (cancelBtn) {
		cancelBtn.onclick = () => {
			modal.close();
		};
	}

	submit.onclick = async () => {
		// aktuelle Werte übernehmen
		currentObject.name = objectName.value;
		currentObject.date = purchaseDate.value;
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

// tabelle anzeigen
async function showTable() {
	// wartenachricht
	const message = document.getElementById("WaitingMessage");
	message.innerHTML = "Tabelle wird geladen...";
	const select = document.getElementById("typeSelect").value;
	const tableHead = document.getElementById("headerRow");
	const tableData = document.getElementById("tableData");

	tableHead.innerHTML = "";
	tableData.innerHTML = "";
	
	// aufrufen der API
	const answer = await fetch(`https://mhp.hallo123wert.de/api.php?resource=${select}`);
	//Antowrt für json lesbar machen
	const jsonData = await answer.json();
	if (jsonData.success == false) {
		message.innerHTML = "Fehler: " + jsonData.error;
		return;
	}
	// nur daten werden benötigt
	const dataArray = jsonData.data;

	// prüfen ob daten da sind
	if (dataArray && dataArray.length > 0) {
		// überschriften für spalten aus erstem element holen
		let columnName = Object.keys(dataArray[0]);
		
		// ungewollte ids ausblenden
		if (select == "werkzeuge") {
			columnName = columnName.filter(column => column != 'Typ_ID' && column != 'Status_ID');
		} else if (select == "mitarbeiter") {
			columnName = columnName.filter(column => column != 'Mitarbeiter_ID');
		} else if (select == "abteilung") {
			columnName = columnName.filter(column => column != 'Abteilung_ID');
		}
		
		message.innerHTML = "";

		// kopfzeile
		columnName.forEach((key, index) => {
			generateColumn(key, index);
		});

		//erstellt seperate aktionsspalte
		if (select != "ausgeliehen" && select != "ausgeliehen_historie") {
			const th = document.createElement('th');
			th.innerText = "Aktion";
			tableHead.appendChild(th);
		}
		if (select == "ausgeliehen") {
			const th = document.createElement('th');
			th.innerText = "Verlängern";
			tableHead.appendChild(th);
		}

		// erstellt die Spalten
		function generateColumn(key, index) {
			const th = document.createElement('th');

			// kopfcontainer erstellen für titel und sortiericon
			const headerDiv = document.createElement('div');
			headerDiv.className = "sort-header";
			headerDiv.title = "sort";
			// header titel erstellen
			const headerTitle = document.createElement('span');
			headerTitle.innerHTML = key;
			// sortiericon erstellen
			const sortIcon = document.createElement('span');
			sortIcon.innerHTML = ' ↕'; 
			sortIcon.className = 'sort-icon';

			// elemente an container anhängen
			headerDiv.appendChild(headerTitle);
			headerDiv.appendChild(sortIcon);

			// onclick event für sortieren
			headerDiv.onclick = () => {
				sortTable(index, th);
			};
			th.appendChild(headerDiv);
			th.appendChild(document.createElement('br'));

			// input erstellen fürs filtern
			const input = document.createElement('input');
			input.type = 'text';
			input.placeholder = "filtern...";
			input.addEventListener('input', filterTable);

			th.appendChild(input);
			tableHead.appendChild(th);
		}

		// datennzeile
		dataArray.forEach((entry) => {
			const tr = document.createElement('tr');
			columnName.forEach((key) => {
				generateCell(key, entry, tr);
			});
			if (select == "ausgeliehen") {
				//verlängerungs erstellen
				const tdAction = document.createElement('td');
				const editBtn = document.createElement('button');
				editBtn.innerText = "Verlängern";
				editBtn.className = "table-action-button";
				editBtn.onclick = () => verlängernDialog(entry);
				tdAction.appendChild(editBtn);
				tr.appendChild(tdAction);
			}
			if (select != "ausgeliehen" && select != "ausgeliehen_historie") {
				//bearbeitungsbuton erstellen
				const tdAction = document.createElement('td');
				const editBtn = document.createElement('button');
				editBtn.innerText = "Bearbeiten";
				editBtn.className = "table-action-button";
				switch (select) {
					case "werkzeuge":
						const barcodeValue = getBarcodeFromEntry(entry);
						editBtn.onclick = () => openEditWerkzeugDialog(entry);
						break;
					case "mitarbeiter":
							editBtn.onclick = () => openEditMitarbeiterDialog(entry);
							break;
					case "abteilung":
							editBtn.onclick = () => openEditAbteilungDialog(entry);
							break;
					case "werkzeug_typen":
							editBtn.onclick = () => openEditWerkzeugTypDialog(entry);
							break;
					case "status":
							editBtn.onclick = () => openEditStatusDialog(entry);
							break;
				}

				//löschbutton erstellen
				const deleteBtn = document.createElement('button');
				deleteBtn.innerText = "Löschen";
				deleteBtn.className = "table-action-button";
				switch (select) {
					case "werkzeuge":
						deleteBtn.onclick = () => openDeleteObjectDialog(entry);
						break;
					case "mitarbeiter":
							deleteBtn.onclick = () => openDeleteMitarbeiterDialog(entry);
							break;
					case "abteilung":
							deleteBtn.onclick = () => openDeleteAbteilungDialog(entry);
							break;
					case "werkzeug_typen":
							deleteBtn.onclick = () => openDeleteWerkzeugTypDialog(entry);
							break;
					case "status":
							deleteBtn.onclick = () => openDeleteStatusDialog(entry);
							break;
				}
				tdAction.appendChild(editBtn);
				tdAction.appendChild(deleteBtn);
				tr.appendChild(tdAction);
			}

			tableData.appendChild(tr);
		});
		// Falls wir Werkzeuge anzeigen, noch eine Aktionsspalte anhängen
		function getBarcodeFromEntry(entry) {
			for (const e in entry) {
				if (e.toLowerCase().includes('barcode')) return entry[e];
			}
		}
		// Erstellt die Zellen
		function generateCell(key, entry, tr) {
			const td = document.createElement('td');

			// prüft ob spaltenname barcode enthält
			if (key.toLowerCase() == 'barcode') {
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

async function openAddAbteilungDialog() {
	let dialog = document.getElementById('addAbteilungDialog');

	// wartet auf userinput
	return new Promise((resolve) => {
		const input = dialog.querySelector("input#newAbteilungName");
		const saveBtn = dialog.querySelector("button#saveAbteilungBtn");
		const cancelBtn = dialog.querySelector("button#cancelAddAbteilungBtn");

		// cancel button
		input.value = '';
		if (cancelBtn) cancelBtn.onclick = () => {
			dialog.close();
			resolve(false);
		};

		// save button
		if (saveBtn) saveBtn.onclick = async () => {
			const name = input.value.trim();
			if (!name) {
				alert('Bitte einen Namen eingeben.');
				return;
			}

			// sendet abteilung an api
			const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=abteilungen', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});

			// schaut ob geklappt hat
			const result = await response.json();
			if (result.success) {
				if (typeof showToast === 'function') showToast('Abteilung hinzugefügt');
				dialog.close();
				resolve(true);
			} else {
				alert('Abteilung konnte nicht hinzugefügt werden: ' + (result.error || 'Unbekannter Fehler'));
			}
		};

		dialog.showModal();
	});
}

async function openAddStatusDialog() {
	let dialog = document.getElementById('addStatusDialog');

	return new Promise((resolve) => {
		const input = dialog.querySelector("input#newStatusName");
		const saveBtn = dialog.querySelector("button#saveStatusBtn");
		const cancelBtn = dialog.querySelector("button#cancelAddStatusBtn");

		input.value = '';
		if (cancelBtn) cancelBtn.onclick = () => {
			dialog.close();
			resolve(false);
		};

		if (saveBtn) saveBtn.onclick = async () => {
			const bezeichnung = input.value.trim();
			if (!bezeichnung) {
				alert('Bitte eine Bezeichnung eingeben.');
				return;
			}

			const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bezeichnung })
			});

			const result = await response.json();
			if (result.success) {
				if (typeof showToast === 'function') showToast('Status hinzugefügt');
				dialog.close();
				resolve(true);
			} else {
				alert('Status konnte nicht hinzugefügt werden: ' + (result.error || 'Unbekannter Fehler'));
			}
		};

		dialog.showModal();
	});
}

async function openEditMitarbeiterDialog(entry) {
	const dialog = document.getElementById('editMitarbeiterDialog');
	const idInput = dialog.querySelector('#editMitarbeiterId');
	const firstNameInput = dialog.querySelector('#editWorkerFirstName');
	const lastNameInput = dialog.querySelector('#editWorkerLastName');
	const emailInput = dialog.querySelector('#editWorkerEmail');
	const departmentSelect = dialog.querySelector('#editWorkerDepartmentSelect');
	const saveBtn = dialog.querySelector('#saveEditMitarbeiterBtn');
	const cancelBtn = dialog.querySelector('#cancelEditMitarbeiterBtn');

	idInput.value = entry.Mitarbeiter_ID || '';
	firstNameInput.value = entry.Vorname || '';
	lastNameInput.value = entry.Nachname || '';
	emailInput.value = entry.Email || '';

	await loadAbteilungenInto(departmentSelect);
	departmentSelect.value = entry.Abteilung || '';

	const validateForm = () => {
		const firstName = firstNameInput.value.trim().length > 0;
		const lastName = lastNameInput.value.trim().length > 0;
		const email = emailInput.value.trim().length > 0 && emailInput.checkValidity();
		saveBtn.disabled = !(firstName && lastName && email);
	};

	firstNameInput.oninput = validateForm;
	lastNameInput.oninput = validateForm;
	emailInput.oninput = validateForm;
	validateForm();

	cancelBtn.onclick = () => dialog.close();
	saveBtn.onclick = async () => {
		const payload = {
			mitarbeiter_id: parseInt(idInput.value) || 0,
			vorname: firstNameInput.value.trim(),
			nachname: lastNameInput.value.trim(),
			email: emailInput.value.trim(),
			abteilung_id: parseInt(departmentSelect.value) || 0
		};

		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=mitarbeiter', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Mitarbeiter aktualisiert');
			dialog.close();
			showTable();
		} else {
			alert('Mitarbeiter konnte nicht aktualisiert werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};

	dialog.showModal();
}

async function openDeleteMitarbeiterDialog(entry) {
	const dialog = document.getElementById('deleteMitarbeiterDialog');
	const id = entry.Mitarbeiter_ID || '';
	dialog.querySelector('#deleteMitarbeiterName').textContent = `${entry.Vorname || ''} ${entry.Nachname || ''}`.trim();
	dialog.querySelector('#deleteMitarbeiterEmail').textContent = entry.Email || '';

	const confirmBtn = dialog.querySelector('#confirmDeleteMitarbeiterBtn');
	const cancelBtn = dialog.querySelector('#cancelDeleteMitarbeiterBtn');
	confirmBtn.onclick = async () => {
		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=mitarbeiter', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ mitarbeiter_id: parseInt(id) || 0 })
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Mitarbeiter gelöscht');
			dialog.close();
			showTable();
		} else {
			alert('Mitarbeiter konnte nicht gelöscht werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};
	cancelBtn.onclick = () => dialog.close();
	dialog.showModal();
}

async function openEditAbteilungDialog(entry) {
	const dialog = document.getElementById('editAbteilungDialog');
	const idInput = dialog.querySelector('#editAbteilungId');
	const nameInput = dialog.querySelector('#editAbteilungName');
	const saveBtn = dialog.querySelector('#saveEditAbteilungBtn');
	const cancelBtn = dialog.querySelector('#cancelEditAbteilungBtn');

	idInput.value = entry.Abteilung_ID || '';
	nameInput.value = entry.Name || '';

	const validateForm = () => {
		saveBtn.disabled = nameInput.value.trim().length === 0;
	};

	nameInput.oninput = validateForm;
	validateForm();

	cancelBtn.onclick = () => dialog.close();
	saveBtn.onclick = async () => {
		const payload = {
			abteilung_id: parseInt(idInput.value) || 0,
			name: nameInput.value.trim()
		};

		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=abteilungen', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Abteilung aktualisiert');
			dialog.close();
			showTable();
		} else {
			alert('Abteilung konnte nicht aktualisiert werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};

	dialog.showModal();
}

async function openDeleteAbteilungDialog(entry) {
	const dialog = document.getElementById('deleteAbteilungDialog');
	const id = entry.Abteilung_ID || '';
	dialog.querySelector('#deleteAbteilungName').textContent = entry.Name || '';

	const confirmBtn = dialog.querySelector('#confirmDeleteAbteilungBtn');
	const cancelBtn = dialog.querySelector('#cancelDeleteAbteilungBtn');
	confirmBtn.onclick = async () => {
		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=abteilungen', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ abteilung_id: parseInt(id) || 0 })
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Abteilung gelöscht');
			dialog.close();
			showTable();
		} else {
			alert('Abteilung konnte nicht gelöscht werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};
	cancelBtn.onclick = () => dialog.close();
	dialog.showModal();
}

async function openEditWerkzeugTypDialog(entry) {
	const dialog = document.getElementById('editWerkzeugTypDialog');
	const idInput = dialog.querySelector('#editWerkzeugTypId');
	const typeInput = dialog.querySelector('#editWerkzeugTypName');
	const saveBtn = dialog.querySelector('#saveEditWerkzeugTypBtn');
	const cancelBtn = dialog.querySelector('#cancelEditWerkzeugTypBtn');

	idInput.value = entry.Typ_ID || '';
	typeInput.value = entry.Typ || '';

	const validateForm = () => {
		saveBtn.disabled = typeInput.value.trim().length === 0;
	};

	typeInput.oninput = validateForm;
	validateForm();

	cancelBtn.onclick = () => dialog.close();
	saveBtn.onclick = async () => {
		const payload = {
			typ_id: parseInt(idInput.value) || 0,
			art: typeInput.value.trim()
		};

		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=werkzeug_typen', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Werkzeugtyp aktualisiert');
			dialog.close();
			showTable();
		} else {
			alert('Werkzeugtyp konnte nicht aktualisiert werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};

	dialog.showModal();
}

async function openDeleteWerkzeugTypDialog(entry) {
	const dialog = document.getElementById('deleteWerkzeugTypDialog');
	dialog.querySelector('#deleteWerkzeugTypName').textContent = entry.Typ || '';

	const confirmBtn = dialog.querySelector('#confirmDeleteWerkzeugTypBtn');
	const cancelBtn = dialog.querySelector('#cancelDeleteWerkzeugTypBtn');
	confirmBtn.onclick = async () => {
		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=werkzeug_typen', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ art: entry.Typ || '' })
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Werkzeugtyp gelöscht');
			dialog.close();
			showTable();
		} else {
			alert('Werkzeugtyp konnte nicht gelöscht werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};
	cancelBtn.onclick = () => dialog.close();
	dialog.showModal();
}

async function openEditStatusDialog(entry) {
	const dialog = document.getElementById('editStatusDialog');
	const idInput = dialog.querySelector('#editStatusId');
	const statusInput = dialog.querySelector('#editStatusName');
	const saveBtn = dialog.querySelector('#saveEditStatusBtn');
	const cancelBtn = dialog.querySelector('#cancelEditStatusBtn');

	idInput.value = entry.Status_ID || '';
	statusInput.value = entry.Bezeichnung || '';

	const validateForm = () => {
		saveBtn.disabled = statusInput.value.trim().length === 0;
	};

	statusInput.oninput = validateForm;
	validateForm();

	cancelBtn.onclick = () => dialog.close();
	saveBtn.onclick = async () => {
		const payload = {
			status_id: parseInt(idInput.value) || 0,
			bezeichnung: statusInput.value.trim()
		};

		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=status', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Status aktualisiert');
			dialog.close();
			showTable();
		} else {
			alert('Status konnte nicht aktualisiert werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};

	dialog.showModal();
}

async function openDeleteStatusDialog(entry) {
	const dialog = document.getElementById('deleteStatusDialog');
	dialog.querySelector('#deleteStatusName').textContent = entry.Bezeichnung || '';

	const confirmBtn = dialog.querySelector('#confirmDeleteStatusBtn');
	const cancelBtn = dialog.querySelector('#cancelDeleteStatusBtn');
	confirmBtn.onclick = async () => {
		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=status', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status_id: parseInt(entry.Status_ID) || 0 })
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Status gelöscht');
			dialog.close();
			showTable();
		} else {
			alert('Status konnte nicht gelöscht werden: ' + (result.error || 'Unbekannter Fehler'));
		}
	};
	cancelBtn.onclick = () => dialog.close();
	dialog.showModal();
}

// filtern
function filterTable() {
	const tableHead = document.getElementById("headerRow");
	const tableData = document.getElementById("tableData");
	const inputs = tableHead.getElementsByTagName("input");
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
				const cellText = cells[j].innerHTML;
				// macht zelltext klein und vergleicht
				if (!cellText.toLowerCase().includes(filterValue)) {
					showRow = false;
					break;
				}
			}
		}
		// zelle anzeingen oder nicht
		showRow ? rows[i].style.display = "" : rows[i].style.display = "none";
	}
}
// sortieren
function sortTable(index, th) {
	const tableData = document.getElementById("tableData");
	const rows = Array.from(tableData.getElementsByTagName("tr"));

	// aufsteigende oder absteigende sortierung bestimmen
	let isAscending = th.getAttribute("data-sort");
	isAscending = isAscending == "asc" ? false : true;


	// alle icons zurücksetzen
	const allTh = document.getElementById("headerRow").getElementsByTagName("th");
	for (let th of allTh) {
		th.removeAttribute("data-sort");
		const icon = th.querySelector('.sort-icon');
		if (icon) icon.innerHTML = ' ↕';
	}

	// sortierung setzen und icon aktualisieren
	th.setAttribute("data-sort", isAscending ? "asc" : "desc");
	const currentIcon = th.querySelector('.sort-icon');
	if (currentIcon) currentIcon.innerHTML = isAscending ? ' ↑' : ' ↓';

	// sortieren
	rows.sort((rowA, rowB) => {
		// text aus zelle holen
		const cellAElement = rowA.getElementsByTagName("td")[index];
		const cellBElement = rowB.getElementsByTagName("td")[index];
		const cellA = cellAElement ? cellAElement.innerText.trim() : '';
		const cellB = cellBElement ? cellBElement.innerText.trim() : '';
		// texte in zahlen umwandeln
		const numA = parseFloat(cellA);
		const numB = parseFloat(cellB);

		// nummerisch sortieren bei zahlen
		if (!isNaN(numA) && !isNaN(numB)) {
			return isAscending ? numA - numB : numB - numA;
		}
		// vergleich für texte
		return isAscending ? cellA.localeCompare(cellB) : cellB.localeCompare(cellA);
	});
	// Die sortierten Zeilen wieder in die Tabelle einhängen (das verschiebt sie im HTML)
	rows.forEach((row) => {
		tableData.appendChild(row);
	});
}
// funktion fürs erstmalige laden und wenn obejekte hinzugefügt werden
async function showTableOnLoad() {
	const typeSelect = document.getElementById("typeSelect");
	typeSelect.value = "werkzeuge";
	await showTable();
}
//wenn mitarbeiter hinzugefügt wurde
async function showTableWorkerAdd(){
	const typeSelect = document.getElementById("typeSelect");
	typeSelect.value = "mitarbeiter";
	await showTable();
}

// --- Ausleihe (Borrow) ---
function borrowDialog() {
	const modal = document.getElementById("borrowDialog");
	const submitBtn = document.getElementById("borrowSubmitBtn");
	const cancelBtn = document.getElementById("closeBorrowDialogBtn");
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

	if (cancelBtn) {
		cancelBtn.onclick = () => {
			modal.close();
		};
	}

	submitBtn.onclick = () => {
		console.log("submit btn clicked"); // Debug-Ausgabe
		transmitBorrowData();
		modal.close();

	};
}

function borrowScanDialog() {
	const modal = document.getElementById("borrowScanBarcodeDialog");
	const closeBtn = document.getElementById("closeBorrowScanBtn");
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
	const cancelBtn = document.getElementById("closeReturnDialogBtn");
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

	if (cancelBtn) {
		cancelBtn.onclick = () => {
			modal.close();
		};
	}


	returnSubmitBtn.onclick = () => {
		returnObject();
		modal.close();
	};
}

function returnScanDialog() {
	const modal = document.getElementById("returnScanBarcodeDialog");
	const closeBtn = document.getElementById("closeReturnScanBtn");
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

	const firstName = document.getElementById('workerFirstName');
	const lastName = document.getElementById('workerLastName');
	const email = document.getElementById('workerEmail');
	const submitBtn = document.getElementById('createWorkerSubmitBtn');

	// Felder zurücksetzen
	firstName.value = '';
	lastName.value = '';
	email.value = '';

	loadAbteilungen();

	const addAbteilungBtn = document.getElementById('addAbteilungBtn');
	addAbteilungBtn.title = 'Neue Abteilung hinzufügen';
	if (addAbteilungBtn) addAbteilungBtn.onclick = async () => {
		await openAddAbteilungDialog();
		await loadAbteilungen();
	};

	function validateWorkerForm() {
		const fn = firstName.value && firstName.value.trim().length > 0;
		const ln = lastName.value && lastName.value.trim().length > 0;
		const em = email.value && email.value.trim().length > 0 && email.checkValidity();
		submitBtn.disabled = !(fn && ln && em);
	}

	firstName.addEventListener('input', validateWorkerForm);
	lastName.addEventListener('input', validateWorkerForm);
	email.addEventListener('input', validateWorkerForm);

	validateWorkerForm();

	modal.showModal();

	closeBtn.onclick = () => {
		modal.close();
	};

	submitBtn.onclick = () => {
		saveWorker();
		modal.close();
	};
}

function verlängernDialog(entry) {
	currentAusleihe = entry;

	const modal = document.getElementById('verlängernDialog');
	const barcodeInput = document.getElementById('verlängernBarcode');
	const durationInput = document.getElementById('verlängernDuration');
	const submitBtn = document.getElementById('verlängernSubmitBtn');
	const closeBtn = document.getElementById('closeVerlängernBtn');

	barcodeInput.value = entry.Barcode || '';
	durationInput.value = '';
	submitBtn.disabled = true;

	const validateForm = () => {
		submitBtn.disabled = (parseInt(durationInput.value) || 0) <= 0;
	};

	durationInput.oninput = validateForm;
	validateForm();

	if (closeBtn) {
		closeBtn.onclick = () => {
			modal.close();
		};
	}

	submitBtn.onclick = async () => {
		const ausleihId = parseInt(entry.Ausleih_ID) || 0;
		const zusatzTage = parseInt(durationInput.value) || 0;

		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=verlängern', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ausleih_id: ausleihId, zusatz_tage: zusatzTage })
		});

		const result = await response.json();
		if (result.success) {
			if (typeof showToast === 'function') showToast('Ausleihe verlängert');
			modal.close();
			showTable();
		} else {
			alert('Verlängerung fehlgeschlagen: ' + (result.error || 'Unbekannter Fehler'));
		}
	};

	modal.showModal();
}

async function saveWorker() {
	const payload = {
			vorname: document.getElementById('workerFirstName').value.trim(),
			nachname: document.getElementById('workerLastName').value.trim(),
			email: document.getElementById('workerEmail').value.trim(),
			abteilung_id: document.getElementById('workerDepartmentSelect').value
		};

		const response = await fetch('https://mhp.hallo123wert.de/api.php?resource=mitarbeiter', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		const result = await response.json();
		if (result.success) {
			showToast('Mitarbeiter erfolgreich angelegt!');
			if (typeof showTableWorkerAdd === "function") showTableWorkerAdd();
		} else {
			alert('Fehler beim Anlegen: ' + result.error + "\nMöglicherweise existiert bereits ein Mitarbeiter mit dieser E-Mail-Adresse");
		}
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