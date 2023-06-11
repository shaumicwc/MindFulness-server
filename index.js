require('dotenv').config()
const express = require('express');
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000
const stripe = require('stripe')


app.use(express.static("public"))
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

        const classCollection = client.db('MindFulness').collection('allClasses')
        const selectedClassCollection = client.db('MindFulness').collection('selectedClasses')
        const enrolledClassCollection = client.db('MindFulness').collection('enrolledClasses')
        const userCollection = client.db('MindFulness').collection('users')
        const paymentCollection = client.db('MindFulness').collection('payment')
        const arrivingClassCollection = client.db('MindFulness').collection('arrivingClasses')


    //classes api
    app.get('/arriving-classes', async(req,res)=>{
        const result = await arrivingClassCollection.find().toArray()
        res.send(result)
    })
    app.post('/all-classes', async (req, res) => {
        const classes = req.body
        const result = await classCollection.insertOne(classes)
        res.send(result)
    })
    app.post('/selected-class', async (req, res) => {
        const selectedClass = req.body;
        const result = await selectedClassCollection.insertOne(selectedClass)
        res.send(result)
    })
    app.get('/selected-classes', async (req, res) => {
        const email = req.query.email;
        const query = { studentEmail: email }
        const result = await selectedClassCollection.find(query).toArray()
        res.send(result)
    })
    app.get('/selected-class/:id',  async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await selectedClassCollection.findOne(query)
        res.send(result)
    })
    app.delete('/selected-classes/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await selectedClassCollection.deleteOne(query)
        res.send(result)
    })
    app.get('/approved-all-classes', async (req, res) => {
        const query = {status : 'Approved'} //only shows the approved classes
        const result = await classCollection.find(query).toArray()
        res.send(result)
    })
    app.get('/all-classes',  async (req, res) => {
        const result = await classCollection.find().sort({date : -1}).toArray()
        res.send(result)
    })
    app.get('/all-classes/:email', async (req, res) => {
        const email = req.params.email;
        const query = { instructorEmail: email }
        const result = await classCollection.find(query).toArray()
        res.send(result)
    })
    app.put('/all-classes/:id',  async (req, res) => {
        const id = req.params.id;
        const status = req.query.status;
        const feedback = req.query.feedback;
        if (status === 'approved') {
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: 'Approved'
                }
            }
            const result = await classCollection.updateOne(query, updatedDoc)
            res.send(result)
        }
        if (status === 'denied') {
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
            const query = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    feedback: feedback
                }
            }
            const result = await classCollection.updateOne(query, updatedDoc)
            res.send(result)
        }
    })
    app.get('/popular-classes', async(req, res)=>{
        const query = {status : 'Approved'}
        const result = await classCollection.find(query).sort({enrolledStudents : -1}).toArray()
        res.send(result)
    })
    app.get('/enrolled-classes/:email', async(req, res)=>{
        const email = req.params.email
        const query = {studentEmail : email}
        const result = await enrolledClassCollection.find(query).toArray()
        res.send(result)
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
    app.get('/user/admin/:email', async(req, res)=>{
        const email = req.params.email;
        const query = {email : email, role : 'admin'}
        const admin = await userCollection.findOne(query)
        res.send(admin)
    })
    app.get('/user/instructor/:email', async(req, res)=>{
        const email = req.params.email;
        const query = {email : email, role : 'instructor'}
        const instructor = await userCollection.findOne(query)
        res.send(instructor)
    })
    app.get('/user/student/:email', async(req, res)=>{
        const email = req.params.email;
        const query = {email : email, role : 'student'}
        const student = await userCollection.findOne(query)
        res.send(student)
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
    app.get('/all-instructors', async(req, res)=>{
        const query = {role: 'instructor'}
        const result = await userCollection.find(query).toArray()
        res.send(result)
    })
    app.put('/all-users/:id',  async (req, res) => {
        const id = req.params.id;
        const role = req.query.role;
        const query = { _id: new ObjectId(id) }
        const updatedDoc = {
            $set: {
                role: role
            }
        }
        const result = await userCollection.updateOne(query, updatedDoc)
        res.send(result)
    })
    app.get('/popular-instructors', async(req, res)=>{
        const query = {role : 'instructor'}
        const result = await userCollection.find(query).toArray()
        res.send(result)
    })
    //payment api
    app.post("/create-payment-intent", async (req, res) => {
        const { price } = req.body;
        const amount = Math.round(price * 100);
        const stripeClient = stripe(process.env.STRIPE_KEY);
        try {
            // Create a PaymentIntent with the order amount and currency
            const paymentIntent = await stripeClient.paymentIntents.create({
                amount: amount,
                currency: "usd",
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        } catch (error) {
            console.log(error);
            res.status(500).send({ error: "An error occurred while creating the PaymentIntent." });
        }
    });
    app.post('/payment', async (req, res) => {
        const payment = req.body;
        const insertResult = await paymentCollection.insertOne(payment);

        const enrolledQuery = { studentEmail: payment.email, classId: payment.classId }
        const enrolledClass =  await selectedClassCollection.findOne(enrolledQuery)
        const enrolledInsertResult = await enrolledClassCollection.insertOne(enrolledClass)

        const enrolledDeleteResult = await selectedClassCollection.deleteOne(enrolledQuery)

        const classQuery = { _id: new ObjectId(payment.classId) };
        const classDocument = await classCollection.findOne(classQuery); // Fetch the latest document

        if (classDocument && classDocument.seats > 0) {
            const updatedSeats = classDocument.seats - 1;
            const updateEnrolledStudents = classDocument.enrolledStudents + 1;
            const updateResult = await classCollection.updateOne(
                classQuery,
                { $set: { seats: updatedSeats, enrolledStudents : updateEnrolledStudents } }
            );

            res.send({ insertResult, updateResult, enrolledDeleteResult, enrolledInsertResult });
        }
    });
    app.get('/payment-history', async (req, res) => {
        const email = req.query.email;
        const query = {email : email}
        const result = await paymentCollection.find(query).sort({date : -1}).toArray()
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
