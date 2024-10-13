require('dotenv').config();

// server.js

const express = require('express');
const session = require('express-session');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((error) => {
    console.error('Erro ao conectar ao MongoDB Atlas:', error);
  });


// **Session Middleware Setup (Move this here)**
app.use(
  session({
    secret: process.env.SECRET_KEY || 'your_default_secret', // Ensure this is set
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }, // Session expires after 1 minute
  })
);

// Middleware Setup
app.use(bodyParser.json());
app.use(express.static('public'));

// Routes (Place after middleware setup)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/success.html', (req, res) => {
  const paymentSessionId = req.query.session_id;
  if (req.session.paymentSessionId === paymentSessionId) {
    // Clear the session ID after successful access
    req.session.paymentSessionId = null;
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
  } else {
    // Redirect to home if session is invalid
    res.redirect('/');
  }
});


// Rota para o cancel.html
app.get('/cancel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cancel.html'));
});

// Endpoint para criar uma sessão de checkout
app.post('/create-checkout-session', async (req, res) => {

    // Generate a unique session ID
    const paymentSessionId = Math.random().toString(36).substring(2, 15);
    req.session.paymentSessionId = paymentSessionId;
  
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Adopt a Stone',
          },
          unit_amount: 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `http://localhost:3000/success.html?session_id=${paymentSessionId}`,
      cancel_url: 'http://localhost:3000/cancel.html',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para salvar uma nova pedra
app.post('/save-stone', async (req, res) => {
  let newStone = req.body;

  try {
    // Verificar se o userCode já existe na requisição
    let userCode = newStone.userCode;
    if (!userCode) {
      // Gerar um código alfanumérico único para o usuário
      userCode = Math.random().toString(36).substring(2, 10);
      newStone.userCode = userCode;
    }

    const stone = new Stone(newStone);
    await stone.save();

    // Enviar o userCode de volta ao cliente
    res.json({ message: 'Pedra salva com sucesso', userCode: userCode });
  } catch (error) {
    console.error('Erro ao salvar a pedra:', error);
    res.status(500).json({ error: 'Erro ao salvar a pedra' });
  }
});


// Rota para obter todas as pedras
app.get('/get-stones', async (req, res) => {
  try {
    const stones = await Stone.find({});
    res.json(stones);
  } catch (error) {
    console.error('Erro ao obter as pedras:', error);
    res.status(500).json({ error: 'Erro ao obter as pedras' });
  }
});

app.use(
  session({
    secret: process.env.SECRET_KEY, // Replace with a secure key
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 }, // Session expires after 1 minute
  })
);

// Start the Server (Move this to the end)
const PORT = process.env.PORT || 3000;

// Mongoose Schema and Model
const stoneSchema = new mongoose.Schema({
  nome: String,
  imagem: String,
  localizacao: String,
  descricao: String,
  x: Number,
  y: Number,
  userCode: String,
});

const Stone = mongoose.model('Stone', stoneSchema);