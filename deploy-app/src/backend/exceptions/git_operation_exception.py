class GitOperationException(Exception):
    def __init__(self, operation, message, original_exception=None):
        super().__init__(f"Git operation '{operation}' failed: {message}")
        self.operation = operation
        self.original_exception = original_exception
