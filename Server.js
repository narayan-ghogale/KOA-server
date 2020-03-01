const express =require('express')
const app=express()
const bodyParser=require("body-parser")
const cors=require('cors')
const MongoClient = require('mongodb').MongoClient;
const bcrypt = require('bcryptjs');
var cloudinary = require('cloudinary');
const spawn = require("child_process").spawn;
var fs=require('fs');
var multer=require('multer');
var uploadFile = require("express-fileupload")



CLOUDINARY_URL="cloudinary://885772148545839:M8mjjaOY_d_BmwOLi0r3ktmQL1o@narayanghogale"
// replace the uri string with your connection string.
const uri = "mongodb+srv://narayan:ghogale@cluster0-okl81.mongodb.net/test?retryWrites=true&w=majority"

cloudinary.config({ 
    cloud_name: 'narayanghogale', 
    api_key: '885772148545839', 
    api_secret: 'M8mjjaOY_d_BmwOLi0r3ktmQL1o' 
  });

console.log("starting a backend")

app.use(bodyParser.urlencoded({extended:true}))
app.use(bodyParser.json())
app.use(cors())


var path = require('path');
 var storage = multer.diskStorage({
            destination: function(req, file, callback) {
                callback(null, 'public');
            },

            filename: function(req, file, callback) {
                var fname = file.fieldname + '-' + Date.now() + path.extname(file.originalname);

                callback(null, fname);

            }
        });


var upload = multer({ storage: storage }).single('file')
app.post('/uploadf',function(req, res) {
     
    upload(req, res, function (err) {
           if (err instanceof multer.MulterError) {
               console.log(err)
               return res.status(500).json(err)
           } else if (err) {
            console.log(err)
               return res.status(500).json(err)
           }
           else{
               console.log("done")
           }
      return res.status(200).send(req.file)
    })

});
// app.post('/uploadf', (req, res, next) => {
//     let uploadFile = req.files.file
//     const fileName = req.files.file.name
//     uploadFile.mv(
//       `${__dirname}/public/files/${fileName}`,
//       function (err) {
//         if (err) {
//           return res.status(500).send(err)
//         }
//         res.json({
//           file: `public/${req.files.file.name}`,
//         })
//       },
//     )
//   })

var port = process.env.PORT || 3001;
app.listen(port,function(){
    console.log("listening to 3001");
});



app.get('/callpython',(req,res)=>{
    console.log("starting a call to py script");
    const pythonProcess = spawn('python',["./script.py", "hello", "dude"]);
    pythonProcess.stdout.on('data', (data) => {
        // Do something with the data returned from python script
        console.log(data.toString());
        res.send(data.toString());
    });
})



app.get('/',(request,response)=>{
    response.send("This express is up and working");
    //console.log(cursor);

})

app.post('/login',(req,res)=>{
    //console.log(req.body.email);
    //console.log(req.body.password);
    let loggedin=false;
    MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, 
        function(err, client) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       const collection = client.db("mydb").collection("users");
       collection.find().toArray(function(err, results) {
        console.log(results);
        console.log(results[0].email);
        for(var i=0;i<results.length;i++){
            if(results[i].email===req.body.email&&bcrypt.compareSync(req.body.password,results[i].password )){
                res.send("success");
                loggedin=true;
            }
        }
        if(!loggedin)
        res.send("failure");
      });
       client.close();
    });
   
})

app.post('/changepass',(req,res1)=>{
    let thisemail=req.body.mail;
    let newpasshash=bcrypt.hashSync(req.body.newpass, 10);
    let update=true;
    MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, 
        function(err, client) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       const userscollection = client.db("mydb").collection("users");
       //console.log(userscollection);
       console.log(thisemail);
    //    userscollection.find().toArray(function(err,results){
    //        console.log(results[0].email);
    //    })
        userscollection.find({email:thisemail}).toArray(function(err, result) {
        if (err) throw err;
        console.log(result[0].password);
        console.log(result[0]._id);
        console.log(newpasshash);
        if(!bcrypt.compareSync(req.body.oldpass,result[0].password)){
            // res1.send("Password Matched");
            console.log("updating....");
            update=false;
            res1.send("Old password do not match");
        }
        })

        if(update){
        userscollection.updateOne({mail:thisemail},{ $set:{password:newpasshash}},function(err2,updateres){
        if(err2) throw err2;
        console.log("updated");
        res1.send("Updated Password");
        })
        }
        client.close();
        });
    })

app.post('/register',(req,res1)=>{
    let creds={};
    creds.name=req.body.name;
    creds.email=req.body.email;
    creds.password = bcrypt.hashSync(req.body.password, 10);

    MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, 
        function(err, client) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       const database = client.db("mydb");
       database.collection("users").insertOne(creds,function(err,res){
           if(err) throw err;
           console.log("one user inserted");
           res1.send("Registeration successful, continue to login ");
       })
       
       client.close();
    });
})

app.post('/imageupload',(req,res)=>{
    MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, 
        function(err, client) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       const imageinfo = client.db("mydb").collection('imageinfo');
       imageinfo.find().toArray(function(err, results) {
        //console.log(results);
        console.log(results[0].imageid);
        let imagelabel="image"
        let thisid=imagelabel.concat(results[0].imageid.toString());
        res.send({thisid});       
       client.close();

    });
})
})

app.post('/adddetails',(req,res1)=>{
    let details=req.body.details;
    MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, 
        function(err, client) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       const database = client.db("mydb");
       database.collection("details").insertOne(details,function(err,res){
           if(err) throw err;
           console.log("one document inserted");
       })
       res1.send("Saved Details");
       client.close();
    });
})

app.post('/addtest',(req,res1)=>{
    let details=req.body.details;
    MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, 
        function(err, client) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       const database = client.db("mydb");
       database.collection("tests").insertOne(details,function(err,res){
           if(err) throw err;
           console.log("one test inserted");
       })
       res1.send("Saved Test Details");
       client.close();
    });
})


app.post('/alltests',function(req,res){
    // res.send("trying");
    MongoClient.connect(uri,{useNewUrlParser: true, useUnifiedTopology: true}, 
        function(err, client) {
       if(err) {
            console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
       }
       console.log('Connected...');
       const collection = client.db("mydb").collection("tests");
       collection.find({email:req.body.email}).toArray(function(err, results) {
       console.log(results);
       res.send(results);
      });
       client.close();
    });
})

app.get('/run', function (req, res) {
    const subprocess = runScript()
    res.set('Content-Type', 'text/plain');
    subprocess.stdout.pipe(res)
    subprocess.stderr.pipe(res)
  })
  

app.get('/getresult',function(req,res){
    
})