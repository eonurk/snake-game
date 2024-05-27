import { MongoClient, ServerApiVersion } from 'mongodb';
import Cors from 'cors';
import express from 'express';

const app = express();

const uri = process.env.MONGODB_URI;
let client = null;

// Initialize the cors middleware with correct origin
const corsOptions = {
  origin: 'https://eonurk.github.io/snake-game', // Allow requests from your GitHub Pages URL
  methods: ['GET', 'POST'], // Allow only GET and POST methods
  allowedHeaders: ['Content-Type'], // Allow Content-Type header
  credentials: true, // Allow credentials if necessary
};

app.use(Cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON bodies

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

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

app.options('/api/scores', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://eonurk.github.io/snake-game');
  res.header('Access-Control-Allow-Methods', 'GET,POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204); // No Content
});

app.get('/api/scores', async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://eonurk.github.io/snake-game');
  try {
    const db = await connectToDatabase();
    const scoresCollection = db.collection('scores');
    const scores = await scoresCollection.find().sort({ score: -1 }).limit(10).toArray();
    res.status(200).json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

app.post('/api/scores', async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://eonurk.github.io/snake-game');
  try {
    const { player, score } = req.body;
    if (!player || typeof score !== 'number') {
      res.status(400).json({ error: 'Invalid input' });
      return;
    }
    const db = await connectToDatabase();
    const scoresCollection = db.collection('scores');
    const newScore = { player, score, date: new Date() };
    await scoresCollection.insertOne(newScore);
    res.status(201).json(newScore);
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.use((req, res) => {
  res.status(405).json({ error: 'Method Not Allowed' });
});
