/**
 * Security Testing Setup
 * 
 * Global setup and configuration for security tests including
 * environment preparation, mock configuration, and test utilities.
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// Global Test Environment Setup
// ============================================================================

beforeAll(() => {
  // Set security testing environment
  process.env.NODE_ENV = 'test';
  process.env.SECURITY_TESTING = 'true';
  
  // Disable console.log in tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  }
  
  // Mock external dependencies that shouldn't be called during security tests
  vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      back: vi.fn(),
      pathname: '/test'
    })),
    usePathname: vi.fn(() => '/test')
  }));
  
  // Mock Next.js session
  vi.mock('next-auth/react', () => ({
    useSession: vi.fn(() => ({
      data: {
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Test User'
        }
      },
      status: 'authenticated'
    }))
  }));
  
  // Mock TRPC client
  vi.mock('@/lib/trpc/client', () => ({
    trpc: {
      staff: {
        updateRole: {
          useMutation: vi.fn(() => ({
            mutateAsync: vi.fn(),
            isLoading: false,
            error: null
          }))
        },
        createInvitation: {
          useMutation: vi.fn(() => ({
            mutateAsync: vi.fn(),
            isLoading: false,
            error: null
          }))
        },
        updateStatus: {
          useMutation: vi.fn(() => ({
            mutateAsync: vi.fn(),
            isLoading: false,
            error: null
          }))
        }
      }
    }
  }));
  
  console.log('🔐 Security testing environment initialized');
});

afterAll(() => {
  // Cleanup global mocks
  vi.clearAllMocks();
  vi.resetAllMocks();
  
  console.log('🔐 Security testing environment cleaned up');
});

// ============================================================================
// Per-Test Setup
// ============================================================================

beforeEach(() => {
  // Reset timers for timing attack tests
  vi.useFakeTimers();
  
  // Clear any cached authorization state
  if (global.gc) {
    global.gc(); // Force garbage collection if available
  }
});

afterEach(() => {
  // Restore real timers
  vi.useRealTimers();
  
  // Clear all mocks between tests
  vi.clearAllMocks();
});

// ============================================================================
// Security Testing Utilities
// ============================================================================

/**
 * Security test helper utilities
 */
export const SecurityTestUtils = {
  /**
   * Create a mock authorization context
   */
  createMockContext: (overrides?: any) => ({
    user: {
      id: 'test-user',
      email: 'test@example.com',
      name: 'Test User',
      ...overrides?.user
    },
    operator: {
      id: 'test-operator',
      role: 'SUPPORT',
      status: 'ACTIVE',
      companyId: 'test-company',
      ...overrides?.operator
    },
    session: {
      user: { id: 'test-user' },
      ...overrides?.session
    },
    companyId: 'test-company',
    ...overrides
  }),

  /**
   * Generate malicious input test cases
   */
  getMaliciousInputs: () => ({
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'; UPDATE users SET role='OWNER'; --",
      "' UNION SELECT * FROM admin_users--"
    ],
    xss: [
      '<script>alert("xss")</script>',
      'javascript:alert(1)',
      '<img src="x" onerror="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>'
    ],
    commandInjection: [
      'admin; rm -rf /',
      'admin && cat /etc/passwd',
      'admin | whoami',
      'admin$(id)',
      'admin`whoami`'
    ],
    pathTraversal: [
      '../../etc/passwd',
      '../../../windows/system32/config/sam',
      '....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ],
    prototypePoison: [
      { __proto__: { isAdmin: true } },
      { constructor: { prototype: { role: 'OWNER' } } },
      JSON.parse('{"__proto__":{"role":"ADMIN"}}')
    ]
  }),

  /**
   * Measure execution time for timing attack tests
   */
  measureExecutionTime: async (fn: () => any): Promise<number> => {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    return Number(end - start) / 1_000_000; // Convert to milliseconds
  },

  /**
   * Generate large payloads for DoS testing
   */
  generateLargePayload: (size: number): string => {
    return 'A'.repeat(size);
  },

  /**
   * Create concurrent test scenarios
   */
  createConcurrentRequests: (count: number, fn: () => any): Promise<any[]> => {
    const requests = Array.from({ length: count }, () => fn());
    return Promise.all(requests);
  },

  /**
   * Validate security response format
   */
  validateSecurityResponse: (response: any) => {
    // Check that response doesn't contain sensitive information
    const sensitiveFields = ['password', 'secret', 'key', 'token', 'private'];
    const responseStr = JSON.stringify(response).toLowerCase();
    
    for (const field of sensitiveFields) {
      if (responseStr.includes(field)) {
        throw new Error(`Security violation: Response contains sensitive field '${field}'`);
      }
    }
    
    return true;
  },

  /**
   * Assert consistent timing (for timing attack prevention)
   */
  assertConsistentTiming: (timings: number[], maxVariance: number = 2.0) => {
    if (timings.length < 2) return true;
    
    const avg = timings.reduce((a, b) => a + b, 0) / timings.length;
    const maxDeviation = Math.max(...timings.map(t => Math.abs(t - avg)));
    const variance = maxDeviation / avg;
    
    if (variance > maxVariance) {
      throw new Error(`Timing variance too high: ${variance.toFixed(2)} (max: ${maxVariance})`);
    }
    
    return true;
  }
};

// ============================================================================
// Security Test Matchers
// ============================================================================

/**
 * Custom Vitest matchers for security testing
 */
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toBeSecurelyRejected(): any;
      toHaveConsistentTiming(): any;
      toNotLeakSensitiveData(): any;
    }
  }
}

// Extend expect with security-specific matchers
expect.extend({
  toBeSecurelyRejected(received: any) {
    const pass = received === false || (received && received.success === false);
    
    if (pass) {
      return {
        message: () => `Expected ${received} not to be securely rejected`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected ${received} to be securely rejected (return false or {success: false})`,
        pass: false,
      };
    }
  },
  
  toHaveConsistentTiming(received: number[]) {
    try {
      SecurityTestUtils.assertConsistentTiming(received);
      return {
        message: () => `Expected timings to be inconsistent`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected consistent timing but found: ${error}`,
        pass: false,
      };
    }
  },
  
  toNotLeakSensitiveData(received: any) {
    try {
      SecurityTestUtils.validateSecurityResponse(received);
      return {
        message: () => `Expected response to leak sensitive data`,
        pass: true,
      };
    } catch (error) {
      return {
        message: () => `Expected no sensitive data leak but found: ${error}`,
        pass: false,
      };
    }
  }
});

// ============================================================================
// Global Security Test Configuration
// ============================================================================

/**
 * Global security test configuration
 */
export const SECURITY_TEST_CONFIG = {
  // Maximum acceptable timing variance for timing attack tests
  MAX_TIMING_VARIANCE: 2.0,
  
  // Maximum payload sizes for DoS testing
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
  
  // Maximum test execution time
  MAX_EXECUTION_TIME: 5000, // 5 seconds
  
  // Performance thresholds
  PERFORMANCE_THRESHOLDS: {
    PERMISSION_CHECK: 10, // 10ms
    ROLE_VALIDATION: 20, // 20ms
    BATCH_OPERATIONS: 100, // 100ms per 1000 operations
  },
  
  // Security validation levels
  SECURITY_LEVELS: {
    CRITICAL: ['OWNER', 'ADMIN'],
    HIGH: ['MANAGER'],
    MEDIUM: ['OPERATIONS'],
    LOW: ['SUPPORT', 'VIEWER']
  }
};

// Export utilities for use in tests
export { SecurityTestUtils as default };