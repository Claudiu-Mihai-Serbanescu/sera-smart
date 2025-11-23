import mqttClient from "../mqttClient.js";
import pool from "../config/db.js"; 

export const sendActuatorCommand = async (req, res) => {
    const { deviceId, actuator, value } = req.body;

    if (!deviceId || !actuator || value == null) {
        console.log('Missing fields:', req.body);
        return res.status(400).send("Missing fields");
    }

    const topic = `${deviceId}/control/${actuator}`;
    console.log(`Publishing to MQTT topic ${topic}: ${value}`);

    try {
        mqttClient.publish(topic, String(value), (err) => {
            if (err) {
                console.error('MQTT publish error:', err);
            }
        });

        await pool.query(
            `INSERT INTO C_COMMAND (BOARD_ID, ACTUATOR, LASTCOMM)
             VALUES (?, ?, ?)`,
            [deviceId, actuator, value]
        );

        console.log("Command inserted into C_COMMAND");
        res.send("Command sent and logged");
    } catch (err) {
        console.error('Error processing command:', err);
        res.status(500).send("Error processing command");
    }
};



