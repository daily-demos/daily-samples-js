# Connectivity tests sample

This small sample app shows the use of Daily's custom session data feature. This feature enables developers to set shared state for the entire session. 

In this sample, participants of a Daily-powered video call can click a "Tell a Joke!" button to set a randomly-generated dad joke for everyone in the call. 

![Two video call participants with a joke](screenshot.png)

## Running the demo locally

Run the following commands in your terminal:

```bash
git clone git@github.com:daily-demos/daily-samples-js.git
cd daily-samples-js/samples/client-sdk/custom-session-data
npm i
npm run dev
```

Then, navigate to the port shown in your terminal output. This will likely be `http://localhost:8080`