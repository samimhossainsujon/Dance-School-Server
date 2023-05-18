const express = require('express')
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');


const port = process.env.PORT || 5000;
require('dotenv').config();

app.use(cors());
app.use(express.json());





//=================================
//mongodb used configuration
//================================

const uri = `mongodb+srv://${process.env.DV_USER}:${process.env.DV_PASS}@cluster0.f7u6kbd.mongodb.net/?retryWrites=true&w=majority`;

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
       
        // await client.connect();

        const serviceCollection = client.db('Assignment-11').collection('Assignment-11');
        const bookingCollection = client.db('Assignment-11').collection('Assignment-11');

    
        app.get("/")


        
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
       
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})