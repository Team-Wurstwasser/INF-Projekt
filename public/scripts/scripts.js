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

function objectCreatePopup() {
	


	// mitarbeiternr aktuwelles , datum , rückgabedatum, 
}

//abfragen sortieren : abgabeDatum , suchfeld

function registerDialog() {
	let dialog = document.getElementById('');
	let closebtn = document.getElementById('');
	let openbtn = document.getElementById('');



}