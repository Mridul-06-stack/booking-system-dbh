const WashingMachine = require('../models/WashingMachine');

const DEFAULT_HOSTEL = 'Dhauladhar Boys Hostel';
const DEFAULT_MACHINES = ['M1', 'M2'];

/**
 * Ensure the two hostel machines are available for students to select.
 * Upserts keep this safe to run every time the server starts without
 * overwriting an admin's status, location, or other machine details.
 */
async function ensureDefaultMachines() {
    await Promise.all(
        DEFAULT_MACHINES.map((machineNumber) =>
            WashingMachine.updateOne(
                { machineNumber, hostel: DEFAULT_HOSTEL },
                { $setOnInsert: { machineNumber, hostel: DEFAULT_HOSTEL, status: 'available' } },
                { upsert: true }
            )
        )
    );
}

module.exports = ensureDefaultMachines;
