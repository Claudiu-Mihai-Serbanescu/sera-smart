// backend/mqttClient.js
import dotenv from "dotenv";
import mqtt from "mqtt";
import { handleMQTTMessage } from "./utilsothers/parseSensorPayload.js";

dotenv.config();

const url = process.env.MQTT_URL || "";

// client "dummy" by default – ca să nu crape importurile
let mqttClient = {
  connected: false,
  on() {},
  subscribe() {},
  publish() {},
  end() {},
};

if (url && url.toLowerCase() !== "off") {
  // Conectează-te doar dacă ai URL cu protocol (mqtt:// sau mqtts://)
  mqttClient = mqtt.connect(url, {
    clientId:
      process.env.MQTT_CLIENT_ID ||
      `backend_${Math.random().toString(16).slice(2, 8)}`,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
  });

  mqttClient.on("connect", () => {
    console.log("Connected to MQTT broker");

    mqttClient.subscribe("smart/led", (err) =>
      err
        ? console.error("sub smart/led:", err)
        : console.log("Subscribed smart/led")
    );

    const ingest = process.env.MQTT_TOPIC_IN || "greenhouse/ingest";
      mqttClient.subscribe(`${ingest}/#`, (err) => err ? console.error(`sub ${ingest}/#:`, err) : console.log(`Subscribed ${ingest}/#`));
  });

  mqttClient.on("message", handleMQTTMessage);
  mqttClient.on("error", (e) => console.error("MQTT error:", e));
} else {
  console.log("MQTT disabled (MQTT_URL not set or 'off')");
}

export default mqttClient;
