# Role Hierarchy Validation System

**Implementation Date:** July 17, 2026  
**Status:** Complete  
**Task:** #5 - Implement Role Hierarchy Validation System  

## Executive Summary

The Role Hierarchy Validation System provides comprehensive role-based access control with hierarchical role management, preventing privilege escalation and ensuring consistent authorization across the entire platform. This system addresses Critical Issue C2 (Authorization Bypass) by implementing enterprise-grade role hierarchy validation.

## System Architecture

### Core Components

1. **Role Hierarchy Engine** (`role-hierarchy.ts`)
   - Hierarchical role structure with clear privilege levels
   - Permission inheritance and escalation controls
   - Dynamic role transition validation
   - Performance optimizations with caching

2. **Role Validation Middleware** (`role-validation-middleware.ts`)
   - Middleware factory functions for role validation
   - Context enhancement with role hierarchy utilities
   - Batch validation for role operations
   - Reporting and analytics for role validation

3. **Role Management Service** (`role-management-service.ts`)
   - High-level operations for role management
   - Bulk role assignment with validation
   - Role recommendation engine
   - Audit and analytics capabilities

4. **Integration Layer** (`role-hierarchy-integration.ts`)
   - System integrity validation
   - Migration and upgrade utilities
   - Performance monitoring
   - Testing and validation utilities

## Role Hierarchy Structure

### System Roles
- **SYSTEM_ADMIN** (Level 1000) - Platform super admin
- **ADMIN** (Level 900) - Platform admin

### Company Roles (Hierarchical)
- **OWNER** (Level 800) - Company owner, full company control
- **ADMIN_OPERATOR** (Level 700) - Company admin, nearly full access
- **MANAGER** (Level 600) - Operations manager, operational control
- **OPERATIONS** (Level 400) - Operations staff, daily operations
- **FINANCE** (Level 350) - Finance staff, financial operations
- **SUPPORT** (Level 300) - Customer support, booking management
- **DRIVER** (Level 200) - Bus driver, limited operational access

### External Roles
- **OPERATOR** (Level 100) - General operator (legacy)
- **CUSTOMER** (Level 50) - Regular customer
- **GUEST** (Level 10) - Anonymous/guest access

## Key Features

### 1. Role Transition Validation
```typescript
// Example: Validate role transition
const validation = await roleHierarchy.validateRoleTransition(
  ctx,
  targetUserId,
  'OPERATIONS',
  'MANAGER',
  companyId
);

if (!validation.isValid) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: validation.reason
  });
}
```

### 2. Enhanced Context Integration
```typescript
// Enhanced context with role hierarchy utilities
const enhancedCtx: EnhancedContext = {
  ...ctx,
  roleHierarchy: {
    canAssignRole: (targetRole) => boolean,
    canModifyUser: (targetRole, newRole?) => boolean,
    getRoleLevel: () => number,
    getAssignableRoles: () => string[],
    validateRoleTransition: (userId, currentRole, newRole) => Promise<ValidationResult>
  }
}
```

### 3. TRPC Procedure Integration
```typescript
// Role hierarchy-based procedures
export const roleTransitionProcedure = authorizedProcedure.use(async ({ ctx, next, rawInput }) => {
  // Automatic role transition validation
  const validation = await ctx.roleHierarchy.validateRoleTransition(...);
  if (!validation.isValid) {
    throw new TRPCError({ code: "FORBIDDEN", message: validation.reason });
  }
  return next();
});
```

## Security Features

### 1. Privilege Escalation Prevention
- Role hierarchy levels prevent lower roles from assigning higher roles
- Valid role transitions matrix controls allowed role changes
- Enhanced validation for sensitive operations (ownership transfer, admin assignment)

### 2. Company Access Control
- Role validation scoped to company context
- Resource ownership verification
- Cross-company access prevention

### 3. Audit and Monitoring
- Comprehensive activity logging for all role changes
- Role transition history and analytics
- System integrity validation and issue detection

## Implementation Details

### Enhanced TRPC Procedures Integration

The system integrates with the existing enhanced TRPC procedures to provide seamless role validation:

```typescript
// File: apps/web/trpc/enhanced-procedures.ts
export interface EnhancedContext extends Context {
  roleHierarchy: {
    canAssignRole: (targetRole: string) => boolean;
    canModifyUser: (targetRole: string, newRole?: string) => boolean;
    validateRoleTransition: (userId, currentRole, newRole, companyId?) => Promise<ValidationResult>;
    // ... other utilities
  };
}
```

### Staff Router Integration

Updated staff management operations to use role hierarchy validation:

```typescript
// File: apps/web/trpc/routers/staff.ts
updateRole: staffManagementProcedure
  .input(UpdateRoleSchema)
  .mutation(async ({ ctx, input }) => {
    // Enhanced role validation with hierarchy checking
    const { targetStaff } = await validateStaffAccess(ctx, input.memberId, 'modify');
    
    if (currentOperator && !canModifyRole(currentOperator.role, input.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Cannot assign ${input.role} role - insufficient permissions.`
      });
    }
    // ... rest of implementation
  });
