import express from 'express'
import { matchRouter } from './routes/matches.js ';

const app = express();
const PORT = 8000;

// middleware
app.use(express.json());

// root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Express server!' });
});

app.use("/matches", matchRouter)

// start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}. Access via http://localhost:${PORT}`);
});
