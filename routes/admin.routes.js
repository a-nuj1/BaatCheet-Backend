import express from "express";

const app = express.Router();

app.get('/')

app.post('/verify');

app.get('/logout');

app.get('/users');
app.get('/chats');
app.get('/messages');





export default app;