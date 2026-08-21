const WashingMachine = require('../models/WashingMachine');

// GET /api/machines — list all machines (optionally filter by hostel)
exports.getMachines = async (req, res) => {
    try {
        const filter = {};
        if (req.query.hostel) filter.hostel = req.query.hostel;
        const machines = await WashingMachine.find(filter).sort({ hostel: 1, machineNumber: 1 });
        res.json({ success: true, machines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/machines — create machine (admin)
exports.createMachine = async (req, res) => {
    try {
        const { machineNumber, hostel, location } = req.body;
        const machine = await WashingMachine.create({ machineNumber, hostel, location });
        res.status(201).json({ success: true, machine });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// PUT /api/machines/:id — update machine (admin)
exports.updateMachine = async (req, res) => {
    try {
        const machine = await WashingMachine.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
        res.json({ success: true, machine });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// DELETE /api/machines/:id — remove machine (admin)
exports.deleteMachine = async (req, res) => {
    try {
        const machine = await WashingMachine.findByIdAndDelete(req.params.id);
        if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
        res.json({ success: true, message: 'Machine removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PATCH /api/machines/:id/status — toggle status (admin)
exports.toggleStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['available', 'in-use', 'maintenance'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }
        const machine = await WashingMachine.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });

        // Emit real-time update
        const io = req.app.get('io');
        if (io) io.emit('machine-status-update', machine);

        res.json({ success: true, machine });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
