declare global {
    namespace Express {
        interface Request {
            userId?: string;  // Declare that userId is optional (it may or may not exist)
        }
    }
}