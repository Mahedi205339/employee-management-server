const express = require('express')
const app = express();
const cors = require('cors');
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const jwt = require('jsonwebtoken');
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
    const worksheetCollection = client.db("EmployeeDB").collection("worksheet")
    const paymentsCollection = client.db("EmployeeDB").collection("payments")
    const servicesCollection = client.db("EmployeeDB").collection("services")
    const contactCollection = client.db("EmployeeDB").collection("contactUs")


    app.post('/jwt', async (req, res) => {
      try {
        const user = req.body;
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        res.send({ token });
      } catch {
        error => console.log(error)
      }

    })


    const verifyToken = (req, res, next) => {
      try {
        console.log('inside verify token', req.headers.authorization)
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

    // const verifyAdmin = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email };
    //   const user = await employeeCollection.findOne(query);
    //   const isAdmin = user?.designation === 'admin';
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }
    //   next()
    // }
    // const verifyHR = async (req, res, next) => {
    //   const email = req.decoded.email;
    //   const query = { email: email };
    //   const user = await employeeCollection.findOne(query);
    //   const isAdmin = user?.designation === 'HR';
    //   if (!isAdmin) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }
    //   next()
    // }

    // users

    // admin 
    app.get('/employee/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' })
      }
      const query = { email: email }
      const user = await employeeCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.designation === 'admin'
      }
      res.send({ admin })
    })
    // HR 
    app.get('/employee/hr/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'unauthorized access' })
      }
      const query = { email: email }
      const user = await employeeCollection.findOne(query);
      let HR = false;
      if (user) {
        HR = user?.designation === 'HR'
      }
      res.send({ HR })
    })

    app.post('/users', async (req, res) => {
      try {
        const user = req.body;

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

    app.get(('/employee'), verifyToken, async (req, res) => {
      const result = await employeeCollection.find().toArray()
      res.send(result)
    })


    app.get(('/employee/:email'), async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await employeeCollection.findOne(query)
      res.send(result)
    })

    app.patch('/employee/HR/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: new ObjectId(id) }
        const updatedDoc = {
          $set: {
            verified: true

          }
        }
        const result = await employeeCollection.updateOne(filter, updatedDoc)
        res.send(result)
      } catch {
        error => console.log(error)
      }
    })

    app.patch('/employee/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          designation: 'HR'
        }
      }
      const result = await employeeCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })


    app.delete('/employee/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await employeeCollection.deleteOne(query)
      res.send(result)
    })
    //worksheet
    app.post('/worksheet', async (req, res) => {
      try {
        const worksheet = req.body;
        const result = await worksheetCollection.insertOne(worksheet);
        res.send(result)
      } catch {
        error => console.log(error)
      }
    })

    app.get('/worksheet', async (req, res) => {
      const result = await worksheetCollection.find().toArray()
      res.send(result)
    })
    app.get('/worksheet/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await worksheetCollection.findOne(query);
      res.send(result)
    })

    // payment 

    app.post('/create-payment-intent', async (req, res) => {
      const { salary } = req.body;
      const amount = parseInt(salary);
      console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });

    app.post('/payments', verifyToken, async (req, res) => {
      try {
        const payment = req.body;
        const paymentResult = await paymentsCollection.insertOne(payment)
        console.log('payment info', payment)

        res.send(paymentResult)
      }
      catch {
        error => console.log(error)
      }
    })



    app.get('/payments/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const result = await paymentsCollection.find(query).toArray()
      res.send(result)
    })
    app.get('/payments/', verifyToken, async (req, res) => {
      const result = await paymentsCollection.find().toArray()
      res.send(result)
    })

    app.get('/services', async (req, res) => {
      const result = await servicesCollection.find().toArray()
      res.send(result)
    })
    //contact us 
    app.post('/contact', async (req, res) => {
      const contact = req.body;
      const result = await contactCollection.insertOne(contact)
      res.send(result)
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