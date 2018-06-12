const http = require('http');
const fs = require('fs');
const url = require('url');
const path = require('path');
const gpio = require('gpio');
const morse = require('./morse.js');

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

const serveStatic = (req, res) => {
    let filePath = './www' + req.url;
    if (filePath == './www/') {
        filePath = './www/index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                res.writeHead(200, { 'Content-Type': contentType });
                res.end('404', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                res.end();
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

const server = http.createServer((req, res) => {
    if (req.url.indexOf(`/api/transmit/`) !== -1) {
        const splitUrl = decodeURI(req.url).split('/');
        const lastPart = splitUrl[splitUrl.length - 1];
        const morseCode = morse.encode(lastPart);
        blinkMorse(morseCode);

        res.writeHead(200, { 'Content-Type': "text/html" });
        res.end("Message received", 'utf-8')
    } else {
        serveStatic(req, res);
    }
});

server.listen(80);
console.log('Web server running!')


const dotDuration = 1;
const dashDuration = 3 * dotDuration;
const spaceDuration = dotDuration;
let ledState = false;
let sendingMessage = false;

const blinkMorse = (morseCode = "...---...") => {
    if (sendingMessage) return;

    console.log("started transmitting message...");
    sendingMessage = true;
    let characterMaxTime = null;
    let characterCurrentTime = null;
    let currentCharacterIndex = 0;
    let currentCharacter = morseCode[currentCharacterIndex];

    const interval = setInterval(() => {
        if (!characterMaxTime) {
            // new character setup
            characterCurrentTime = 0;
            switch(currentCharacter) {
                case ".":
                    characterMaxTime = dotDuration;
                    break;
                case "-":
                    characterMaxTime = dashDuration;
                    break;
                case " ":
                    characterMaxTime = spaceDuration;
                    break;
                default:
                    throw new Error("Unrecognized Character: ", currentCharacter);
                    clearInterval(interval);
            }
        }

        if (characterCurrentTime === characterMaxTime) {
            // end of character
            ledState = false;
            characterCurrentTime = null;
            characterMaxTime = null;

            if (currentCharacterIndex === morseCode.length - 1) {
                // end of message
                console.log("...finished transmitting message");
                sendingMessage = false;
                clearInterval(interval);
            }

            currentCharacterIndex++;
            currentCharacter = morseCode[currentCharacterIndex];
        } else if (currentCharacter === " ") {
            ledState = false;
        } else {
            ledState = true;
        }

        console.log('LED State', ledState);
        gpio.pins[1].setValue(ledState);
        characterCurrentTime++;
    }, 200);
};



