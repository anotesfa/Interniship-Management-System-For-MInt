const http=require('http');
const url=require('url');

const server= http.createServer((req,res)=>{
  const PathUrl=req.url;
  if(PathUrl==='/' || PathUrl==='/overview'){
    res.end("This is OVERVIEW!");
  }
  else if(PathUrl==='/product'){
    res.end("This is PRODUCT!");
  }
  else {
    res.writeHead(404, {
      'content-type':'text/html',
      'myprofile':'Hello-HELLOOOO'
    });
    res.end("<h1>Page not found</h1>");//hfh
  }
})
server.listen(8000,'127.0.0.1',()=>{
  console.log("This is checking for doing it!");
})
