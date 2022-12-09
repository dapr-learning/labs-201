const express = require('express');
const bodyParser = require('body-parser');
require('isomorphic-fetch');

const APP_PORT = process.env.APP_PORT ?? '3000';

const daprPort = process.env.DAPR_HTTP_PORT ?? "3500";

const stateStoreName = `statestore`;
const stateUrl = `http://localhost:${daprPort}/v1.0/state/${stateStoreName}`;

const app = express();
app.use(bodyParser.json({ type: 'application/*+json' }));

// Dapr subscription needs to be told what topics to subscribe to and what route to call
app.get('/dapr/subscribe', (_req, res) => {
    res.json([
        {
            pubsubname: "orderpubsub",
            topic: "test-topic",
            route: "test-topic",
        },
    ]);
});

// Dapr subscription routes ordersAgain topic to this route
app.post('/test-topic', async (req, res) => {
    console.log("Subscriber received on test-topic:", req.body);
    const state = [{
        key: "order",
        value: req.body
    }];

    try {
        // Persist the state i.e. order
        const response = await fetch(stateUrl, {
            method: "POST",
            body: JSON.stringify(state),
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (!response.ok) {
            throw "Failed to persist state.";
        }
        console.log("Successfully persisted state.");
        res.sendStatus(200);
    } catch (error) {
        console.log(error);
        res.status(500).send({message: error});
    }
});

app.listen(APP_PORT);  