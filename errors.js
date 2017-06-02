class RecordNotFound {
  constructor(message) {
    this.name = 'RecordDoesNotExist';
    this.message = message || 'Record does not exist';
    this.stack = new Error().stack;
  }
}

class NotNullViolation {
  constructor(message) {
    this.name = 'NotNullViolation';
    this.message = message || 'Record is missing required field';
    this.stack = new Error().stack;
  }
}

module.exports = {
  RecordNotFound,
  NotNullViolation
};
