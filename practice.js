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
    res.end("Page not found");
  }
})
server.listen(8000,'127.0.0.1',()=>{
  console.log("This is checking for doing it!");
})
19ffdgddfdhdfghgjghjgh