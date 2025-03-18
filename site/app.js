const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const multer = require('multer');
const nodemailer = require('nodemailer');
const app = express();
const port = 8082;

app.use(session({
  secret: 'segredo',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'seu_email@gmail.com',
    pass: 'sua_senha'
  }
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'sistema_login',
  insecureAuth: true
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('Conectado ao banco de dados MySQL');
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


app.get('/', (req, res) => {
  res.redirect('/index');
});

app.get('/ir-blog', (req, res) => {
  res.redirect('/inde')
});

app.post('/ir-login', (req, res) => {
  res.redirect('/login')
});

app.get('/index', (req, res) => {
  res.render("index");
});

app.get('/login', (req, res) => {
  res.render("login");
});

app.post('/create-account', (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).send('Erro ao criar conta: ' + err.message);
    }

    const query = 'INSERT INTO usuarios (username, password, email) VALUES (?, ?, ?)';
    db.query(query, [username, hashedPassword, email], (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }

      res.status(201).send(`
        
            <script>
              
                alert('conta criada com sucesso!')
                window.location.href = '/login';

            </script>
          
      `);
    });
  });
});

app.post('/forgot-password', (req, res) => {
  const email = req.body.email;

  const query = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(query, [email], (err, result) => {
    if (err) {
      return res.status(500).send('Erro ao buscar usuário: ' + err.message);
    }

    if (result.length === 0) {
      return res.status(404).send('Usuário não encontrado');
    }

    const token = Math.random().toString(36).substr(2, 10);

    const updateQuery = 'UPDATE usuarios SET recovery_token = ? WHERE email = ?';
    db.query(updateQuery, [token, email], (err, result) => {
      if (err) {
        return res.status(500).send('Erro ao atualizar token: ' + err.message);
      }

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'testador192@gmail.com',
          pass: 'aenxvpdisacbajib'
        }
      });

      const mailOptions = {
        from: 'testador192@gmail.com',
        to: email,
        subject: 'Recuperação de senha',
        text: `Olá, você solicitou a recuperação de senha. Seu token de recuperação é: ${token}`
      };

      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          return res.status(500).send('Erro ao enviar e-mail: ' + err.message);
        }

        res.send('E-mail de recuperação de senha enviado com sucesso!');
      });
    });
  });
});

app.post('/reset-password', (req, res) => {
  const token = req.body.token;
  const password = req.body.password;

  const query = 'SELECT * FROM usuarios WHERE recovery_token = ?';
  db.query(query, [token], (err, result) => {
    if (err) {
      return res.status(500).send('Erro ao buscar usuário: ' + err.message);
    }

    if (result.length === 0) {
      return res.status(404).send('Token inválido');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const updateQuery = 'UPDATE usuarios SET password = ?, recovery_token = NULL WHERE recovery_token = ?';
    db.query(updateQuery, [hashedPassword, token], (err, result) => {
      if (err) {
        return res.status(500).send('Erro ao atualizar senha: ' + err.message);
      }

      res.send('Senha atualizada com sucesso!');
    });
  });
});

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  const query = 'SELECT * FROM usuarios WHERE username = ?';
  db.query(query, [username], (err, result) => {
    if (err) {
      return res.status(500).send('Erro ao buscar usuário: ' + err.message);
    }

    if (result.length === 0) {
      return res.status(401).send('Usuário não encontrado');
    }

    const user = result[0];
    const hashedPassword = user.password;

    bcrypt.compare(password, hashedPassword, (err, isMatch) => {
      if (err) {
        return res.status(500).send('Erro ao comparar senhas: ' + err.message);
      }

      if (!isMatch) {
        return res.status(401).send(`
        
            <script>
              
                alert('senha incorreta')
                window.location.href = '/login';

            </script>
          
      `);
      }


      req.session.usuario = user;
      res.redirect('/tela');
    });
  });
});


function getUserById(id, callback) {
  const query = 'SELECT * FROM usuarios WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return callback(err);
    }
    if (result.length === 0) {
      return callback(new Error('Usuário não encontrado'));
    }
    callback(null, result[0]);
  });
};


app.get('/tela', (req, res) => {

  if (!req.session || !req.session.usuario) {
    return res.status(401).send(` <script>
        alert('usuário não autenticado')                
        window.location.href = '/login';
      </script>`);
  }

  const userId = req.session.usuario.id;

  getUserById(userId, (err, user) => {
    if (err) {
      return res.status(500).send('Erro ao obter usuário.');
    }


    res.render('tela', {
      username: user.username,
      email: user.email,
      profilePic: user.profile_pic,
      id: user.id
    });
  });
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('profilePic'), (req, res) => {
  if (!req.file) {
    return res.status(400).send(`
        <script>
            alert('nenhum arquivo enviado');
            window.location.href = '/tela';
        </script>
    `);
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  const userId = req.session.usuario ? req.session.usuario.id : null;

  if (!userId) {
    return res.status(401).send(`
        <script>
            alert('usuário não autenticado');                
            window.location.href = '/login';
        </script>
    `);
  }

  const query = 'UPDATE usuarios SET profile_pic = ? WHERE id = ?';

  db.query(query, [imageUrl, userId], (err, result) => {
    if (err) {
      return res.status(500).send('Erro ao atualizar imagem de perfil: ' + err.message);
    }

    req.session.usuario.profile_pic = imageUrl;

    res.send(`
        <script>
            alert('Foto de perfil atualizada com sucesso!');
            window.location.href = '/tela';
        </script>
    `);
  });
});

function handleUpload() {
  const formData = new FormData();
  const fileInput = document.querySelector('input[type="file"]');
  formData.append('profilePic', fileInput.files[0]);

  fetch('/upload', {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(data => {
      const profilePicElement = document.getElementById('profilePic');
      profilePicElement.src = data.imageUrl + '?timestamp=' + new Date().getTime();

    })
    .catch(error => {
      console.error('Erro ao fazer upload:', error);
    });
}

app.post('/api/logout', (req, res) => {

  if (req.session.usuario) {

    req.session.destroy(err => {
      if (err) {
        return res.status(500).send({ error: 'Erro ao sair.' });
      }
      res.send({ success: true });
    });
  } else {
    res.status(400).send({ error: 'Usuário não autenticado.' });
  }
});

app.listen(port, () => {
  console.log(`App rodando na porta http://localhost:${port}`);
});