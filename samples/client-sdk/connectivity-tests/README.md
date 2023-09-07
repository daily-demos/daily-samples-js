# Connectivity tests sample

This small sample app shows the use of Daily's connectivity test methods. These methods enable developers to test a video call participant's network and WebSocket connectivity, and measure their connection quality. 

In this sample, participants do not join a Daily room. Instead, it shows a potential pre-call flow in which a camera is started and Daily's connectivity test methods are run.

![Video call participant testing their connectivity](screenshot.png)

## Running the demo locally

Run the following commands in your terminal:

```bash
git clone git@github.com:daily-demos/daily-samples-js.git
cd daily-samples-js/samples/client-sdk/connectivity-tests
npm i
npm run dev
```

Then, navigate to the port shown in your terminal output. This will likely be `http://localhost:8080`