
//Auto Generated from MongoDB Atlas
const { MongoClient, ServerApiVersion } = require('mongodb');
const {dbUser , dbPass} = require('./config.json');

const uri  = "mongodb+srv://" + dbUser + ":" + dbPass + "@cluster0.ya4ae.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
// Create a MongoClient with a MongoClientOptions object to set the Stable API version


async function rundb() {
  const dbclient = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    // Connect the client to the server	(optional starting in v4.7)
    await dbclient.connect();
    // Send a ping to confirm a successful connection
    await dbclient.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    return dbclient;
  } catch {
    // Ensures that the client will close when you finish/error
    await dbclient.close();
  }
  
}


async function ensureAllServersExist(client) {
  const database = client.dbconn.db('Puzzle_Bot');
  const serversCollection = database.collection('servers');

  // Get the list of guilds and loop through each checking if they exist
  const guilds = client.guilds.cache//.each((guild) => {
  
  for(const [, guild] of guilds){
    const existingServer =  await serversCollection.findOne({ serverId : guild.id });

    if (!existingServer) {
      console.log(`Server ${guild.id} does not exist. Creating...`);
      
      await serversCollection.insertOne({
        'serverId' : guild.id,
        'name' : guild.name,  
        'puzzle_queue' : []
      });
    }
  }
}


module.exports = {
  ensureAllServersExist,
  rundb,
};