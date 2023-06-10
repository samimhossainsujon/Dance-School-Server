const express = require('express');
const app = express();
const cors = require("cors");
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();


const stripe = require("stripe")(process.env.Payment_Secret_Key);



app.use(cors());
app.use(express.json());



//====================================
// jwt verify function
//=====================================

const VerifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'try aging' });
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'try aging' })
        }
        req.decoded = decoded;
        next();
    })
}



//=================================
// MongoDB configuration
//================================

const uri = `mongodb+srv://${process.env.DV_USER}:${process.env.DV_PASS}@cluster0.f7u6kbd.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {

        //====================================
        // all collection methods
        //=====================================

        const usersCollection = client.db("Assignment12").collection("users");
        const ClassCollection = client.db("Assignment12").collection("class");
        const InstructorCollection = client.db("Assignment12").collection("instructor");
        const StudentCollection = client.db("Assignment12").collection("student");
        const StudentPaymentCollection = client.db("Assignment12").collection("payment");

        //====================================
        //jwt access token 
        //=====================================
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
            res.send({ token })
        });

        // ==================================
        // verify admin 
        // =================================

        const VerifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'try aging' });
            }
            next();
        }



        //====================================
        // dashboard admin routes
        //=====================================

        app.get('/users/admin/:email', VerifyJWT, VerifyAdmin, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return res.send({ admin: false });
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' };
            res.send(result);
        });



        //====================================
        // dashboard instructor added 
        //=====================================

        app.get('/users/instructor/:email', VerifyJWT, async (req, res) => {
            const email = req.params.email;
            if (req.decoded.email !== email) {
                return res.send({ instructor: false });
            }
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' };
            res.send(result);
        });





        //====================================
        // user data post request
        //=====================================

        app.post('/users', async (req, res) => {
            const users = req.body;
            const result = await usersCollection.insertOne(users);
            res.send(result);
        });



        //====================================
        // users get request
        //=====================================

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });



        //====================================
        // admin routes patch 
        //=====================================

        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    role: 'admin',
                }
            };
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);

        });


        //====================================
        // instructor patch request
        //=====================================

        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };

            const updatedDoc = {
                $set: {
                    role: 'instructor',
                }
            };
            const result = await usersCollection.updateOne(filter, updatedDoc);
            res.send(result);

        });


        //====================================
        // user delete  method
        //=====================================

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ClassCollection.deleteOne(query);
            res.send(result);
        });


        //=================================
        // new class added 
        //===================================

        app.post('/newClassAdd', async (req, res) => {
            const newClass = req.body;
            const result = await ClassCollection.insertOne(newClass);
            res.send(result);
        })



        app.delete('/ClassData/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await ClassCollection.deleteOne(query);
            res.send(result);
        });



        //====================================
        // new class get request
        //=====================================

        app.get('/newClassAdd', async (req, res) => {
            const result = await ClassCollection.find().toArray();
            res.send(result);
        });



        app.get('/PopularClass', async (req, res) => {
            const result = await ClassCollection.find({}).toArray();
            const limit = req.query.limit || 6;
            const limitedToyData = result.slice(0, limit);
            res.json(limitedToyData);
        });


        //====================================
        //  updated  class 
        //=====================================

        app.put('/UpdateClass/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const UpdatedData = req.body;
            const updatedDoc = {
                $set: {
                    photoUrl: UpdatedData.photoUrl,
                    ClassName: UpdatedData.ClassName,
                    InstructorName: UpdatedData.InstructorName,
                    InstructorEmail: UpdatedData.InstructorEmail,
                    Price: UpdatedData.Price,
                    AvailableSeats: UpdatedData.AvailableSeats,
                    Rating: UpdatedData.Rating
                }
            };
            const result = await ClassCollection.updateOne(filter, updatedDoc, options);
            res.send(result);


        });







        app.post('/newInstructorAdd', async (req, res) => {
            const newClass = req.body;
            const result = await InstructorCollection.insertOne(newClass);
            res.send(result);
        })



        app.get('/Instructor', async (req, res) => {
            const result = await InstructorCollection.find().toArray();
            res.send(result);
        });


        app.get('/PopularInstructor', async (req, res) => {
            const result = await InstructorCollection.find({}).toArray();
            const limit = req.query.limit || 6;
            const limitedToyData = result.slice(0, limit);
            res.json(limitedToyData);
        });


        app.delete('/InstructorData/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await InstructorCollection.deleteOne(query);
            res.send(result);
        });






        app.post('/student', async (req, res) => {
            const BuyClass = req.body;
            const result = await StudentCollection.insertOne(BuyClass);
            res.send(result);
        });

        app.get('/Student', async (req, res) => {
            const result = await StudentCollection.find().toArray();
            res.send(result);
        });

        app.get('/student/:userEmail', async (req, res) => {
            try {
                const result = await StudentCollection.find({ userEmail: req.params.userEmail }).toArray();
                res.send(result);
            } catch (error) {
                console.error('Error retrieving student data:', error);
                res.status(500).send('Failed to retrieve student data.');
            }
        });

        app.delete('/CartStudent/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await StudentCollection.deleteOne(query);
            res.send(result);
        });



        app.post("/create-payment-intent", async (req, res) => {
            const { Price } = req.body;
            const amount = Price * 100;
            console.log(Price)
            console.log(amount)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })       
             
          

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
