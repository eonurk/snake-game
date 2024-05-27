import { MongoClient, ServerApiVersion } from 'mongodb';
import express from 'express';  // Import express
import cors from 'cors';  // Import cors

const uri = process.env.MONGODB_URI;
let client = null;

const app = express();
app.use(cors({ origin: 'https://eonurk.github.io/snake-game/' }));  // Enable CORS for GitHub Pages domain
app.use(express.json());

async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    try {
      await client.connect();
      console.log('Connected to database');
    } catch (error) {
      console.error('Failed to connect to database', error);
      throw new Error('Failed to connect to database');
    }
  }
  return client.db('snake-game');  // Use the name of your database
}

app.get('/api/scores', async (req, res) => {
  const db = await connectToDatabase();
  const scoresCollection = db.collection('scores');

  try {
    const scores = await scoresCollection.find().sort({ score: -1 }).limit(10).toArray();
    res.status(200).json(scores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

app.post('/api/scores', async (req, res) => {
  const db = await connectToDatabase();
  const scoresCollection = db.collection('scores');

  try {
    const { player, score } = req.body;
    const newScore = { player, score, date: new Date() };
    await scoresCollection.insertOne(newScore);
    res.status(201).json(newScore);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.all('*', (req, res) => {
  res.status(405).end(); // Method Not Allowed
});

export default app;