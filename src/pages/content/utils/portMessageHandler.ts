export class chromePortMsgHandler {
  queue: any[];
  port: chrome.runtime.Port;
  processing: boolean;

  constructor(port: chrome.runtime.Port) {
    this.queue = [];
    this.port = port;
    this.processing = false;

    // Listen for a message from the background script indicating it has finished processing
    // in background.ts, port.postMessage({ done_process_entry: true }) is necessary for next message to be processed

    this.port.onMessage.addListener((response: any) => {
      if (response.done_process_entry) {
        this.processing = false;
        this.processQueue(); // Process the next message in the queue
      }
    });
  }

  enqueueMessage(message: any) {
    this.queue.push(message);
    this.processQueue();
  }

  processQueue() {
    if (!this.processing && this.queue.length > 0) {
      this.processing = true;
      const message = this.queue.shift();
      this.port.postMessage(message);
    }
  }
}