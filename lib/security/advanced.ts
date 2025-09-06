// lib/security/advanced.ts
import { NextRequest, NextResponse } from 'next/server';
import { structuredLogger } from '../monitoring/logger';
import { BusinessMetrics } from '../monitoring/metrics';
import { cache } from '../cache';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    preventReuse: number;
  };
  ipWhitelist?: string[];
  ipBlacklist: string[];
  bruteForceProtection: boolean;
  suspiciousActivityThreshold: number;
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    preventReuse: 5,
  },
  ipBlacklist: [],
  bruteForceProtection: true,
  suspiciousActivityThreshold: 10,
};

export interface SecurityAlert {
  type:
    | 'login_failure'
    | 'suspicious_activity'
    | 'unauthorized_access'
    | 'data_breach_attempt'
    | 'malicious_payload';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  endpoint?: string;
  payload?: any;
  timestamp: Date;
  description: string;
  mitigationAction?: string;
}

export interface SecurityReport {
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalAlerts: number;
    criticalAlerts: number;
    blockedAttempts: number;
    uniqueAttackers: number;
  };
  topThreats: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  ipAnalysis: Array<{
    ip: string;
    country?: string;
    attempts: number;
    blocked: boolean;
    riskScore: number;
  }>;
  recommendations: string[];
}

class AdvancedSecurityService {
  private config: SecurityConfig;
  private failedAttempts: Map<
    string,
    { count: number; lastAttempt: Date; lockedUntil?: Date }
  > = new Map();
  private suspiciousIPs: Map<
    string,
    { score: number; activities: string[]; firstSeen: Date }
  > = new Map();
  private sessionTokens: Map<
    string,
    { userId: string; createdAt: Date; expiresAt: Date }
  > = new Map();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  // Enhanced Rate Limiting with IP Intelligence
  async checkRateLimit(
    request: NextRequest
  ): Promise<{ allowed: boolean; reason?: string }> {
    const ip = this.getClientIP(request);
    const endpoint = request.nextUrl.pathname;

    // Check IP blacklist
    if (this.config.ipBlacklist.includes(ip)) {
      this.recordSecurityAlert({
        type: 'unauthorized_access',
        severity: 'high',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || '',
        endpoint,
        description: 'Request from blacklisted IP address',
        mitigationAction: 'Request blocked',
      });

      return { allowed: false, reason: 'IP blacklisted' };
    }

    // Check IP whitelist (if configured)
    if (this.config.ipWhitelist && this.config.ipWhitelist.length > 0) {
      if (!this.config.ipWhitelist.includes(ip)) {
        return { allowed: false, reason: 'IP not whitelisted' };
      }
    }

    // Check for suspicious activity patterns
    const suspiciousActivity = await this.detectSuspiciousActivity(request);
    if (suspiciousActivity.isSuspicious) {
      this.recordSecurityAlert({
        type: 'suspicious_activity',
        severity: suspiciousActivity.severity,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || '',
        endpoint,
        description: suspiciousActivity.reason,
        mitigationAction: suspiciousActivity.action,
      });

      if (suspiciousActivity.shouldBlock) {
        return { allowed: false, reason: suspiciousActivity.reason };
      }
    }

    return { allowed: true };
  }

