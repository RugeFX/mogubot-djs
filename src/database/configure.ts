import mongoose from 'mongoose';

export default async function configureDB() {
	mongoose.connection.on('connected', () => {
		console.log('Connected to DB!');
	});
	mongoose.connection.on('disconnected', () => {
		console.log('Disonnected from DB!');
	});
	mongoose.connection.on('err', (err) => {
		console.log('DB Error :' + err);
	});

	await mongoose.connect(process.env.DATABASE_URL!);
}
