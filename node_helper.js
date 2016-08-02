"use strict";

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
var MMM_GMAILEMAIL_PREFIX = '/modules/MMM-GmailEmail';
//var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + MMM_GMAILEMAIL_PREFIX + '/.credentials/';
var TOKEN_DIR =  (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
const NodeHelper = require("node_helper");
var unreadSnippets = [];

module.exports = NodeHelper.create({
	start: function() {		
		this.checkMails();
 	},

 	checkMails: function(){
 		const self = this;
		console.log("Applicaiton start!")
		fs.readFile('client_secret.json', function processClientSecrets(err, content) {
			if (err) {
				console.log('Error loading client secret file: ' + err);
				return;
			}
			// Authorize a client with the loaded credentials, then call the
			// Gmail API.
			self.authorize(JSON.parse(content), self.listMessages);
		});
		self.updateCalendar();
 	},

 	authorize: function (credentials, callback) {
 		const self = this;
		var clientSecret = credentials.installed.client_secret;
		var clientId = credentials.installed.client_id;
		var redirectUrl = credentials.installed.redirect_uris[0];
		var auth = new googleAuth();
		var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

		// Check if we have previously stored a token.
		fs.readFile(TOKEN_PATH, function(err, token) {
			if (err) {
				self.getNewToken(oauth2Client, callback);
			} else {
				oauth2Client.credentials = JSON.parse(token);
				callback(oauth2Client);
			}
		});
	},

	listMessages: function (auth) {
		unreadSnippets = [];
		var gmail = google.gmail('v1');
		gmail.users.messages.list({
			auth: auth,
			userId: 'me',
	    q:'is:unread',
		},

		function(err, response) {
			
			if (err) {
				console.log('The API returned an error: ' + err);
				return;
			}
			//console.log(response)
			var messages = response.messages;
			
			if (typeof messages !== "undefined") {
				for (var i = 0; i < messages.length; i++) {
					var message = messages[i];
					gmail.users.messages.get({
						auth: auth,
						userId: 'me',
						id:message.id
					},

					function (err, response) {
						var mail = [];
						if(typeof response.snippet !== "undefined" && !(unreadSnippets.indexOf(response.snippet) > -1)){
							unreadSnippets.push(response.snippet);
							console.log('unreadSnippets: ' + JSON.stringify(unreadSnippets, null, 4));
						}
					});	
				}
			}
		});
	},

	getNewToken: function (oauth2Client, callback) {
		const self = this;
		var authUrl = oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: SCOPES
		});
		console.log('Authorize this app by visiting this url: ', authUrl);
		var rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});
		rl.question('Enter the code from that page here: ', function(code) {
		rl.close();
		oauth2Client.getToken(code, function(err, token) {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
				return;
			}
			oauth2Client.credentials = token;
			self.storeToken(token);
			callback(oauth2Client);
			});
		});
	},

	storeToken: function (token) {
		try {
			fs.mkdirSync(TOKEN_DIR);
		} catch (err) {
			if (err.code != 'EEXIST') {
				throw err;
			}
		}
		fs.writeFile(TOKEN_PATH, JSON.stringify(token));
		console.log('Token stored to ' + TOKEN_PATH);
	},

	socketNotificationReceived: function(notification, payload) {
		
		if(notification === "CONNECTED"){
			console.log(this.name + " received a socket notification: " + notification + " - Payload: " + payload);
		}

		if(notification === "UPDATEUI"){
			this.updateUi(payload)
			this.options = payload;
		}

		if (notification === "LOG"){
			console.log("here" + JSON.stringify(payload));
		}

	},

	updateUi: function () {
		var self = this;
		setInterval(function() {
			self.checkMails();
		}, 50000);
	},

	updateCalendar: function() {
		this.sendSocketNotification("UPDATE_GMAILEMAIL", unreadSnippets);
	}

});