  // Advanced Authentication Security
  async validateLogin(
    email: string,
    password: string,
    request: NextRequest
  ): Promise<{
    success: boolean;
    userId?: string;
    reason?: string;
    requiresMFA?: boolean;
  }> {
    const ip = this.getClientIP(request);
    const attemptKey = `${ip}:${email}`;

    // Check for account lockout
    const lockoutStatus = this.checkAccountLockout(attemptKey);
    if (lockoutStatus.isLocked) {
      this.recordSecurityAlert({
        type: 'login_failure',
        severity: 'medium',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || '',
        description: `Login attempt on locked account: ${email}`,
        mitigationAction: 'Login blocked due to lockout',
      });

      return {
        success: false,
        reason: `Account locked until ${lockoutStatus.lockedUntil?.toLocaleString()}`,
      };
    }

    // Simulate password validation (replace with real auth logic)
    const isValidPassword = await this.validatePassword(email, password);

    if (!isValidPassword) {
      this.recordFailedAttempt(attemptKey);

      this.recordSecurityAlert({
        type: 'login_failure',
        severity: 'low',
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || '',
        description: `Failed login attempt for email: ${email}`,
        mitigationAction: 'Recorded failed attempt',
      });

      return {
        success: false,
        reason: 'Invalid credentials',
      };
    }

    // Successful login - clear failed attempts
    this.failedAttempts.delete(attemptKey);

    // Check if MFA is required based on risk assessment
    const riskAssessment = await this.assessLoginRisk(request, email);

    BusinessMetrics.recordBusinessEvent('successful_login', {
      email,
      ipAddress: ip,
      riskLevel: riskAssessment.level,
    });

    return {
      success: true,
      userId: 'user-id', // Replace with real user ID
      requiresMFA: riskAssessment.requiresMFA,
    };
  }

  // Password Security Validation
  validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    if (password.length < this.config.passwordPolicy.minLength) {
      errors.push(
        `Password must be at least ${this.config.passwordPolicy.minLength} characters long`
      );
    } else {
      score += 10;
    }

