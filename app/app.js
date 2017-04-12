var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    qs = require('querystring'),
    port = process.env.PORT || 3000,
    fs = require('fs'),
    formidable = require('formidable'),
    util = require('util');


const runSpawn = require('child_process').spawn;

fs.writeFile("server.log","Starting Log...",function(err){});

const testSpawn = require('child_process').spawn;
const testCode = testSpawn('./test.sh');
testCode.stdout.on('data', function (data) {
  serverLog('Test stdout: ' + data.toString());
});
testCode.stderr.on('data', function (data) {
  serverLog('Test stderr: ' + data.toString());
});


function serverLog(data){
  console.log("***"+ Date.now()+" "+data);
}



http.createServer(function(request, response) {
  serverLog(request.method);
  serverLog(request.url);
  if(request.method==="GET"){
    var uri = url.parse(request.url).pathname
      , filename = path.join(process.cwd(), uri);

    fs.exists(filename, function(exists) {
      if(!exists) {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        return;
      }

      if (fs.statSync(filename).isDirectory()) filename += '/index.html';

      fs.readFile(filename, "binary", function(err, file) {
        if(err) {        
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }

        response.writeHead(200);
        response.write(file, "binary");
        response.end();
      });
    });
  }


  if(request.method==="POST"){
    if (request.url === "/upload") {
      console.log('Request recieved.');

      var form = new formidable.IncomingForm();
      var timeStamp = new Date().getTime();

      form.uploadDir = 'upload/'+ timeStamp;
      fs.mkdir(form.uploadDir,function(){
        form.parse(request, function(err, fields, files) {
          const runCode = runSpawn('python',['engines/go.py',form.uploadDir]);
          runCode.stdout.on('data', function (data) {
            serverLog('stdout: ' + data.toString());
          });
          runCode.stderr.on('data', function (data) {
            serverLog('stderr: ' + data.toString());
          });
          runCode.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            console.log(''+ new Date().getTime());
            serverLog(`child process exited with code ${code}`);
            response.writeHead(200, {'content-type': 'text/plain'});
            response.write(''+ new Date().getTime());
            response.end();
          });
          runCode.on('error', (err) => {
            serverLog(err);
            console.log('what is going on');
            console.log(err);
          });
        });    
      });

    } else {
      response.writeHead(404, 'Resource Not Found', {'Content-Type': 'text/html'});
      response.end('<!doctype html><html><head><title>404</title></head><body>404: Resource Not Found</body></html>');
    }
  }

}).listen(parseInt(port, 10));

console.log("Server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");