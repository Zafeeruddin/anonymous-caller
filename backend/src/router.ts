import express from 'express';
import fs from 'fs';
const app = express();
const port = 8888;

app.get('/api/get-sdp', (req, res) => {
    fs.readFile('C:/Users/dell/streamrtsp.sdp', 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading SDP file');
            return;
        }
        res.send(data);
    });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