    if (
      this.config.passwordPolicy.requireUppercase &&
      !/[A-Z]/.test(password)
    ) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 10;
    }

    if (
      this.config.passwordPolicy.requireLowercase &&
      !/[a-z]/.test(password)
    ) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 10;
    }

    if (this.config.passwordPolicy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 10;
    }

    if (
      this.config.passwordPolicy.requireSpecialChars &&
      !/[!@#$%^&*(),.?":{}|<>]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 10;
    }

    // Additional complexity checks
    if (password.length >= 16) score += 10;
    if (/[A-Z].*[A-Z]/.test(password)) score += 5; // Multiple uppercase
    if (/\d.*\d.*\d/.test(password)) score += 5; // Multiple numbers
    if (!/(.)\1{2,}/.test(password)) score += 10; // No repeated characters

    // Check for common passwords or patterns
    const commonPatterns = ['123456', 'password', 'qwerty', 'admin'];
    if (
      !commonPatterns.some(pattern => password.toLowerCase().includes(pattern))
    ) {
      score += 15;
    } else {
      errors.push('Password contains common patterns');
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: Math.min(score, 100),
    };
  }

  // Input Sanitization and Validation
  sanitizeInput(
    input: any,
    type: 'string' | 'number' | 'email' | 'phone' | 'json' = 'string'
  ): any {
    if (input === null || input === undefined) return input;

    switch (type) {
      case 'string':
        return String(input)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
          .replace(/[<>]/g, '') // Remove HTML tags
          .replace(/['"\\]/g, '') // Remove quotes and backslashes
          .trim()
          .slice(0, 1000); // Limit length

      case 'number':
        const num = Number(input);
        return isNaN(num) ? 0 : Math.max(-999999999, Math.min(999999999, num));

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const cleanEmail = String(input).toLowerCase().trim();
        return emailRegex.test(cleanEmail) ? cleanEmail : '';

      case 'phone':
        return String(input)
          .replace(/[^\d+\-\s()]/g, '')
          .slice(0, 20);

      case 'json':
        if (typeof input === 'string') {
          try {
            return JSON.parse(input);
          } catch {
            return null;
          }
        }
        return input;

      default:
        return input;
    }
  }

  // SQL Injection Detection
  detectSQLInjection(input: string): {
    isMalicious: boolean;
    confidence: number;
    patterns: string[];
  } {
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)|(\bselect\b.*\bunion\b)/gi,
      /(\bdrop\b.*\btable\b)|(\btable\b.*\bdrop\b)/gi,
      /(\binsert\b.*\binto\b)|(\binto\b.*\binsert\b)/gi,
      /(\bdelete\b.*\bfrom\b)|(\bfrom\b.*\bdelete\b)/gi,
      /(\bupdate\b.*\bset\b)|(\bset\b.*\bupdate\b)/gi,
      /'.*(\bor\b|\band\b).*'.*=/gi,
      /--.*$/gm,
      /\/\*.*\*\//gm,
      /;\s*(\bdrop\b|\bdelete\b|\bupdate\b)/gi,
    ];

    const detectedPatterns: string[] = [];
    let confidence = 0;

    sqlPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        detectedPatterns.push(`SQL_PATTERN_${index + 1}`);
        confidence += 15;
      }
    });

    return {
      isMalicious: confidence > 30,
      confidence: Math.min(confidence, 100),
      patterns: detectedPatterns,
    };
  }

  // XSS Detection
  detectXSS(input: string): {
    isMalicious: boolean;
    confidence: number;
    patterns: string[];
  } {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^>]*>/gi,
      /<object\b[^>]*>/gi,
      /<embed\b[^>]*>/gi,
      /expression\s*\(/gi,
      /@import/gi,
      /vbscript:/gi,
      /mocha:/gi,
      /livescript:/gi,
    ];

    const detectedPatterns: string[] = [];
    let confidence = 0;

    xssPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        detectedPatterns.push(`XSS_PATTERN_${index + 1}`);
        confidence += 20;
      }
    });

    return {
      isMalicious: confidence > 40,
      confidence: Math.min(confidence, 100),
      patterns: detectedPatterns,
    };
  }

  // Security Audit and Reporting
  async generateSecurityReport(days: number = 30): Promise<SecurityReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get security alerts from cache or database
    const alerts = await this.getSecurityAlerts(startDate, endDate);

    const criticalAlerts = alerts.filter(
      alert => alert.severity === 'critical'
    );
    const uniqueIPs = new Set(alerts.map(alert => alert.ipAddress));

    // Analyze threat types
    const threatCounts = alerts.reduce(
      (acc, alert) => {
        acc[alert.type] = (acc[alert.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topThreats = Object.entries(threatCounts)
      .map(([type, count]) => ({
        type,
        count,
        percentage: Math.round((count / alerts.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // IP Analysis
    const ipAnalysis = Array.from(uniqueIPs)
      .map(ip => {
        const ipAlerts = alerts.filter(alert => alert.ipAddress === ip);
        const riskScore = this.calculateIPRiskScore(ipAlerts);

        return {
          ip,
          attempts: ipAlerts.length,
          blocked: this.config.ipBlacklist.includes(ip),
          riskScore,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    // Generate recommendations
    const recommendations = this.generateSecurityRecommendations(
      alerts,
      ipAnalysis
    );

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: criticalAlerts.length,
        blockedAttempts: alerts.filter(a =>
          a.mitigationAction?.includes('blocked')
        ).length,
        uniqueAttackers: uniqueIPs.size,
      },
      topThreats,
      ipAnalysis,
      recommendations,
    };
  }

  // Crypto and Hashing Utilities
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  encryptSensitiveData(data: string, key?: string): string {
    const encryptionKey =
      key ||
      process.env.ENCRYPTION_KEY ||
      crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  decryptSensitiveData(encryptedData: string, key?: string): string {
    const encryptionKey = key || process.env.ENCRYPTION_KEY || '';
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Private helper methods
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('remote-addr');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return realIP || remoteAddr || '127.0.0.1';
  }

  private async detectSuspiciousActivity(request: NextRequest): Promise<{
    isSuspicious: boolean;
    severity: 'low' | 'medium' | 'high';
    reason: string;
    shouldBlock: boolean;
    action: string;
  }> {
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    const endpoint = request.nextUrl.pathname;

    // Check for bot patterns
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /wget/i,
      /curl/i,
      /python/i,
      /java/i,
    ];

    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      return {
        isSuspicious: true,
        severity: 'low',
        reason: 'Automated bot detected',
        shouldBlock: false,
        action: 'Monitor and rate limit',
      };
    }

    // Check request frequency
    const ipData = this.suspiciousIPs.get(ip);
    if (ipData && ipData.score > this.config.suspiciousActivityThreshold) {
      return {
        isSuspicious: true,
        severity: 'high',
        reason: 'High frequency requests from same IP',
        shouldBlock: true,
        action: 'Block IP temporarily',
      };
    }

    return {
      isSuspicious: false,
      severity: 'low',
      reason: 'Normal activity',
      shouldBlock: false,
      action: 'Allow',
    };
  }

  private checkAccountLockout(attemptKey: string): {
    isLocked: boolean;
    lockedUntil?: Date;
  } {
    const attempt = this.failedAttempts.get(attemptKey);

    if (!attempt) return { isLocked: false };

    if (attempt.lockedUntil && attempt.lockedUntil > new Date()) {
      return { isLocked: true, lockedUntil: attempt.lockedUntil };
    }

    return { isLocked: false };
  }

  private recordFailedAttempt(attemptKey: string): void {
    const now = new Date();
    const existing = this.failedAttempts.get(attemptKey) || {
      count: 0,
      lastAttempt: now,
    };

    existing.count += 1;
    existing.lastAttempt = now;

    if (existing.count >= this.config.maxLoginAttempts) {
      existing.lockedUntil = new Date(
        now.getTime() + this.config.lockoutDuration
      );
    }

    this.failedAttempts.set(attemptKey, existing);
  }

  private async validatePassword(
    email: string,
    password: string
  ): Promise<boolean> {
    // Mock validation - replace with real database lookup
    return password === 'correctpassword123';
  }

  private async assessLoginRisk(
    request: NextRequest,
    email: string
  ): Promise<{
    level: 'low' | 'medium' | 'high';
    requiresMFA: boolean;
    factors: string[];
  }> {
    const factors: string[] = [];
    let riskScore = 0;

    // Check for unusual location (mock)
    const ip = this.getClientIP(request);
    if (ip !== '127.0.0.1') {
      factors.push('New IP address');
      riskScore += 20;
    }

    // Check time of access
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      factors.push('Unusual time of access');
      riskScore += 15;
    }

    // Check user agent
    const userAgent = request.headers.get('user-agent') || '';
    if (!userAgent.includes('Mozilla')) {
      factors.push('Unusual user agent');
      riskScore += 25;
    }

    const level = riskScore > 40 ? 'high' : riskScore > 20 ? 'medium' : 'low';

    return {
      level,
      requiresMFA: level === 'high' || riskScore > 35,
      factors,
    };
  }

  private recordSecurityAlert(alert: Omit<SecurityAlert, 'timestamp'>): void {
    const fullAlert: SecurityAlert = {
      ...alert,
      timestamp: new Date(),
    };

    structuredLogger.logSecurityEvent('Security alert recorded', fullAlert);
    BusinessMetrics.recordSecurityEvent(alert.type, alert.severity);

    // Store alert for reporting (implement persistence layer)
    // await this.storeSecurityAlert(fullAlert);
  }

  private async getSecurityAlerts(
    startDate: Date,
    endDate: Date
  ): Promise<SecurityAlert[]> {
    // Mock data - implement real persistence layer
    return [];
  }

  private calculateIPRiskScore(alerts: SecurityAlert[]): number {
    let score = 0;

    alerts.forEach(alert => {
      switch (alert.severity) {
        case 'critical':
          score += 40;
          break;
        case 'high':
          score += 25;
          break;
        case 'medium':
          score += 15;
          break;
        case 'low':
          score += 5;
          break;
      }
    });

    return Math.min(score, 100);
  }

  private generateSecurityRecommendations(
    alerts: SecurityAlert[],
    ipAnalysis: any[]
  ): string[] {
    const recommendations: string[] = [];

    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    if (criticalCount > 10) {
      recommendations.push('Consider implementing additional DDoS protection');
    }

    const highRiskIPs = ipAnalysis.filter(ip => ip.riskScore > 70);
    if (highRiskIPs.length > 5) {
      recommendations.push(
        'Review and update IP blacklist with high-risk addresses'
      );
    }

    const loginFailures = alerts.filter(a => a.type === 'login_failure').length;
    if (loginFailures > 50) {
      recommendations.push('Consider implementing CAPTCHA for login attempts');
    }

    recommendations.push('Regular security audit completed - monitor trends');

    return recommendations;
  }
}

// Export singleton instance
export const advancedSecurity = new AdvancedSecurityService();
export default advancedSecurity;
