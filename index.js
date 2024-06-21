const express = require('express')
const app = express()
require('dotenv').config()
const jwt = require('jsonwebtoken');
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cxuuz57.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const newsCollection=client.db('ecoTimes').collection('articles')
    const usersCollection=client.db('ecoTimes').collection('users')
    const publishersCollection=client.db('ecoTimes').collection('publishers')
   

     // jwt related api
    app.post('/jwt',async(req,res)=>{
      const user= req.body
      const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'})
      res.send({token})
    })

    // verify jwt middleware
    const verifyToken=(req,res,next)=>{
      if(!req.headers.authorization){
          return res.status(401).send({message:'unauthorized access'})
      }
      const token=req.headers.authorization.split(' ')[1];

      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
        if(err){
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded=decoded;
        next()
      })
    }




    // Article related db
    app.post('/article',async(req,res)=>{
      const articleData=req.body;
      const result = await newsCollection.insertOne(articleData)
      res.send(result)
    })

    app.get('/article',async(req,res)=>{
      const result=await newsCollection.find().toArray()
      res.send(result)
    })

    app.get('/article/:id', async(req,res)=>{
      const id= req.params.id;
      const query={_id: new ObjectId(id)}
      const result=await newsCollection.findOne(query)
      res.send(result)
    })

    app.delete('/article/:id',async(req,res)=>{
      const id= req.params.id;
      const query={_id: new ObjectId(id)}
      const result= await newsCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/article/approve/:id', async(req,res)=>{
      const id= req.params.id;
      const filter={_id: new ObjectId(id)}
      const updatedDoc={
       $set:{
          status: 'approved'
       }
      }
      const result = await newsCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    app.patch('/article/premium/:id', async(req,res)=>{
      const id= req.params.id;
      const filter={_id: new ObjectId(id)}
      const updatedDoc={
       $set:{
          status: 'premium',
          isPremium:'yes'
       }
      }
      const result = await newsCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })

    app.get('/my-article/:email',async(req,res)=>{
      const email=req.params.email;
      let query={authorEmail:email}
      const result = await newsCollection.find(query).toArray()
      res.send(result)
    })

    app.put('/update-article/:id',async(req,res)=>{
      const id=req.params.id;
      const query={_id:new ObjectId(id)}
      const articleData=req.body
      const options={upsert:true}
      const updateDoc = {
        $set:{
          ...articleData,
        },
      }
      const result = await newsCollection.updateOne(query,updateDoc,options)
      res.send(result)
    })

    // user related db
    app.post('/users',async(req,res)=>{
      const user=req.body
      const query={email:user.email}
      const existingUser= await usersCollection.findOne(query)
   
      if(existingUser){
        return res.send ({message: 'user already exists', insertedId:null})
      }
      const result=await usersCollection.insertOne(user)
      res.send(result)
    })

    app.get('/users',async(req,res)=>{
      const result=await usersCollection.find().toArray()
      res.send(result)
    })

    app.patch('/users/admin/:id', async(req,res)=>{
      const id= req.params.id;
      const filter={_id: new ObjectId(id)}
      const updatedDoc={
       $set:{
          role: 'admin'
       }
      }
      const result = await usersCollection.updateOne(filter,updatedDoc)
      res.send(result)
    })
  




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello from eco-times Server..')
})
  
app.listen(port, () => {
  console.log(`eco-times is running on port ${port}`)
})