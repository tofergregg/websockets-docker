// original code from: https://www.tutorialspoint.com/html5/html5_indexeddb.htm
const commsData = [
    { id: "0", status: 0, num1: 0, num2: 0, text: "" },
];


var db;
var request = window.indexedDB.open("PyodideComms", 1);

request.onerror = function(event) {
    console.log("error: ");
};

request.onsuccess = function(event) {
    db = request.result;
    console.log("success: "+ db);
};

request.onupgradeneeded = function(event) {
    var db = event.target.result;
    var objectStore = db.createObjectStore("communictions", {keyPath: "id"});

    for (var i in commsData) {
        objectStore.add(commsData[i]);
    }
}

function read() {
    var transaction = db.transaction(["communications"]);
    var objectStore = transaction.objectStore("communications");
    var request = objectStore.get("1");

    request.onerror = function(event) {
        alert("Unable to retrieve daa from database!");
    };

    request.onsuccess = function(event) {
        // Do something with the request.result!
        if(request.result) {
    //{ id: "0", status: 0, num1: 0, num2: 0, text: "" },
            alert("status: " + request.result.status + ", num1: " + request.result.num1 + ", num2: " + request.result.num2 + ", text: " + request.result.text);
            } else {
                alert("Could not find id 0 in the database!");
            }
    };
}

/*
function readAll() {
    var objectStore = db.transaction("employee").objectStore("employee");

    objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;

        if (cursor) {
            alert("Name for id " + cursor.key + " is " + cursor.value.name + ", Age: " + cursor.value.age + ", Email: " + cursor.value.email);
                cursor.continue();
            } else {
                alert("No more entries!");
            }
    };
}
*/

function add() {
    var request = db.transaction(["communications"], "readwrite")
        .objectStore("communcations")
        .add({ id: "1", status: 1, num1: 42, num2: 24, tet"hello" });

    request.onsuccess = function(event) {
        console.log("added id 1 to the database");
    };

    request.onerror = function(event) {
        alert("Unable to add data, it is aready in your database! ");
    }
}

function remove() {
    var request = db.transaction(["communications"], "readwrite")
        .objectStore("communications")
        .delete("1");

    request.onsuccess = function(event) {
        console.log("Entry 1 has been removed from the database.");
    };
}
