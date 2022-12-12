// ################ CODEBLOCK 1 - START ##############
import { DaprClient, DaprServer } from '@dapr/dapr';
// ################ CODEBLOCK 1 - END ################

// ################ CODEBLOCK 2 - START ##############
const SERVER_HOST = process.env.SERVER_HOST || "127.0.0.1";
const APP_PORT = process.env.APP_PORT ?? '3000';
const DAPR_HOST = process.env.DAPR_HOST || "http://localhost";
const DAPR_PORT = process.env.DAPR_HTTP_PORT ?? "3500";
// ################ CODEBLOCK 2 - END ################

// ################ CODEBLOCK 3 - START ##############
const server = new DaprServer(SERVER_HOST, APP_PORT, DAPR_HOST, DAPR_PORT);
const client = new DaprClient(DAPR_HOST, DAPR_PORT)
// ################ CODEBLOCK 3 - END ################

async function main() {
    // ################ CODEBLOCK 4 - START ##############
    server.pubsub.subscribe("orderpubsub", "test-topic", async (order) => {
        console.log("Subscriber received: " + JSON.stringify(order))
        const state = [{
            key: "orders",
            value: order        }];
        // Save state into a state store
        await client.state.save(`statestore`, state)
        console.log("Saving Order: ", order)
    });
  
    await server.start();
    // ################ CODEBLOCK 4 - END ################
  }
  
  // call the process function
  main().catch(e => console.error(e));