class ApiError extends Error {
    constructor(
        statusCode,
        message = 'Something went wrong',
        errors = [],
        data = null,
        stack = ''
    ) {
        // Validate input types (optional)
        if (typeof statusCode !== 'number') {
            throw new TypeError('statusCode must be a number');
        }
        if (typeof message !== 'string') {
            throw new TypeError('message must be a string');
        }
        if (!Array.isArray(errors)) {
            throw new TypeError('errors must be an array');
        }

        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;
        this.data = data; // Allow setting additional data

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // Optional: Customize JSON representation
    toJSON() {
        return {
            statusCode: this.statusCode,
            message: this.message,
            success: this.success,
            errors: this.errors,
            data: this.data,
            stack: this.stack,
        };
    }
}

export default ApiError;

