class PostMessageWrapper {
    private port: string; // Replace YourPortType with the actual type of your port

    constructor(port) {
        this.port = port;
    }

    postMyMessage(dbData: /* Your db_data type */, firstQuery: /* Your first_query type */) {
        const messageData = {
            msg_action: 'is_freight_processed',
            db_data: dbData,
            first_query: firstQuery,
        } as const;

        this.port.postMessage(messageData);
    }
}

// Usage
const myPort: YourPortType = /* Get your port instance */;
const postMessageWrapper = new PostMessageWrapper(myPort);

// Call postMyMessage with the appropriate types
postMessageWrapper.postMyMessage(/* Your db_data value */, /* Your first_query value */);
