import pool from "../config/db.js";

export const getLatestSensorData = async (req, res) => {
    try {
        // Get the latest sensor data
        const [sensorRows] = await pool.query(
            `SELECT * FROM C_SNDATA ORDER BY STIMEACQ DESC LIMIT 1`
        );

        if (sensorRows.length === 0) {
            return res.status(404).json({ error: "No sensor data found" });
        }

        const sensorData = sensorRows[0];
        const boardId = sensorData.SBOARDID;

        // Get the latest technical data for the same board
        const [techRows] = await pool.query(
            `SELECT * FROM C_TECHDATA WHERE TBOARDID = ? ORDER BY TTIMEACQ DESC LIMIT 1`,
            [boardId]
        );

        // Get the latest actuator data for the same board
        const [actuatorRows] = await pool.query(
            `SELECT * FROM C_ACTUATOR WHERE ABOARDID = ? ORDER BY ATIMEACQ DESC LIMIT 1`,
            [boardId]
        );

        const techData = techRows.length > 0 ? techRows[0] : {};
        const actuatorData = actuatorRows.length > 0 ? actuatorRows[0] : {};

        // Merge all three rows into a single object
        const combinedData = {
            ...sensorData,
            ...techData,
            ...actuatorData
        };

        res.json(combinedData);
    } catch (err) {
        console.error("Error fetching combined sensor data:", err);
        res.status(500).json({ error: "Failed to fetch sensor data" });
    }
};

