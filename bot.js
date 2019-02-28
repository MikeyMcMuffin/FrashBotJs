var twit = require('twit');
var config = require('./config.js');
const schedule = require('node-schedule');
var drive = require("./drive.js");
const fs = require('fs') , gm = require('gm');

var T = new twit(config);

var rule = new schedule.RecurrenceRule();
rule.hour = 16;
rule.minute = 41;

var j = schedule.scheduleJob(rule, function(){
	postImage();
});

async function postImage() {
	//Calls the getImgage function from drive.js
	await drive.getImage();

	var filepath = await getFilePath('tempImages/', 50000);
	var fileFound = false;

	filepath = 'tempImages/' + filepath;

	//Grabs Image content from filepath
	var imageContent = fs.readFileSync(filepath, { encoding: 'base64' });

	T.post('media/upload', { media_data: imageContent }, function (err,data,response){
		if (err) {
	    	console.warn("An error occurred while posting", err);
	    	return;
		}

		var mediaIdStr = data.media_id_string;
		console.log('Media String' + mediaIdStr);
		var altText = "A Beautiful Frash Frash.";
		var meta_params = {media_id: mediaIdStr, alt_text: { text: altText }};

		T.post('media/metadata/create', meta_params, function (err,data,response){
			if(!err){
				var params = { status: ' ', media_ids: [mediaIdStr] };

				T.post('statuses/update', params, function (err, data, response){
					if (err) {
	    				console.warn("An error occurred while posting", err);
	    				return;
					}
					console.log('Posting');
				})
			}else{
				console.log('error: ' + err);
			}
		})
	})

	fs.unlinkSync('./' + filepath);
}

function getFilePath(dir ,timeout){
	return new Promise(function (resolve, reject) {
		var filepath;
        var timer = setTimeout(function () {
            watcher.close();
            reject(new Error('File did not exists and was not created during the timeout.'));
        }, timeout);

        // fs.access(dir, fs.constants.R_OK, function (err) {
        //     if (!err) {
        //         clearTimeout(timer);
        //         watcher.close();
        //         resolve();
        //     }
        // });

        var watcher = fs.watch(dir, function (eventType, filename) {
            if (eventType === 'rename') {
                clearTimeout(timer);
                watcher.close();
			fs.readdirSync(dir).forEach(filename =>{
				console.log('In here');
				filepath = filename
				console.log('resolving getFilePath as ' + filepath);
				gm(filename).identify(function(err,data){
					if(!err){
						console.log(data);
						console.log(data.bytes);
						resolve(filepath);
					}else{
						getFilePath(dir, timeout);
					}
				});
			});
        	}
    	});
    });
}


