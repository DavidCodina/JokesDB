
const path                        = require('path');
const bodyParser                  = require('body-parser');
const { check, validationResult } = require('express-validator');
const express                     = require('express');
const MongoClient                 = require('mongodb').MongoClient; //Create a MongoClient object.
const ObjectId                    = require('mongodb').ObjectId;		//Also get the ObjectId method for (deleting, and/or updating);
const app                         = express();
const url                         = 'mongodb://<USER_NAME>:<PASSWORD>@ds241537.mlab.com:41537/jokes';
const dbName                      = 'jokes';
const client                      = new MongoClient(url, { useNewUrlParser: true });

////////////////////////////////////////////////////////////////////////////////
//
//	Regarding: { useNewUrlParser: true }
//
//	DeprecationWarning: current URL string parser is deprecated,
//	and will be removed in a future version. To use the new parser,
//	pass option { useNewUrlParser: true } to MongoClient.connect.
//
////////////////////////////////////////////////////////////////////////////////


//View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.use(bodyParser.json());	//Currently not using
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));


//These variables need to be initialized globally.
//Otherwise our conditional statements in index.ejs will respond with a ReferenceError.
app.use((req, res, next) => {
	res.locals.errorsArray       = null;
	res.locals.newJoke           = null;
	res.locals.jokesArray        = null;
	next();
});


app.locals.docs = null;


/* =============================================================================
													     Connection
============================================================================= */


client.connect((err) => {
	if(err) { throw err; }
	const db = client.db(dbName);
	console.log("\nConnected successfully to: " + db.databaseName);


	/* ===========================================================================
													Routes (Inside of connection)
	=========================================================================== */


	app.get('/', (req, res) => {
		db.collection('jokes_collection').find({}).toArray((err, docs) => {
	    if (err) { throw err; }

			//Update app.locals.docs every time we get docs.
			//This way, app.post() will also have access to them.
			app.locals.docs = docs;

			console.log("\nFound records.");

			const data = { title: 'JokesDB', jokesArray: docs };

		  res.render('index', data);
	  });
	});


	app.get('/submissionSuccess', (req, res) => {
		db.collection('jokes_collection').find({}).toArray((err, docs) => {
	    if (err) { throw err; }
			console.log("\nFound records.");
			const data = { title: 'Submission Success!!!' };
			res.render('success', data);
	  });
	});


	app.post('/jokes/add', [
		  check('question').not().isEmpty().withMessage('The question is required.'),
		  check('answer').not().isEmpty().withMessage('The answer is required.')
	  ],

	  (req, res) => {
			const errors = validationResult(req);
			const newJoke = {
				question: req.body.question,
				answer:   req.body.answer
			};

			if ( !errors.isEmpty() ) {
				console.log('\n\nThe form submission was invalid:\n');
					let errorsArray = [];

					for (let i = 0; i < errors.errors.length; i++){
						errorsArray.push(errors.errors[i].msg);
					}

					const data = {
						title:'JokesDB',
						errorsArray,
						newJoke,
						jokesArray: app.locals.docs
					};

					res.render('index', data);
		  } else {
				const outerRes = res;
				db.collection('jokes_collection').insertOne(newJoke, (err, res) => { //NOT (req, res) => {} !!!
		      if (err) { throw err; }
		      console.log(`\nThe following document has been inserted into the jokes_collection:\n ${JSON.stringify(newJoke)}\n\n`);
					outerRes.redirect('/submissionSuccess');
				});
		  }
		}
	);


	app.delete('/jokes/delete/:id', (req, res) => {
		db.collection('jokes_collection').deleteOne({_id: ObjectId(req.params.id)}, (err, obj) => {
      if (err) { return err; }

			console.log("\n\nDeleted: " + req.params.id);
			res.status(200).json({message: "The document has been deleted."});

    });
	});
});//End of client.connect();


app.listen(3000, () => { console.log('\nServer listening on Port 3000...'); });
