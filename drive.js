const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
// fs.readFile('credentials.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);
//   // Authorize a client with credentials, then call the Google Drive API.
//   authorize(JSON.parse(content), getFilesInFolder);
// });

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}


/////// CODE THAT I HAVE WRITTEN ////////


// ReAuthorises the user for when bot.js calls drive module.
function reAuthorise(){
	fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), getFilesInFolder);
});
}

const fileFolderIds = require("./fileFolderIds.json");

//
function getFilesInFolder(auth) {
	const drive = google.drive({version: 'v3', auth});
	drive.files.list({
		q: "'" + fileFolderIds.unusedImages +"' in parents"
	}, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;

    if (files.length) {
      console.log('Files:');
      files.map((file) => {
      });
      var image = files[Math.floor(Math.random() * files.length)];

      getImage(image, drive, auth);
    } else {
      console.log('No files found. Checking Used Folder');
      moveImagesToFolder(drive, auth);
    }
  });

}

//
function getImage(image, drive){
	var dest = fs.createWriteStream('./tempImages/' + image.name);

    drive.files.get({fileId: image.id, alt: 'media'}, {responseType: 'stream'},
	function(err, res){
		if(err){
			console.log(err);
		}
   		res.data
   	.on('end', () => {
     console.log('Done ');
   })
   .on('error', err => {
      console.log('Error', err);
   })
   .pipe(dest);
      console.log('piper is gonna pipe');
  })
  drive.files.update({
    fileId: image.id,
    addParents: fileFolderIds.usedImages,
    removeParents: fileFolderIds.unusedImages,
    fields: 'id, parents'
  }, function (err, file) {
    if(err) {
      console.log('Error Thrown when Move File after Download! : ' + err);
    }
  });
}

function moveImagesToFolder(drive, auth){
  drive.files.list({
    q: "'" + fileFolderIds.usedImages +"' in parents"
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;

    if (files.length) {
      //Moves files from Used Folder back to UnUsedFolder
      files.map((file) => {
        drive.files.update({
          fileId: file.id,
          addParents: fileFolderIds.unusedImages,
          removeParents: fileFolderIds.usedImages,
          fields: 'id, parents'
        }, function (err, file) {
          if(err) {
            console.log('Error Thrown when Moving Files: ' + err);
          }
        });
      });
      getFilesInFolder(auth);
    } else {
      console.log('No files found in usedImages either! Checking Used Folder');
    }
  });
}





module.exports.getImage = reAuthorise;