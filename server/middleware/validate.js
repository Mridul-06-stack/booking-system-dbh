const { z } = require('zod');

exports.validate = (schema) => (req, res, next) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Invalid input data',
                errors: err.errors.map(e => ({ field: e.path[0], message: e.message }))
            });
        }
        next(err);
    }
};
