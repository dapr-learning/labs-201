// ################ CODEBLOCK 1 - START ##############
import express from "express";

//import `redis` library
import redis from "ioredis";

// import the `Kafka` instance from the kafkajs library
import {Kafka} from 'kafkajs';
// ################ CODEBLOCK 1 - END ################

// ################ CODEBLOCK 2 - START ##############
// the client ID lets kafka know who's producing the messages
const clientId = "my-app"
// we can define the list of brokers in the cluster
const brokers = ["my-kafka:9092"]
// this is the topic to which we want to write messages
const topic = "test-topic"
// ################ CODEBLOCK 2 - END ################

// ################ CODEBLOCK 3 - START ##############
// initialize a new kafka client and initialize a producer from it
const kafka = new Kafka({ clientId, brokers })
// initialize a consumer with the client ID
const consumer = kafka.consumer({ groupId: clientId })

const redisClient = redis.createClient(6379, "redis-master");

const app = express();
app.listen(3000);
// ################ CODEBLOCK 3 - END ################

async function main() {
    // ################ CODEBLOCK 4 - START ##############
	// first, we wait for the client to connect and subscribe to the given topic
	await consumer.connect()
	await consumer.subscribe({ topic })
    let i = 0;
	await consumer.run({
		// this function is called every time the consumer gets a new message
		eachMessage: async ({ message }) => {
			// here, we just log the message to the standard output
			console.log(`received message: ${message.value}`)
            i++;
            try {
                // Set the state in redis
                redisClient.hset('order-processor||orders', 'data', `${message.value}`, 'version', i);
                console.log("Successfully persisted state.");
            } catch (error) {
                // catch and log any errors
                console.log(error);
            }
		},
	})
    // ################ CODEBLOCK 4 - END ################
}

// call the process function
main().catch(e => console.error(e));