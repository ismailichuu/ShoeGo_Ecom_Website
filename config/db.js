import mongoose from 'mongoose';
import process from 'process';

const mongoString = process.env.MONGOSTRING;

const mongoConnect = () => {
  return mongoose
    .connect(mongoString)
    .then(() => {
      console.log('Database Connected Successfully');
    })
    .catch((err) => console.log('Database error', err));
};

export default mongoConnect;
