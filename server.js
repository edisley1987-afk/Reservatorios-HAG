const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { USER, PASS, SENSORS } = require('./config');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'readings.json');

app.use(bodyParser.json({limit: '1mb'}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(cookieParser());

// serve static
app.use(express.static(path.join(__dirname, 'public')));

// Accept POSTs on any path
app.post('*', (req, res) => {
  try {
    const body = req.body || {};
    const data = body.data || [];

    let readings = [];
    if (fs.existsSync(DATA_FILE)) {
      try { readings = JSON.parse(fs.readFileSync(DATA_FILE)); } catch(e){ readings = []; }
    }

    const timestamp = Date.now();
    for (const item of data) {
      if (item && item.ref && (SENSORS[item.ref] || true)) {
        // store raw value and timestamp
        readings.push({
          ref: item.ref,
          value: item.value,
          dev_id: item.dev_id || null,
          timestamp
        });
      }
    }

    // keep last 24 hours
    const cutoff = timestamp - 24*60*60*1000;
    readings = readings.filter(r => r.timestamp > cutoff);

    fs.writeFileSync(DATA_FILE, JSON.stringify(readings, null, 2));
    res.status(200).send('OK');
  } catch(err) {
    console.error('POST error', err);
    res.status(500).send('error');
  }
});

// API for frontend to fetch readings
app.get('/api/readings', (req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.json([]);
  try {
    const readings = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(readings);
  } catch(e){
    res.json([]);
  }
});

// simple login endpoint (POST JSON or form)
app.post('/login', (req, res) => {
  const u = req.body.user || req.query.user;
  const p = req.body.pass || req.query.pass;
  if (u === USER && p === PASS) {
    // set a cookie valid for 8 hours
    res.cookie('auth', '1', { httpOnly: true, maxAge: 8*60*60*1000 });
    return res.json({ ok: true });
  }
  res.status(401).json({ ok:false, message:'invalid' });
});

// logout
app.post('/logout', (req, res) => {
  res.clearCookie('auth');
  res.json({ ok:true });
});

// middleware to protect dashboard API routes (optional)
function requireAuth(req, res, next){
  if (req.cookies && req.cookies.auth === '1') return next();
  // allow fetching readings for demo but frontend expects login; still allow
  return res.status(401).json({ ok:false, message: 'unauthorized' });
}

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on port', PORT));
