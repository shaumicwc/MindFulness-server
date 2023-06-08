const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4kfci0x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    await client.db("admin").command({ ping: 1 });

    const instructorsCollection = client.db('MindFulness').collection('allInstructors')
    const classCollection = client.db('MindFulness').collection('allClasses')
    const selectedCollection = client.db('MindFulness').collection('selectedClasses')
    const userCollection = client.db('MindFulness').collection('users')

    //class api
    app.post('/all-classes', async (req, res) => {
      const classes = req.body
      const result = await classCollection.insertOne(classes)
      res.send(result)
    })
    app.post('/selected-class', async (req, res) => {
      const selectedClass = req.body;
      const result = await selectedCollection.insertOne(selectedClass)
      res.send(result)
    })
    app.get('/all-classes', async (req, res) => {
      const result = await classCollection.find().toArray()
      res.send(result)
    })
    app.get('/all-classes', async (req, res) => {
      const email = req.query.email;
      const query = { instructorEmail: email }
      const result = await classCollection.find(query).toArray()
      res.send(result)
    })
    app.put('/all-classes/:id', async (req, res) => {
      const id = req.params.id;
      const status = req.query.status;
      const feedback = req.query.feedback;
      if (status == 'approved') {
          const query = { _id: new ObjectId(id) }
          const updatedDoc = {
              $set: {
                  status: 'Approved'
              }
          }
          const result = await classCollection.updateOne(query, updatedDoc)
          res.send(result)
      }
      if (status == 'denied') {
          const query = { _id: new ObjectId(id) }
          const updatedDoc = {
              $set: {
                  status: 'Denied'
              }
          }
          const result = await classCollection.updateOne(query, updatedDoc)
          res.send(result)
      }
      if (feedback) {
          const query = {_id : new ObjectId(id)}
          const updatedDoc = {
              $set:{
                  feedback : feedback
              }
          }
          const result = await classCollection.updateOne(query, updatedDoc)
          res.send(result)
      }
  })

          //users api
          app.post('/all-users', async (req, res) => {
            const user = req.body;
            const query = { email: user?.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({})
            }
            const result = await userCollection.insertOne(user)
            res.send(result)
        })
        app.get('/current-user', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await userCollection.findOne(query)
            res.send(result)
        })
        app.get('/all-users', async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        app.put('/all-users/:id', async(req, res)=>{
            const id = req.params.id;
            const role = req.query.role;
            const query = {_id : new ObjectId(id)}
            const updatedDoc ={
                $set : {
                    role : role
                }
            }
            const result = await userCollection.updateOne(query, updatedDoc)
            res.send(result)
        })

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.log(error.message)
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('MindFulness is running')
})

app.listen(port, (req, res) => {
  console.log(`server is running port ${port}`)
})
