const express = require('express');
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
const { ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());

//=================================
// MongoDB configuration
//================================

const uri = `mongodb+srv://${process.env.DV_USER}:${process.env.DV_PASS}@cluster0.f7u6kbd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        await client.connect();

        const Assignment11 = client.db('Assignment11').collection('Assignment11');

        const indexKeys = { ToyName: 1 };
        const indexOptions = { name: "ToyName" };
        const result = await Assignment11.createIndex(indexKeys, indexOptions);

        app.get('/allToySearch/:text', async (req, res) => {
            const searchText = req.params.text;
            try {
                const result = await Assignment11.find({
                    ToyName: { $regex: searchText, $options: "i" }
                }).toArray();
                res.send(result);
                console.log(result);
            } catch (error) {
                console.log(error);
                res.status(500).send('Internal Server Error');
            }
        });




        app.post("/addToy", async (req, res) => {
            const body = req.body;
            const result = await Assignment11.insertOne(body);
            res.send(result);
        });

        //==================================
        // all toy section 
        //================================

        app.get('/allToy', async (req, res) => {
            try {
                const result = await Assignment11.find({}).toArray();
                const limit = req.query.limit || 20;
                const limitedToyData = result.slice(0, limit);

                res.json(limitedToyData);
            } catch (error) {
                console.log(error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        //================================
        // update data form id 
        //=================================

        app.get('/UpdateMyToys/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            // const myToy = await Assignment11.findOne({_id: new ObjectId(id)});
            const query = { _id: new ObjectId(id) }
            const result = await Assignment11.findOne(query)
            console.log(query);
            res.send(result);

        });



        //=====================================
        // update a single data form id 
        //======================================

        app.put('/updateMyToys/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const UpdatedData = req.body;
            const update = {
                $set: {
                    photoUrl: UpdatedData.photoUrl,
                    ToyName: UpdatedData.ToyName,
                    price: UpdatedData.price,
                    rating: UpdatedData.rating,
                    availableQuantity: UpdatedData.availableQuantity,
                    SellerName: UpdatedData.SellerName,
                    detailsPage: UpdatedData.detailsPage,
                    sellerEmail: UpdatedData.sellerEmail,
                }
            }
            const result = await Assignment11.updateOne(filter, update, options);
            res.send(result);
        });



        //========================================
        // delete a single date from my toys 
        //==========================================

        app.delete('/updateMyToys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await Assignment11.deleteOne(query);
            res.send(result);
        });



        //========================================
        // ToyDetails added 
        //=========================================

        app.get('/ToyDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await Assignment11.findOne(query)
            console.log(query);
            res.send(result);

        });




        //========================================
        // sub categories 
        //==========================================

        app.get("/allToy/:text", async (req, res) => {
            console.log(req.params.text);
            if (
                req.params.text === "Programmable" ||
                req.params.text === "RemoteControl" ||
                req.params.text === "TransformingRobots"
            ) {
                const result = await Assignment11.find({ status: req.params.text }).toArray();
                console.log(result);

                const limit = req.query.limit || 3;
                const limitedToyData = result.slice(0, limit);

                return res.json(limitedToyData);
            }
            const result = await Assignment11.find({}).toArray();
            console.log(result);
            const limit = req.query.limit || 3;
            const limitedToyData = result.slice(0, limit);
            res.json(limitedToyData);
        });









        //==================================
        // my post toys section
        //================================

        app.get('/myToys/:sellerEmail', async (req, res) => {
            try {
                const result = await Assignment11.find({ sellerEmail: req.params.sellerEmail }).toArray();
                res.send(result);
            } catch (error) {
                console.log(error);
                res.status(500).send('Internal Server Error');
            }
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
