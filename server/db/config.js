// creating two separate databases, for dev and test
let env = process.env.NODE_ENV || 'development';
if (env === 'development') {
  process.env.PORT = 3000;
  process.env.dbURL = 'mongodb://localhost:27017/ToDo';
}
else if (process.env.NODE_ENV === 'test') {
  process.env.PORT = 3000;
  process.env.dbURL = 'mongodb://localhost:27017/ToDoTest';
}
