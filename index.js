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
     

        const Assignment11 = client.db('Assignment11').collection('Assignment11');

      

        // //==================================
        // // all toy section 
        // //================================

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
