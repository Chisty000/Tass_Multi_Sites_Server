const express = require('express');
const mysql = require('mysql');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ticketing',
});

app.use((req, res, next) => {
  const subdomain = req.headers.host.split('.')[0];

  // query the subdomains table to see if the subdomain exists
  pool.query('SELECT * FROM subdomains WHERE subdomain = ?', [subdomain], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    // if subdomain exists, attach it to the request object
    if (results.length > 0) {
      req.subdomain = results[0].subdomain;
      next();
    } else {
      // if subdomain doesn't exist, send a 404 error message
      res.status(404).send('Subdomain not found');
    }
  });
});
// Subdomain Middleware
app.use((req, res, next) => {
  const subdomains = req.headers.host.split('.');
  const subdomain = subdomains.length > 0 ? subdomains[0] : '';
  req.subdomain = subdomain;
  next();
});

app.get('/', (req, res) => {
  const { subdomain } = req;

  if (subdomain === 'localhost') {
    // Render the root page from the views directory
    res.render('root');
  } else {
    // Render the index page and pass subdomain data to the view
    const { subdomains } = req;
    pool.query('SELECT id FROM subdomains WHERE subdomain = ?', [subdomain], (err, results) => {
      if (err) throw err;
  
      if (results.length === 0) {
        // Subdomain not found, return 404
        res.status(404).send('Subdomain not found');
      } else {
        const subdomainId = results[0].id;
  
        // Retrieve destinations associated with subdomain ID from destinations table
        pool.query('SELECT * FROM destinations WHERE subdomain_id = ?', [subdomainId], (err, results) => {
          if (err) throw err;
  
          res.render('index', {subdomains,subdomain,destinations:results});
        });
      }
    });
    //res.render('index', { subdomains, subdomain });
  }
});

app.get('/booking/:id', (req, res) => {
    const { subdomain } = req;
  
    if (subdomain === 'localhost') {
      // Render the root page from the views directory
      res.send('404 error');
    } else {
      // Render the index page and pass subdomain data to the view
      const { subdomains } = req;
      const bookingId = req.params.id;
      pool.query('SELECT * FROM destinations WHERE id = ? AND subdomain_id = (SELECT id FROM subdomains WHERE subdomain = ?)', [bookingId, subdomain], (error, results) => {
        if (error) throw error;
        const destination = results[0];
    
        // Query the database to fetch the contact information for the subdomain based on the phone number field
        pool.query('SELECT * FROM contacts WHERE subdomain_id = (SELECT id FROM subdomains WHERE subdomain = ?)', [subdomain], (error, results) => {
          if (error) throw error;
          const contact = results[0];
    
          // Render the EJS template with the contact and destination information
          res.render('booking.ejs', { contact, destination,subdomain });
        });
      });
      //res.render('booking', { subdomains, subdomain,bookingId });
    }
  });


  // Route for the about page
app.get('/about', (req, res) => {
  const { subdomain } = req;

  // Query the database to get the about paragraph for the current subdomain
  pool.query(
    'SELECT about_text FROM abouts INNER JOIN subdomains ON abouts.subdomain_id = subdomains.id WHERE subdomains.subdomain = ?',
    [subdomain],
    (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
      }

      if (results.length === 0) {
        return res.status(404).send('Page not found');
      }
      console.log(results)
      const about = results[0].about_text;
      console.log(about)

      // Render the about page and pass the about data to the view
      res.render('about', { subdomain, about });
    }
  );
});

app.get('/contact', (req, res) => {
  const { subdomain } = req;

  pool.query(`SELECT * FROM contacts WHERE subdomain_id IN (SELECT id FROM subdomains WHERE subdomain = '${subdomain}')`, (err, results) => {
    if (err) throw err;
    email=results[0].email
    phone=results[0].phone
    address=results[0].address
    res.render('contact',{subdomain,email,phone,address})
  });
});




app.listen(80, () => {
  console.log('Server listening on port 80');
});
