const { createClerkClient } = require('@clerk/clerk-sdk-node');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * Protect middleware: Verifies the Clerk token and populates req.user with role information
 */
const protect = async (req, res, next) => {
  console.log('[Middleware] Entering protect middleware...');
  const { userId } = req.auth;

  if (!userId) {
    return res.status(401).json({ 
        status: 'error', 
        message: 'Not authorized, no session found' 
    });
  }

  try {
    // Fetch user from Clerk to get the most up-to-date metadata
    const clerkUser = await clerkClient.users.getUser(userId);
    
    // Populate req.user for downstream middleware
    req.user = {
      id: userId,
      role: clerkUser.publicMetadata?.role || 'patient',
      email: clerkUser.emailAddresses[0]?.emailAddress
    };
    
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error.message);
    res.status(401).json({ 
        status: 'error', 
        message: 'Not authorized, token failed' 
    });
  }
};

/**
 * Admin middleware: Checks if req.user has the 'admin' role
 */
const admin = (req, res, next) => {
  console.log(`[Middleware] Entering admin middleware. User role: ${req.user?.role}`);
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
        status: 'error', 
        message: 'Access denied: Admin privileges required' 
    });
  }
};

module.exports = { protect, admin };
