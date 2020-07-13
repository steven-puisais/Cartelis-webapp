var sheets = {}

function makeApiCall() 
{
	var dropdown_list = document.getElementById('dropdown_list');
	return gapi.client.drive.files.list({}).then(function (response) 
	{
		response.result.files.forEach(function (entry) 
		{
			if (entry.mimeType == "application/vnd.google-apps.spreadsheet")
				sheets[entry.name] = entry.id;
		});
		for (var key in sheets) 
		{
			var option = document.createElement("option");
			option.text = key;
			option.value = key;
			dropdown_list.add(option);
		}
	}, function (err) 
	{
		console.error("Execute error", err);
	});
}

var A = [];
var B = [];

function set_sheets() 
{
	var tmp;
	var C;
	var sheet_name = document.getElementById('dropdown_list').options[document.getElementById('dropdown_list').selectedIndex].text;
	var sheet_id = sheets[sheet_name];
	var request_A = gapi.client.sheets.spreadsheets.values.get({
		spreadsheetId: sheet_id,
		range: 'A',
	});
	var request_B = gapi.client.sheets.spreadsheets.values.get({
		spreadsheetId: sheet_id,
		range: 'B',
	});

	request_A.then(function (response) 
	{
		A = response.result.values;
	}, function (reason) 
	{
		console.error('error: ' + reason.result.error.message);
	});
	request_B.then(function (response) 
	{
		B = response.result.values;
	}, function (reason) 
	{
		console.error('error: ' + reason.result.error.message);
	});

	if (A[0].length >= B[0].length) 
	{
		C = A;
		tmp = B;
	}
	else 
	{
		C = B;
		tmp = A;
	}

	C = calculate_C(C, tmp);

	var params = {
        spreadsheetId: sheet_id,
		range: "C!A1:Z1000",
		valueInputOption: 'RAW'
	};

	var valueRangeBody = {
		"range": "C!A1:Z1000",
		"values": C
	};

	var request = gapi.client.sheets.spreadsheets.values.update(params, valueRangeBody);
	request.then(function(response) {
		console.log(response.result);
	}, function(reason) {
		console.error('error: ' + reason.result.error.message);
	});
}

function calculate_C(C, tmp)
{
	for (var i = 0; i < tmp[0].length; i++) 
	{
		if (C[0].includes(tmp[0][i])) 
		{
			if (C[1][i] != tmp[1][i]) 
			{
				if (C[1][i] == '')
					C[1][i] = tmp[1][i];
				else if (tmp[1][i] == '')
					tmp[1][i] = C[1][i];
			}
		}
		else
		{
			C[0].push(tmp[0][i]);
			C[1].push(tmp[1][i]);
		}	
	}

	return C;
}

function initClient() 
{
	var API_KEY = 'AIzaSyDH0SldII1P_YP1NcKwPAH_p7qDSSdQA28';
	var CLIENT_ID = '613313973525-ruv23jes3e7vii6brjdosld874t59vbm.apps.googleusercontent.com';
	var SCOPE = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/spreadsheets';

	gapi.client.init({
		'apiKey': API_KEY,
		'clientId': CLIENT_ID,
		'scope': SCOPE,
		'discoveryDocs': ['https://content.googleapis.com/discovery/v1/apis/drive/v3/rest', 'https://sheets.googleapis.com/$discovery/rest?version=v4'],
	}).then(function () 
	{
		gapi.auth2.getAuthInstance().isSignedIn.listen(updateSignInStatus);
		updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		console.log("GAPI client loaded for API");
		document.getElementById("connect_button").style.display = "none";
		document.getElementById("myForm").style.display = "inline";
	});
}

function handleClientLoad() 
{
	gapi.load('client:auth2', initClient);
}

function updateSignInStatus(isSignedIn) 
{
	if (isSignedIn) {
		makeApiCall();
	}
}

function handleSignInClick(event) 
{
	gapi.auth2.getAuthInstance().signIn();
}

function handleSignOutClick(event) 
{
	gapi.auth2.getAuthInstance().signOut();
}