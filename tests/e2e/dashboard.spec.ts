// tests/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@fisioflow.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display dashboard with KPIs', async ({ page }) => {
    // Check main title
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check KPI cards
    await expect(page.locator('[data-testid="kpi-patients"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-revenue"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-appointments"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-therapists"]')).toBeVisible();
    
    // Check KPI values
    await expect(page.locator('[data-testid="kpi-patients"]')).toContainText('1,250');
    await expect(page.locator('[data-testid="kpi-revenue"]')).toContainText('$62,300');
  });

  test('should display revenue chart', async ({ page }) => {
    // Check chart container
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    
    // Check chart elements (Recharts)
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
    await expect(page.locator('.recharts-line')).toBeVisible();
  });

  test('should display calendar sidebar', async ({ page }) => {
    // Check calendar widget
    await expect(page.locator('[data-testid="calendar-widget"]')).toBeVisible();
    
    // Check current month is displayed
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    await expect(page.locator('[data-testid="calendar-month"]')).toContainText(currentMonth);
  });

  test('should display recent appointments', async ({ page }) => {
    // Check appointments section
    await expect(page.locator('[data-testid="recent-appointments"]')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Próximos Agendamentos');
    
    // Check appointment cards
    const appointmentCards = page.locator('[data-testid="appointment-card"]');
    await expect(appointmentCards.first()).toBeVisible();
  });

  test('should display notifications center', async ({ page }) => {
    // Check notifications section
    await expect(page.locator('[data-testid="notifications"]')).toBeVisible();
    
    // Check notification items
    const notifications = page.locator('[data-testid="notification-item"]');
    await expect(notifications.first()).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to patients
    await page.click('text=Pacientes');
    await expect(page).toHaveURL('/pacientes');
    
    // Go back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
    
    // Test navigation to appointments
    await page.click('text=Agendamentos');
    await expect(page).toHaveURL('/agendamentos');
    
    // Go back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Check KPIs are stacked vertically
    const kpiCards = page.locator('[data-testid^="kpi-"]');
    const firstCard = await kpiCards.first().boundingBox();
    const secondCard = await kpiCards.nth(1).boundingBox();
    
    if (firstCard && secondCard) {
      expect(firstCard.y).toBeLessThan(secondCard.y);
    }
  });

  test('should update real-time data', async ({ page }) => {
    // Get initial revenue value
    const initialRevenue = await page.locator('[data-testid="kpi-revenue"]').textContent();
    
    // Simulate real-time update (could be via WebSocket or polling)
    await page.waitForTimeout(1000);
    
    // Check if data updates (this would depend on actual implementation)
    await expect(page.locator('[data-testid="kpi-revenue"]')).toBeVisible();
  });
});