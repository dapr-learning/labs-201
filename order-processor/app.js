const express = require('express');
const bodyParser = require('body-parser');
require('isomorphic-fetch');

//import `redis` library
const redis = require('ioredis');

// import the `Kafka` instance from the kafkajs library
const { Kafka } = require("kafkajs")

const app = express();
app.listen(3000);
app.use(bodyParser.json());

const redisClient = redis.createClient(6379, "redis-master");

console.log('In order-processor!');

// the client ID lets kafka know who's producing the messages
const clientId = "my-app"
// we can define the list of brokers in the cluster
const brokers = ["my-kafka:9092"]
// this is the topic to which we want to write messages
const topic = "test-topic"

// initialize a new kafka client and initialize a producer from it
const kafka = new Kafka({ clientId, brokers })

// initialize a consumer with the client ID
const consumer = kafka.consumer({ groupId: clientId })

const consume = async () => {
	// first, we wait for the client to connect and subscribe to the given topic
	await consumer.connect()
	await consumer.subscribe({ topic })
	await consumer.run({
		// this function is called every time the consumer gets a new message
		eachMessage: async ({ message }) => {
			// here, we just log the message to the standard output
			console.log(`received message: ${message.value}`)
            // take out the message value
            const orderVal = `${message.value}`;
            try {
                // Set the state in redis
                redisClient.set('order',JSON.stringify(orderVal))
                console.log("Successfully persisted state.");
            } catch (error) {
                // catch and log any errors
                console.log(error);
            }
		},
	})
}

// call the consume function
consume().catch((err) => {
	console.error("error in consumer: ", err)
})

// simply checking if the redis connection is fine
redisClient.on('connect', function() {
    console.log('Redis Connected!');
  });

// if there is an error in redis connection, log it
redisClient.on('error', err => {
    console.log('Redis Error: ' + err);
});