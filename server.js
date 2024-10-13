require('dotenv').config();

// server.js

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const DOMAIN = process.env.DOMAIN || `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log('Conectado ao MongoDB Atlas.');
  })
  .catch((error) => {
    console.error('Erro ao conectar ao MongoDB Atlas:', error);
  });


// Session Middleware Setup
app.use(
  session({
    secret: process.env.SECRET_KEY || 'your_default_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      // Optional settings
      ttl: 14 * 24 * 60 * 60, // Session expiration in seconds (14 days)
    }),
    cookie: { maxAge: 14 * 24 * 60 * 60 * 1000 }, // Cookie expiration in milliseconds
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
      success_url: `${DOMAIN}/success.html`,
      cancel_url: `${DOMAIN}/cancel.html`,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook para registrar a doação após o pagamento
app.post('/webhook', express.raw({ type: 'application/json' }), (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Erro no webhook:', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manipular o evento de pagamento bem-sucedido
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Registrar a doação no banco de dados
    const donation = new Donation({ amount: session.amount_total / 100 });
    donation.save().catch((err) => console.error('Erro ao salvar a doação:', err));
  }

  response.status(200).end();
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


// Start the Server (Move this to the end)
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}.`);
});

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

// Modelo de Doação
const donationSchema = new mongoose.Schema({
  amount: Number,
  date: { type: Date, default: Date.now },
});

const Donation = mongoose.model('Donation', donationSchema);