```

## Validation and Testing

### System Integrity Validation
```typescript
const validation = await validateRoleHierarchyIntegrity(prisma);
// Returns:
// - isValid: boolean
// - issues: Array of detected issues
// - summary: Statistics and counts
```

### Automated Issue Resolution
```typescript
const fixes = await fixRoleHierarchyIssues(prisma, {
  autoAssignOwners: true,
  consolidateOwners: true,
  fixOrphanedOperators: true
});
```

### Migration Support
```typescript
const migration = await migrateToRoleHierarchy(prisma, {
  dryRun: false,
  backupExisting: true
});
```

## Performance Optimizations

1. **Caching Strategy**
   - Role validation results cached for 10 minutes
   - Permission computations cached per context
   - Hierarchy calculations optimized

2. **Batch Operations**
   - Bulk role validation for mass operations
   - Transaction-based role changes
   - Efficient database queries

3. **Lazy Loading**
   - Role hierarchy utilities loaded on demand
   - Context enhancement only when needed

## Security Considerations

### Data Protection
- Sensitive role operations require enhanced validation
- Audit trail for all role changes
- Protection against privilege escalation attacks

### Business Logic Security
- Role transitions follow business rules
- Company ownership validation
- Resource access scoped by role level

### Error Handling
- Graceful degradation for validation failures
- Clear error messages without exposing system internals
- Fallback to secure defaults

## Monitoring and Analytics

### Role Distribution Analysis
- Real-time role distribution monitoring
- Role balance recommendations
- Hierarchy health scoring (0-100)

### Performance Metrics
- Role validation performance tracking
- Cache hit rates and optimization opportunities
- System load analysis

### Security Alerts
- Privilege escalation attempts
- Unusual role transition patterns
- System integrity violations

## Integration Examples

### 1. Staff Management Operations
```typescript
// Enhanced staff role updates with hierarchy validation
const result = await roleManagementService.assignRole(ctx, userId, 'MANAGER', {
  companyId: 'company-id',
  reason: 'Promotion for excellent performance',
  notifyUser: true
});
```

### 2. Bulk Role Operations
```typescript
// Bulk role assignment with validation
const bulkResult = await roleManagementService.bulkAssignRoles(ctx, assignments, {
  companyId: 'company-id',
  continueOnError: false,
  validateOnly: false
});
```

### 3. Role Analytics
```typescript
// Get role transition analytics
const analytics = await roleManagementService.getRoleAnalytics(companyId, {
  timeRange: '30d',
  includeMetrics: true
});
```

## Files Modified/Created

### Core System Files
- `apps/web/lib/role-hierarchy.ts` - Main hierarchy engine
- `apps/web/lib/role-validation-middleware.ts` - Middleware and validation
- `apps/web/lib/role-management-service.ts` - High-level management service
- `apps/web/lib/role-hierarchy-integration.ts` - Integration utilities

### Enhanced Procedures Integration
- `apps/web/trpc/enhanced-procedures.ts` - Enhanced with role hierarchy context
- `apps/web/trpc/routers/staff.ts` - Updated with hierarchy validation

### Documentation
- `@artifacts/role-hierarchy-validation-system.md` - This documentation

## Testing Strategy

### Unit Tests
- Role hierarchy calculations
- Permission validation logic
- Role transition validation

### Integration Tests
- TRPC procedure integration
- Database transaction integrity
- Cross-system validation

### Performance Tests
- Large-scale role validation
- Concurrent access patterns
- Cache performance optimization

## Future Enhancements

### 1. Advanced Analytics
- Machine learning for role assignment recommendations
- Predictive analytics for role transitions
- Advanced security pattern detection

### 2. Enhanced UI Integration
- Real-time role hierarchy visualization
- Interactive role management dashboard
- Role-based UI component rendering

### 3. External System Integration
- LDAP/Active Directory synchronization
- SSO role mapping
- Third-party authorization providers

## Security Compliance

### Industry Standards
- Follows RBAC (Role-Based Access Control) best practices
- Implements principle of least privilege
- Supports audit requirements for compliance

### Data Privacy
- Role information handled according to privacy regulations
- Audit logs include necessary compliance information
- User consent and notification for role changes

## Conclusion

The Role Hierarchy Validation System provides enterprise-grade role management with comprehensive validation, preventing privilege escalation and ensuring consistent authorization across the platform. The system integrates seamlessly with existing TRPC procedures while providing enhanced security and audit capabilities.

This implementation addresses Critical Issue C2 (Authorization Bypass) by establishing a robust, hierarchical role system that prevents unauthorized access and ensures proper role-based permissions throughout the application.

**Status:** ✅ Complete - Task #5 Implemented Successfully