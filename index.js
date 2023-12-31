const express = require('express');
const app = express();
const cors = require("cors");
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;


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
        const adminFeedbackCollection = client.db("Assignment12").collection("adminFeedback");

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



        const VerifyInstructor = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'instructor') {
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

        app.get('/users/instructor/:email', VerifyJWT, VerifyInstructor, async (req, res) => {
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

        app.post('/users', VerifyJWT, async (req, res) => {
            const users = req.body;
            const query = { email: users.email };
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send('success');
            }
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
        // admin routes patch d
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
            const query = { _id: new ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
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

        app.get('/adminNewClassAdd', async (req, res) => {
            const result = await ClassCollection.find().toArray();
            res.send(result);
        });



        app.get('/newClassAdd', async (req, res) => {
            const requestedStatus = req.query.status;
            let result = [];

            if (requestedStatus === 'approved') {
                result = await ClassCollection.find({ status: 'approved' }).toArray();
            } else if (requestedStatus === 'pending') {
                result = [];
            } else {
                result = await ClassCollection.find().toArray();
            }

            const limit = req.query.limit || 6;
            const limitedData = result.slice(0, limit);
            res.json(limitedData);
        });



        app.get('/PopularClass', async (req, res) => {
            const result = await ClassCollection.find({}).toArray();
            const limit = req.query.limit || 6;
            const limitedToyData = result.slice(0, limit);
            res.json(limitedToyData);
        });

        // ==========================================

        app.get('/PopularClass', async (req, res) => {
            const requestedStatus = req.query.status;
            let result = [];

            if (requestedStatus === 'approved') {
                result = await ClassCollection.find({ status: 'approved' }).toArray();
            } else if (requestedStatus === 'pending') {
                result = [];
            } else {
                result = await ClassCollection.find().toArray();
            }

            const limit = req.query.limit || 6;
            const limitedData = result.slice(0, limit);
            res.json(limitedData);
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
            const result = await usersCollection.insertOne(newClass);
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

        // =================================================================

        app.get('/student/:userEmail', async (req, res) => {
            const result = await StudentCollection.find({ userEmail: req.params.userEmail }).toArray();
            res.send(result);

        });

        app.delete('/CartStudent/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await StudentCollection.deleteOne(query);
            res.send(result);
        });


        app.get('/student/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await StudentCollection.find(query).toArray();
            res.send(result);
        });



        app.post('/create-payment-intent', VerifyJWT, async (req, res) => {
            try {
                const { price } = req.body;
                console.log(price)
                const amount = parseInt(price * 100);
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'usd',
                    payment_method_types: ['card'],
                });
                res.send({
                    clientSecret: paymentIntent.client_secret,
                });
            } catch (error) {
                console.error('Error creating payment intent:', error);
                res.status(500).send({ error: 'Failed to create payment intent.' });
            }
        });


        app.post('/payments', VerifyJWT, async (req, res) => {
            try {
                const payment = req.body;
                const insertResult = await StudentPaymentCollection.insertOne(payment);

                const deleteIds = payment.addItems.map((id) => new ObjectId(id));
                const deleteResult = await StudentCollection.deleteMany({ _id: { $in: deleteIds } });

                res.send({ insertResult, deleteResult });
            } catch (error) {
                console.error('Error processing payment:', error);
                res.status(500).send({ error: 'Failed to process payment.' });
            }
        });






        app.get('/payments', async (req, res) => {
            // const email = req.params.email;
            // const query = { email: email }
            const result = await StudentPaymentCollection.find().toArray();
            res.send(result);
        });





        app.patch('/AdminStatus/Approve/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Approve',
                }
            };
            const result = await ClassCollection.updateOne(filter, updatedDoc);
            res.send(result);

        });



        app.patch('/AdminStatus/Deny/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Deny',
                },
            };
            const result = await ClassCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });



        app.post('/AdminStatus/Deny/:id', async (req, res) => {
            const feedback = req.body.feedback;
            const result = await adminFeedbackCollection.insertOne({ feedback });
            res.send(result);
        });


        app.get('/InstructorFeedback', async (req, res) => {
            const result = await adminFeedbackCollection.find().toArray();
            res.send(result);
        });



        app.get('/PaymentHistory/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await StudentPaymentCollection.find(query).toArray();
            res.send(result);
        });


        app.get('/CourseEnrollClass/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const result = await StudentPaymentCollection.find(query).toArray();
            res.send(result);
        });













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