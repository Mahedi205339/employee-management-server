const express = require('express')
const app = express();
const cors = require('cors');
require('dotenv').config()
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//middleware 
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0r9jhzc.mongodb.net/?retryWrites=true&w=majority`;

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
    const usersCollection = client.db("EmployeeDB").collection("users")
    const employeeCollection = client.db("EmployeeDB").collection("employees")


    app.post('/jwt', async (req, res) => {
        try {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
            res.send({ token });
        } catch {
            error => console.log(error)
        }

    })


    const verifyToken = (req, res, next) => {
        try {
            // console.log('inside verify token', req.headers.authorization)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: 'Unauthorize access' })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'forbidden access' })
                }
                req.decoded = decoded;
                next()
            })
        } catch {
            error => console.log(error)
        }
    }

    users

    app.post('/users', async (req, res) => {
      try {
        const user = req.body;
        //insert email if user does not exists: 
        //you can do this many ways (1.email unique , 2.upsert , 3.simple checking)
        const query = { email: user.email }
        const existingUser = await usersCollection.findOne(query)
        if (existingUser) {
          return res.send({ message: 'user already exist', insertedId: null })
        }
        const result = await usersCollection.insertOne(user);
        res.send(result)
      } catch {
        error => console.log(error)
      }
    })

    //employee 

    app.post('/employee', async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email }
        const existingUser = await employeeCollection.findOne(query)
        if (existingUser) {
          return res.send({ message: 'user already exist', insertedId: null })
        }
        const result = await employeeCollection.insertOne(user);
        res.send(result)
      } catch {
        error => console.log(error)
      }
    })

    app.get(('/employee'), async (req, res) => {
      const result = await employeeCollection.find().toArray()
      res.send(result)
    })
    app.get(('/employee/:id'), async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await employeeCollection.findOne(query)
      res.send(result)
    })

    app.patch('/employee/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const data = req.body
        const filter = { _id: new ObjectId(id) }
        const updatedDoc = {
          $set: {
            verified: "true"

          }
        }
        console.log(result)
        const result = await employeeCollection.updateOne(filter, updatedDoc)
        res.send(result)
      } catch {
        error => console.log(error)
      }
    })




    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Employee is running ')
})

app.listen(port, () => {
  console.log(`Employee management running on port ${port}`)
})